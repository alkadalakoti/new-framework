"""(c) Copyright 2018 by RadiSys Corporation. All rights reserved.

This  software is confidential and proprietary to RadiSys Corporation.
No part of this software may be reproduced, stored, transmitted,
disclosed or used in any form or by any means other than as expressly
provided by the written Software License Agreement between Radisys
and its licensee.

Radisys warrants that for a period, as provided by the written
Software License Agreement between Radisys and its licensee, this
software will perform substantially to Radisys specifications as
published at the time of shipment, exclusive of any updates or
upgrades, and the media used for delivery of this software will be
free from defects in materials and workmanship. Radisys also warrants
that has the corporate authority to enter into and perform under the
Software License Agreement and it is the copyright owner of the software
as originally delivered to its licensee.

RADISYS MAKES NO OTHER WARRANTIES, EXPRESS OR IMPLIED, INCLUDING
WITHOUT LIMITATION WARRANTIES OF MERCHANTABILITY OR FITNESS FOR
A PARTICULAR PURPOSE WITH REGARD TO THIS SOFTWARE, SERVICE OR ANY RELATED
MATERIALS.

IN NO EVENT SHALL RADISYS BE LIABLE FOR ANY INDIRECT, SPECIAL,
CONSEQUENTIAL DAMAGES, OR PUNITIVE DAMAGES IN CONNECTION WITH OR ARISING
OUT OF THE USE OF, OR INABILITY TO USE, THIS SOFTWARE, WHETHER BASED
ON BREACH OF CONTRACT, TORT (INCLUDING NEGLIGENCE), PRODUCT
LIABILITY, OR OTHERWISE, AND WHETHER OR NOT IT HAS BEEN ADVISED
OF THE POSSIBILITY OF SUCH DAMAGE.

Restricted Rights Legend:

This software and all related materials licensed hereby are
classified as "restricted computer software" as defined in clause
52.227-19 of the Federal Acquisition Regulation ("FAR") and were
developed entirely at private expense for nongovernmental purposes,
are commercial in nature and have been regularly used for
nongovernmental purposes, and, to the extent not published and
copyrighted, are trade secrets and confidential and are provided
with all rights reserved under the copyright laws of the United
States. The government's rights to the software and related
materials are limited and restricted as provided in clause
52.227-19 of the FAR.

IMPORTANT LIMITATION(S) ON USE


The use of this software is limited to the use set
forth in the written Software License Agreement between Radisys and
its Licensee. Among other things, the use of this software
may be limited to a particular type of Designated Equipment, as
defined in such Software License Agreement.
Before any installation, use or transfer of this software, please
consult the written Software License Agreement or contact Radisys at
the location set forth below in order to confirm that you are
engaging in a permissible use of the software.
"""
import os
import time
import unittest

from marionette_driver.marionette import Marionette
from tests.memory.memoryreading import MemoryReading

from Apps.Phone import PhoneOperation
from Apps.constants import common, keys
from CommonMethods.CommonMethod import CommonMethods


class MemoryRun(unittest.TestCase):
    """This class is the main class where we define all tests."""

    # time to load icon in home screen

    @classmethod
    def setUpClass(cls):
        """Classmethod will get executed .

        Only once before any test in the program.
        """
        os.system("adb -s {} forward tcp:2828 tcp:2828".format(
            CommonMethods.pptFileFetch(common.FIRST_DEVICE_NUMBER)))
        cls.marionette_client = Marionette('localhost', port=2828)
        cls.marionette_client.start_session()
        cls.marionette_client.set_search_timeout(20000)
        cls.cmnMethod = CommonMethods(cls.marionette_client)
        cls.cmnMethod.create_report_folders()
        cls.memory = MemoryReading(cls.marionette_client)
        cls.phoneOper = PhoneOperation(cls.marionette_client)

    def setUp(self):
        """Before starting any test method in this class .

        Setup method will get executed.
        """
        self.cmnMethod.changeDeviceFocus(
            self.cmnMethod.pptFileFetch(common.FIRST_DEVICE_NUMBER))
        self.cmnMethod.start_marionette()
        self.cmnMethod.keyPress(keys.Keyevents.BACK_SPACE, keys.Keycodes.EIGHT)
        time.sleep(2)

    def test_memory_test(self):
        """To take memory reading after launching app"""

        try:
            self.memory.collect_b2ginfo()
        except Exception as e:
            self.cmnMethod.handle_exception(e, "test_memory_test",
                                            "Failed To take memory reading after launching app")
        finally:
            print("Finally")
            self.cmnMethod.handle_exception_finally("test_memory_test")

    def tearDown(self):
        # self.cmnMethod.collect_meminfo(
        #     self.cmnMethod.pptFileFetch(common.FIRST_DEVICE_NUMBER), "meminfo")
        # self.cmnMethod.collect_b2ginfo(
        #     self.cmnMethod.pptFileFetch(common.FIRST_DEVICE_NUMBER), "b2ginfo")
        self.marionette_client.cleanup()
        time.sleep(10)

    @classmethod
    def tearDownClass(cls):
        """Teardown ClassMethod will get.

        Execute at the end of the test.Only once.
        """


if __name__ == '__main__':
    unittest.main()
