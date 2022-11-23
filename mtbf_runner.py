# this would be used to run tests on single device
import os
import sys
import os.path
import subprocess
import signal
import time
import json
import re
import shutil
import socket
from zipfile import ZipFile
from ConfigParser import NoSectionError
from multiprocessing import Value, Process
from sonar.marionette_client.errors import SessionNotCreatedException
from sonar.logging import commandline
from sonar.device.adbmanager import DMError
from sonar.runner import KaiOSMarionetteTextTestRunner
from mtbf_handler import DYNAMIC_MODE, REPLAY_MODE, SEQUENTIAL_MODE
from utils.step_gen import RandomStepGen, ReplayStepGen, SequentialStepGen
from utils.mtbf_tplformatter import MTBFTbplFormatter
from gaiatest.runtests import GaiaTestRunner, GaiaTestArguments
from gaiatest.gaia_test import GaiaData, DEFAULT_SETTINGS
from gaiatest.utils.time_utils import time2sec
from gaiatest.utils.log_collecting_util import log_collecting_process, top_collecting_process, new_crash_monitor, \
    get_crash_times_by_device, procrank_collecting_process, battery_collecting_process

METRICS_COLLECTING_INTERVAL = 300

MTBF_PREFERENCE = {
    'dom.battery.test.dummy_thermal_status': True,
    'dom.battery.test.dummy_battery_level': True,
    'time.clock.automatic-update.enabled': False,
    'dom.push.serverURL': ''
}


class MTBFTextTestRunner(KaiOSMarionetteTextTestRunner):
    def run(self, test):
        result = self._makeResult()
        result.failfast = self.failfast
        result.buffer = self.buffer
        startTime = time.time()
        startTestRun = getattr(result, 'startTestRun', None)
        if startTestRun is not None:
            startTestRun()
        try:
            test(result)
        except (IOError, SessionNotCreatedException) as e:
            raise e
        finally:
            stopTestRun = getattr(result, 'stopTestRun', None)
            if stopTestRun is not None:
                stopTestRun()
        stopTime = time.time()
        if hasattr(result, 'time_taken'):
            result.time_taken = stopTime - startTime

        result.printLogs(test)
        return result


class MTBFTestRunner(GaiaTestRunner):

    textrunnerclass = MTBFTextTestRunner

    @property
    def capabilities(self):
        if self._capabilities:
            return self._capabilities

        self.marionette.start_session()
        self._capabilities = self.marionette.session_capabilities
        return self._capabilities


