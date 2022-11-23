# this would be a shell used to control mtbf testing on all devices

import json
import logging
import sys
import os
import shutil
import subprocess
import datetime
import time
from utils.argument_parser import RunTestParser

DYNAMIC_MODE = "dynamic"
REPLAY_MODE = "replay"
SEQUENTIAL_MODE = "sequential_loop"


class MtbfHandler():

    parser = RunTestParser()
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger('MTBF Handler')
    local_time = datetime.datetime.now().strftime("%Y%m%d%H%M")

    MTBF_CONF = 'mtbf_config.json'

    def __init__(self, args=sys.argv[1:]):
        self.options = self.parser.parse(args)
        self.configs = None
        self._load_configs_from_files(self.options.conf)
        self._prepare_device_workspaces()
        self._adb_root()
        self._adb_connect_to_devices()

    def _load_configs_from_files(self, config_file=None):
        if config_file is None:
            raise Exception('Must assign test config file!')
        else:
            # TODO: handle not abs path...
            if not os.path.exists(config_file):
                raise Exception('the file assigned to "--conf": + [' + config_file + '] must exist!')

            self.logger.info('Loading config...')
            # print "config file path: {}".format(config_file)
            self.configs = json.load(open(config_file))
            # print os.getcwd()
            # print "IN old folder"
            # print self.configs
            # print self.configs['mode']['value']
            # print self.configs['mode']
            # self.configs['mode']['value'] = DYNAMIC_MODE
            # print self.configs['mode']['value']
            # time.sleep(10)

        if self.options.workspace is not None:
            self.configs['workspace'] = self.options.workspace

        if self.configs['mode']['value'] is None:
            raise Exception("You must assign mode value!")

        if self.configs['mode']['value'] == DYNAMIC_MODE:
            self.configs['runlist'] = self.configs['mode']['dynamic']['file']
            self.configs['duration'] = self.configs['mode']['dynamic']['duration']
        elif self.configs['mode']['value'] == REPLAY_MODE:
            self.configs['replay'] = self.configs['mode']['replay']
        elif self.configs['mode']['value'] == SEQUENTIAL_MODE:
            self.configs['sequential_loop'] = self.configs['mode']['sequential_loop']

    def _prepare_device_workspaces(self):
        if self.configs is None:
            raise Exception('Must load config file!')

        self.logger.info("Prepare workspaces and testvars for all devices")

        workspace_root_dir = self.configs['workspace']
        if not os.path.isdir(workspace_root_dir):
            os.makedirs(workspace_root_dir)

        # prepare device workspace & device config.json
        if 'devices' not in self.configs:
            raise Exception('The conf need to include "devices" info!')

        for device in self.configs['devices']:
            self.logger.info("check existing mtbf process for device: %s" % device['serial'])
            try:
                existing_processes = subprocess.check_output("pgrep -lf %s" % (device['serial']), shell=True)
                for line in existing_processes.split('\n'):
                    if "python" in line:
                        line = line.split(' ')
                        self.logger.info("Kill existing mtbf process %s" % line[0])
                        subprocess.call("kill %s" % line[0], shell=True)
            except subprocess.CalledProcessError:
                 self.logger.info("No mtbf process found for %s" % device['serial'])

            self.logger.debug("Prepare workspace for device: %s" % device['serial'])
            device_workspace = os.path.join(workspace_root_dir, self.local_time, device['serial'])
            device_conf = os.path.join(device_workspace, 'conf')
            if os.path.isdir(device_workspace):
                shutil.rmtree(device_workspace)
            os.makedirs(device_workspace)
            os.makedirs(device_conf)

            device['workspace'] = device_workspace

            # prepare test config.json
            self.logger.debug("Prepare device test config.json")
            with open(os.path.join(device_conf, self.MTBF_CONF), 'w') as outfile:
                json.dump(device, outfile)

            testvars_file = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                         'conf/device_testvars/testvars_' + device['serial'] + '.json')
            #TODO: check if test vars for device exist
            shutil.copy(testvars_file, device_workspace)

    def _adb_root(self):
        if self.configs is None:
            raise Exception('Must load config file!')
        if 'devices' not in self.configs:
            raise Exception('The conf need to include "devices" info!')

        self.logger.info("adb root to all devices")

        for device in self.configs['devices']:
            self.logger.info('adb root to device: %s' % device['serial'])
            subprocess.check_output(['adb', '-s', device['serial'], 'root'])

    def _adb_connect_to_devices(self):
        if self.configs is None:
            raise Exception('Must load config file!')
        if 'devices' not in self.configs:
            raise Exception('The conf need to include "devices" info!')

        self.logger.info("adb connect to all devices")

        for device in self.configs['devices']:
            self.logger.info('adb forward port to connect device: %s' % device['serial'])
            subprocess.check_output(['adb', '-s', device['serial'], 'wait-for-device'])
            subprocess.check_output(['adb', '-s', device['serial'], 'forward', 'tcp:'+device['port'], 'tcp:2828'])

    def run(self):
        jobs = []
        #TODO: if device is stopped, how to restart it?
        for device in self.configs['devices']:
            child_env = os.environ.copy()
            child_env["MTBF_CONF"] = os.path.join(self.configs['workspace'], self.local_time, device['serial'], 'conf', self.MTBF_CONF)
            child_env["MTBF_MODE"] = self.configs['mode']['value']

            self.logger.info("Running MTBF as \"%s\" mode!" % child_env["MTBF_MODE"].upper())

            if child_env["MTBF_MODE"] == DYNAMIC_MODE:
                self.logger.info("MTBF Running TIME: %s " % self.configs['duration'])
                self.logger.info("MTBF Running Test Set file: %s " % self.configs['runlist'])
                child_env["MTBF_TIME"] = self.configs['duration']
                child_env["MTBF_RUNLIST"] = self.configs['runlist']
            elif child_env["MTBF_MODE"] == REPLAY_MODE:
                self.logger.info("MTBF REPLAY file: %s" % self.configs['replay'])
                child_env["MTBF_REPLAY"] = self.configs['replay']
            elif child_env["MTBF_MODE"] == SEQUENTIAL_MODE:
                self.logger.info("MTBF Sequential file: %s" % self.configs['sequential_loop'])
                child_env["MTBF_SEQUENTIAL"] = self.configs['sequential_loop']

            args = ['python',
                    os.path.join(os.path.dirname(os.path.abspath(__file__)), 'mtbf_runner.py'),
                    '--address=localhost:' + device['port'],
                    '--testvars=' + os.path.join(self.configs['workspace'], self.local_time, device['serial'], 'testvars_'+device['serial']+'.json'),
                    '--device=' + device['serial']
                    ]
            jobs.append(subprocess.Popen(args, env=child_env))

        exit_codes = [p.wait() for p in jobs]
        for i in range(0, len(exit_codes)):
            self.logger.info("%s Exit code: %s" % (datetime.datetime.now(), exit_codes[i]))


def main(args=sys.argv[1:]):
    mtbf_handler = MtbfHandler(args)
    mtbf_handler.run()


if __name__ == '__main__':
    main()
