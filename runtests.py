# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import json
import sys
import os
import textwrap
import time

from gaiatest import GaiaTestCase
from sonar.logging import commandline, structuredlog, unstructuredlog
from sonar.runner import KaiOSMarionetteTestRunner
from sonar.gaia_arguments import GaiaTestArguments


class GaiaTestRunnerMixin(object):

    def __init__(self, **kwargs):
        width = 80
        if not (self.testvars.get('acknowledged_risks') is True or os.environ.get('GAIATEST_ACKNOWLEDGED_RISKS')):
            url = 'http://gaiatest.readthedocs.org/en/latest/testrunner.html#risks'
            heading = 'Acknowledge risks'
            message = 'These tests are destructive and may remove data from the target KaiOS instance as well ' \
                      'as using services that may incur costs! Before you can run these tests you must follow the ' \
                      'steps to indicate you have acknowledged the risks detailed at the following address:'
            print '\n' + '*' * 5 + ' %s ' % heading.upper() + '*' * (width - len(heading) - 7)
            print '\n'.join(textwrap.wrap(message, width))
            print url
            print '*' * width + '\n'
            sys.exit(1)
        if not (self.testvars.get('skip_warning') is True or os.environ.get('GAIATEST_SKIP_WARNING')):
            delay = 30
            heading = 'Warning'
            message = 'You are about to run destructive tests against a KaiOS instance. These tests ' \
                      'will restore the target to a clean state, meaning any personal data such as contacts, ' \
                      'messages, photos, videos, music, etc. will be removed. This may include data on the ' \
                      'microSD card. The tests may also attempt to initiate outgoing calls, or connect to ' \
                      'services such as cellular data, wifi, gps, bluetooth, etc.'
            try:
                print '\n' + '*' * 5 + ' %s ' % heading.upper() + '*' * (width - len(heading) - 7)
                print '\n'.join(textwrap.wrap(message, width))
                print '*' * width + '\n'
                print 'To abort the test run hit Ctrl+C on your keyboard.'
                print 'The test run will continue in %d seconds.' % delay
                time.sleep(delay)
            except KeyboardInterrupt:
                print '\nTest run aborted by user.'
                sys.exit(1)
            print 'Continuing with test run...\n'


class GaiaTestRunner(KaiOSMarionetteTestRunner, GaiaTestRunnerMixin):

    def __init__(self, **kwargs):
        # if no server root is specified, use the packaged resources
        if not kwargs.get('server_root'):
            kwargs['server_root'] = os.path.abspath(os.path.join(
                os.path.dirname(__file__), 'resources'))

        def gather_debug(test, status):
            rv = {}
            marionette = test._marionette_weakref()

            # In the event we're gathering debug without starting a session, skip marionette commands
            if marionette.session is not None:
                try:
                    marionette.switch_to_frame()
                    marionette.push_permission('settings-read', True)
                    marionette.push_permission('settings-api-read', True)
                    rv['settings'] = json.dumps(marionette.execute_async_script("""
                     var req = window.navigator.mozSettings.createLock().get('*');
                     req.onsuccess = function() {
                       marionetteScriptFinished(req.result);
                     }""", sandbox='system'), sort_keys=True, indent=4, separators=(',', ': '))
                except:
                    logger = structuredlog.get_default_logger()
                    if not logger:
                        logger = unstructuredlog.getLogger('gaiatest')
                    logger.warning('Failed to gather test failure debug.', exc_info=True)
            return rv

        KaiOSMarionetteTestRunner.__init__(self, result_callbacks=[gather_debug], **kwargs)
        GaiaTestRunnerMixin.__init__(self, **kwargs)
        self.test_handlers = [GaiaTestCase]

    def start_httpd(self, need_external_ip):
        super(GaiaTestRunner, self).start_httpd(need_external_ip)
        self.httpd.urlhandlers.append({
            'method': 'GET',
            'path': '.*\.webapp',
            'function': self.webapp_handler})

    def webapp_handler(self, request):
        with open(os.path.join(self.server_root, request.path[1:]), 'r') as f:
            data = f.read()
        return (200, {
            'Content-type': 'application/x-web-app-manifest+json',
            'Content-Length': len(data)}, data)


class GaiaHarness(object):

    def __init__(self,
                 runner_class=GaiaTestRunner,
                 parser_class=GaiaTestArguments,
                 args=None):
        self._runner_class = runner_class
        self._parser_class = parser_class
        self.args = args or self.parse_args()

    def parse_args(self, logger_defaults=None):
        parser = self._parser_class(
            usage='%(prog)s [options] test_file_or_dir <test_file_or_dir> ...',
            version="%(prog)s {version}"
                    " (using marionette-driver: {driver_version}, "
                    "marionette-transport: {transport_version})".format(
                        version="2.0.0",
                        driver_version="1.1.1",
                        transport_version="1.0.0"
                    )
        )
        commandline.add_logging_group(parser)
        args = parser.parse_args()
        parser.verify_usage(args)

        logger = commandline.setup_logging(
            args.logger_name, args, logger_defaults or {"tbpl": sys.stdout})

        args.logger = logger
        return args

    def run(self):
        try:
            args_dict = vars(self.args)
            tests = args_dict.pop('tests')
            runner = self._runner_class(**args_dict)
            runner.run_tests(tests)
            return runner.failed
        except Exception:
            self.args.logger.error('Failure during test execution.',
                                   exc_info=True)
            raise


def main():

    def cli(runner_class=GaiaTestRunner, parser_class=GaiaTestArguments,
            harness_class=GaiaHarness):
        try:
            failed = harness_class(runner_class, parser_class).run()
            if failed > 0:
                sys.exit(10)
        except Exception:
            sys.exit(1)
        sys.exit(0)

    cli(runner_class=GaiaTestRunner, parser_class=GaiaTestArguments, harness_class=GaiaHarness)