class MTBF_Runner:

    runner_class = MTBFTestRunner
    parser_class = GaiaTestArguments
    start_time = 0
    running_time = 0
    runner = None
    passed = 0
    failed = 0
    end = False
    tests_record_to_replay = []
    ori_dir = os.path.dirname(__file__)

    # time format: seconds
    def __init__(self, mode, time=None, replay_record_filename=None, **kwargs):
        self.mode = mode
        self.duration = time
        self.replay_record_filename = replay_record_filename
        self.crash_monitor_process = None
        self.log_collect_process = None
        self.battery_collect_process = None
        self.top_collect_process = None
        self.procrank_collect_process = None
        self.logger = None
        self.workspace = None
        self.conf = None
        self.args = None
        self.device_serial = None
        self.device_port = None
        self.test_log_fd = None
        self.runlist = None
        self.load_config(**kwargs)
        self.log_collecting = Value('b', True)
        self._init_settings = False
        self._voiceinput_ftu_count = False
        self._deinit_status = False

    def load_config(self, **kwargs):
        parser = self.parser_class(
            usage='%prog [options] test_file_or_dir <test_file_or_dir> ...'
        )
        opts = []
        for k, v in kwargs.iteritems():
            opts.append("--" + k)
            opts.append(v)

        args = parser.parse_args(sys.argv[1:] + opts)

        if not args.tests:
            args.tests = 'tests/test_dummy_case'  # avoid test case check, will add later

        parser.verify_usage(args)
        self.args = args

        # filter empty string in testvars list
        if self.args.testvars:
            filter(lambda x: x, self.args.testvars)

        # Get conf data
        mtbf_conf_file = os.getenv("MTBF_CONF")
        if mtbf_conf_file is None:
            raise Exception("You must assign MTBF_CONF as an environment variable!")
        try:
            with open(mtbf_conf_file) as json_file:
                self.conf = json.load(json_file)
        except IOError:
            raise Exception("IOError on file: %s" % mtbf_conf_file)

        self.workspace = self.conf['workspace']
        if not os.path.exists(self.workspace):
            raise Exception("Workspace does not exist! %s" % self.workspace)

        # Prepare output folder for achive logs or debugging information
        if self.conf['archive_folder']:
            if os.path.isabs(self.conf['archive_folder']):
                self.archive_folder = self.conf['archive_folder']
            else:
                self.archive_folder = os.path.join(self.workspace, self.conf['archive_folder'])
        else:
            self.archive_folder = os.path.join(self.workspace, "archive_folder")

        if not os.path.exists(self.archive_folder):
            os.makedirs(self.archive_folder)
        if not os.path.isdir(self.archive_folder):
            raise Exception("Archive folder[%s] has error" % self.archive_folder)

        # Prepare test log output
        try:
            if self.conf['test_log'] == 'stdout':
                self.test_log_fd = sys.stdout
            elif self.conf['test_log'] == 'file':
                filepath = os.path.join(self.workspace, self.archive_folder, 'test_log.txt')
                self.test_log_fd = open(filepath, 'w')
            else:
                raise Exception("You can only use 'stdout' or 'file' as your test_log target fd!")
        except KeyError:
            self.test_log_fd = sys.stdout

        # init logger
        commandline.log_formatters = {'tbpl': (MTBFTbplFormatter, "TBPL style log format")}
        commandline.add_logging_group(parser)
        logger = commandline.setup_logging(
            self.args.logger_name, self.args, defaults={"tbpl": self.test_log_fd})
        self.args.logger = logger
        self.logger = logger

        self.device_serial = self.conf['serial']
        self.device_port = self.conf['port']

        # Prepare path for record file for replay
        if self.replay_record_filename:
            self.replay_record_filename = os.path.join(self.workspace, self.replay_record_filename)

        if 'rootdir' not in self.conf or 'workspace' not in self.conf:
            self.logger.error('No rootdir or workspace set, please add in config')
            sys.exit(1)

        self.rootdir = self.conf['rootdir']
        if os.path.isabs(self.rootdir):
            if not os.path.exists(self.rootdir):
                self.logger.error("Rootdir doesn't exist: " + self.conf['rootdir'])
                sys.exit(1)
        else:
            self.rootdir = os.path.join(self.ori_dir, self.conf['rootdir'])
            if not os.path.exists(self.rootdir):
                self.logger.error("Rootdir doesn't exist: " + self.conf['rootdir'])
                sys.exit(1)

    # logging module should be defined here
    def start_logging(self):
        pass

    def run_test(self):
        self.logger.info("*******Starting MTBF*******")
        print "running in mode: {}".format(self.mode)
        self.crash_monitor_process = new_crash_monitor(self.device_serial, self.log_collecting, self.archive_folder)
        if 'logcat' in self.conf and self.conf['logcat']:
            self.log_collect_process = log_collecting_process(self.device_serial, self.log_collecting, self.archive_folder)
        else:
            self.log_collect_process = None

        if 'battery' in self.conf and self.conf['battery']:
            self.battery_collect_process = battery_collecting_process(self.device_serial, self.log_collecting, self.archive_folder)
        else:
            self.battery_collect_process = None

        if 'top' in self.conf and self.conf['top']:
            self.top_collect_process = top_collecting_process(self.device_serial, self.log_collecting, self.archive_folder)
        else:
            self.top_collect_process = None

        if 'procrank' in self.conf and self.conf['procrank']:
            self.procrank_collect_process = procrank_collecting_process(self.device_serial, self.log_collecting,
                                                              self.archive_folder)
        else:
            self.procrank_collect_process = None

        self.start_time = time.time()
        try:
            # print "in selecting modes"
            # print self.mode
            if self.mode == DYNAMIC_MODE:
                self.runlist = os.getenv("MTBF_RUNLIST")
                if not os.path.exists(self.runlist):
                    self.runlist = os.path.join(self.ori_dir, self.conf['runlist'])
                    if not os.path.exists(self.runlist):
                        self.logger.error(self.conf['runlist'], " does not exist.")
                        sys.exit(1)
                sg = RandomStepGen(root=self.rootdir, workspace=self.workspace, runlist=self.runlist)
                self._run_random_test(stepgen=sg)
            elif self.mode == REPLAY_MODE:
                sg = ReplayStepGen(workspace=self.workspace, replay=os.getenv("MTBF_REPLAY"))
                self._run_replay_test(stepgen=sg)
            elif self.mode == SEQUENTIAL_MODE:
                # print "in sequential mode"
                sg = SequentialStepGen(workspace=self.workspace, sequential=os.getenv("MTBF_SEQUENTIAL"))
                self._run_sequential_test(stepgen=sg)
        except Exception as e:
            self.logger.info("Got unexpected exception, and start MTBF summarize and cleanup process!")

            self._deinit()
            raise e

    def _run_random_test(self, stepgen):

        while True:
            get_dmerr = self._common_test_run(stepgen=stepgen)
            current_runtime = time.time() - self.start_time
            self.logger.info("\n*Current MTBF Time: %.3f seconds" % current_runtime)
            if self.runner.passed == 0 and get_dmerr is False or self.end:
                self.logger.info("Start normal MTBF summarize and cleanup process!")
                self._deinit()
                break

    def _run_replay_test(self, stepgen):
        """
        This mode is used for debug or specify a list to replay.
        """
        self._common_test_run(stepgen=stepgen)
        current_runtime = time.time() - self.start_time
        self.logger.info("\n*******Replay Test Complete!*******")
        self.logger.info("\n*Final MTBF Time for Replay Mode: %.3f seconds" % current_runtime)
        self._deinit()

    def _run_sequential_test(self, stepgen):
        """
        This mode is used to run a test set. In this test set, you can define a loop time for each test case.
        However, currently the passed and failed count would not be so accurate.
        """
        self._common_test_run(stepgen=stepgen)
        self.logger.info("*******Sequential Test Complete*******")
        self._deinit()

    def _common_test_run(self, stepgen):

        for i in range(0, 10):
            try:

                self.runner = self.runner_class(**vars(self.args))

                data_layer = GaiaData(self.runner.marionette)


                # print "self.init_settings = "
                # print self._init_settings

                if self._init_settings is False:
                    self.logger.info("Start to configure default setting and preference for MTBF testing!")
                    default_settings = DEFAULT_SETTINGS.copy()
                    for name, value in default_settings.items():
                        data_layer.set_setting(name, value)

                    default_mtbf_preference = MTBF_PREFERENCE.copy()

                    for name, value in default_mtbf_preference.items():

                        if type(value) is int:
                            data_layer.set_int_pref(name, value)
                        elif type(value) is bool:
                            data_layer.set_bool_pref(name, value)
                        else:
                            data_layer.set_char_pref(name, value)

                    # let volume warning threshold to untouchable value

                    data_layer.change_volume_warning_threshold("100")

                    #
                    # from gaiatest.apps.homescreen.app import Homescreen
                    # homescreen = Homescreen(self.runner.marionette)

                    # homescreen.skip_tutorial_page()


                    # update device time to the same with local time, mozTime API must in settings frame
                #     print "before settings"
                #     from gaiatest.apps.settings.app import Settings
                #     Settings(self.runner.marionette).launch()
                #     local_time = time.strftime('%Y-%m-%dT%H:%M', time.localtime(time.time()))
                #     self.runner.marionette.execute_script('navigator.mozTime.set(new Date(\'%s\'))' % local_time)
                #     self._init_settings = True
                #
                # # Set threshold to 0 to prevent voice input indicator displayed.
                # # See https://bugzilla.kaiostech.com/show_bug.cgi?id=54411
                # if self._voiceinput_ftu_count is False:
                #     data_layer.set_voiceinput_count_threshold(0)
                #     self._voiceinput_ftu_count = True
                break
            except NoSectionError as e:
                self.logger.error(e)
                continue
            except DMError as e:
                self.logger.error(e)
                continue
            except (IOError, SessionNotCreatedException, socket.error, socket.timeout) as e:
                self.logger.error(e)
                if self.mode == DYNAMIC_MODE:
                    self._wait_device_back_online(self.device_serial, self.device_port, reboot=True)
                elif 'interrupted system call' in str(e).lower():
                    # need to handle time_up signal which has been treat as kind of IOError
                    self.end = True
                    pass
                else:
                    raise e
            except Exception as e:
                self.logger.error(e)
                raise e
        #
        # if self._voiceinput_ftu_count is False:
        #     raise Exception("Not able to disable voice input FTU. Please retry or disable it manually via WebIDE.")

        get_dmerr = False
        tests = stepgen.generate()
        if self.mode != SEQUENTIAL_MODE:
            file_name, file_path = zip(*tests)
            self.tests_record_to_replay = self.tests_record_to_replay + list(file_path)

        try:
            if self.mode != SEQUENTIAL_MODE:
                self.runner.run_tests(file_path)
            else:
                self.runner.run_tests(tests)
        except NoSectionError as e:
            self.logger.error(e)
        except (DMError, SessionNotCreatedException, socket.error, socket.timeout) as e:
            self.logger.error(e)
            if self.mode == DYNAMIC_MODE:
                get_dmerr = True
                # the longest waiting time would be more than 10*10 seconds
                self._wait_device_back_online(self.device_serial, self.device_port, reboot=False)
        except IOError as e:
            self.logger.error(e)
            err_text = str(e).lower()
            if 'marionette' in err_text and 'connection' in err_text and 'lost' in err_text:
                if self.mode == DYNAMIC_MODE:
                    get_dmerr = True
                    self._wait_device_back_online(self.device_serial, self.device_port, reboot=True)
            elif 'interrupted system call' in err_text:
                # need to handle time_up signal which has been treat as part of IOError
                self.end = True
                pass
            else:
                raise e
        except Exception as e:
            self.logger.error(e)
            raise e

        self.runner.mixin_run_tests = []
        for res in self.runner.results:
            res.result_modifiers = []

        self.passed = self.runner.passed + self.passed
        self.failed = self.runner.failed + self.failed

        if self.mode == DYNAMIC_MODE:
            return get_dmerr

    def time_up(self, signum, frame):
        self.logger.info("Signal handler called with signal" + str(signum))
        self.end = True

    def _deinit(self):

        if self._deinit_status is False:

            virtual_home = os.getenv('VIRTUAL_ENV')

            crash_times = self._get_crash_report_times(self.device_serial)
            self.running_time = time.time() - self.start_time
            self.logger.info("*********TEST SUMMARY*********")
            self.logger.info("Total MTBF Time: %.3f seconds" % self.running_time)
            self.logger.info("Total Crash Times for device %s: %d" % (self.device_serial, crash_times))
            self.logger.info('passed: %d' % self.passed)
            self.logger.info('failed: %d' % self.failed)
            self.logger.info("*******************************")

            serialized = dict()
            serialized['replay'] = self.tests_record_to_replay
            # print "serialised replay"
            # print self.tests_record_to_replay
            if self.replay_record_filename:
                with open(self.replay_record_filename, 'w') as reproduce_file:
                    reproduce_file.write(json.dumps(serialized))
                self.logger.info("Write reproduce steps finished")
            dest = os.path.join(self.workspace, os.path.basename(virtual_home))
            # print "before try"
            try:
                if not virtual_home == dest:
                    if os.path.exists(dest):
                        shutil.rmtree(dest)
                    shutil.copytree(virtual_home, dest)
                info = os.path.join(virtual_home, 'info')
                if os.path.exists(info):
                    shutil.copy2(info, self.workspace)
            except shutil.Error:
                pass
            # print "after try"
            archive_prefix = os.path.basename(self.archive_folder)
            archive_file = os.path.join(self.workspace, archive_prefix + ".zip")
            if os.path.exists(archive_file):
                num = 0
                m = re.search(archive_prefix + "_(\d+)", archive_file)
                if m:
                    num = int(m.groups(0)) + 1
                archive_file = archive_prefix + "_" + str(num) + ".zip"
            with ZipFile(archive_file, "w", allowZip64=True) as archive:
                for root, dirs, files in os.walk(self.archive_folder):
                    for f in files:
                        f = os.path.join(root, f)
                        archive.write(f, os.path.relpath(f, self.archive_folder))
            # print "before logs"
            # tell all processes to stop their loops
            self.log_collecting.value = False
            self.crash_monitor_process.join()
            self.crash_monitor_process.terminate()
            # print "log terminate instuctions"
            # print self.log_collect_process
            # print self.battery_collect_process
            # print self.top_collect_process
            if self.log_collect_process:
                # self.log_collect_process.join()
                # print "after join log collect process"
                self.log_collect_process.terminate()
                # print "eof log collect process"
            if self.battery_collect_process:
                # self.battery_collect_process.join()
                self.battery_collect_process.terminate()
            if self.top_collect_process:
                # self.top_collect_process.join()
                self.top_collect_process.terminate()
            if self.procrank_collect_process:
                # self.procrank_collect_process.join()
                self.procrank_collect_process.terminate()

        print "end of dinit()"
    def _wait_device_back_online(self, serial, port, reboot=False):
        def wait_for_device(serial):
            os.system('adb -s ' + serial + ' wait-for-device')
        self.logger.info('wait for device %s online' % serial)
        # retry connect 10 times
        for i in range(10):
            # wait device online
            self.logger.info('wait for device %s, %s times' % (serial, i+1))
            p = Process(target=wait_for_device, args=[serial])
            p.start()
            for j in range(5):
                if p.exitcode is None:
                    self.logger.info('not online, wait 3 seconds')
                    time.sleep(3)
                else:
                    self.logger.info('online, terminate waiting process')
                    p.terminate()
                    break
            else:
                self.logger.info('not online more than 15 seconds, terminate waiting process')
                p.terminate()
                continue

            # check device adb permission in case device or adbd restart
            self.logger.info('check device %s permission' % serial)
            proc = subprocess.Popen(["adb", "-s", serial, "shell", "id"], stdout=subprocess.PIPE)
            if re.match('.+root.+', proc.communicate()[0].lower()) is None:
                self.logger.info('adb root for device %s' % serial)
                code = os.system('adb -s ' + serial + ' root')
                if code != 0:
                    self.logger.info('wait online failed %s' % (i + 1))
                    continue

            # forward port
            self.logger.info('adb forward for device %s' % serial)
            code = os.system('adb -s ' + serial + ' forward tcp:' + port + ' tcp:2828')
            if code != 0:
                self.logger.info('wait online failed %s' % (i + 1))
                continue
            break
        else:
            self.logger.info('unable to get device online properly')
            raise DMError('unable to get device online properly')

        if reboot:
            time.sleep(30)
        else:
            # Bug 62576 - [MTBF] once we get socket timeout which makes no Marionette close session be called,
            #             test strings would be hold and result in memory leakage
            try:
                self.runner.marionette.delete_session()
            except:
                pass

    def _get_crash_report_times(self, serial):
        crash_result = get_crash_times_by_device(serial)
        return crash_result['crashNo']


def main(**kwargs):

    TEST_STEPS_LOG_FILE = 'last_replay.txt'

    if os.getenv('VIRTUAL_ENV') is None:
        raise Exception('You need to set environment variable: VIRTUAL_ENV')

    # 3 mode: dynamic (original/default) / replay / sequential_loop
    if not os.getenv("MTBF_MODE"):
        raise Exception("You need to specify MTBF mode!")
    mode = os.getenv("MTBF_MODE")

    if mode == DYNAMIC_MODE:
        try:
            time = int(time2sec(os.getenv('MTBF_TIME', '2m')))
        except ValueError:
            sys.stderr.write(
                "input value parse error: ",
                os.getenv('MTBF_TIME'),
                ", format should be '3d', '12h', '5m10s'\n"
            )
        mtbf = MTBF_Runner(mode=mode, time=time, replay_record_filename=TEST_STEPS_LOG_FILE, **kwargs)
        signal.signal(signal.SIGALRM, mtbf.time_up)
        signal.alarm(mtbf.duration)
        mtbf.run_test()
        signal.alarm(0)
        return True
    elif mode == REPLAY_MODE or mode == SEQUENTIAL_MODE:
        mtbf = MTBF_Runner(mode=mode, **kwargs)
        mtbf.run_test()
        return True
    else:
        raise Exception("Get unknown mode: %s!" % mode)


if __name__ == '__main__':
    main()
