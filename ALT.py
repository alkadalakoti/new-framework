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
import csv
import os
import unittest

import pandas as pd

from Apps.constants import common
from CommonMethods.CommonMethod import CommonMethods


class AppLaunchTime(unittest.TestCase):
    """Class contains Jio Store Application common methods,These
    methods will helps to operate Jio Store App.
    """

    def __init__(self, marionette_client):
        """Object  for ALT Class."""
        self.marionette_client = marionette_client
        self.cmnMethod = CommonMethods(self.marionette_client)
        self.global_path = self.cmnMethod.cfg.global_path()
        gaia_file = ["Resources", "gaia_apps.js"]
        self.js = os.path.abspath(os.path.join(self.global_path, *gaia_file))
        self.marionette_client.import_script(self.js)
        self.csv_report_fields = ["Serial_No", "Application_Name",
                                  "1_Time_in_ms", "2_Time_in_ms",
                                  "3_Time_in_ms", "4_Time_in_ms",
                                  "5_Time_in_ms", "6_Time_in_ms",
                                  "7_Time_in_ms", "8_Time_in_ms",
                                  "9_Time_in_ms", "10_Time_in_ms",
                                  "Average"]

    def writeReport(self, data):
        """ write alt values into .csv file """
        if not os.path.exists(common.ALT_Report_Name):
            print("Summary report file does not exist. Create new file.")
            with open(common.ALT_Report_Name, 'w') as f_object:
                writer_object = csv.DictWriter(f_object, fieldnames=self.csv_report_fields)
                writer_object.writeheader()

        with open(common.ALT_Report_Name, 'a') as f_object:
            writer_object = csv.DictWriter(f_object, fieldnames=self.csv_report_fields)
            writer_object.writerows([data])

        transposed = pd.read_csv(common.ALT_Report_Name)
        transpose_val = transposed.T
        print("transpose", transpose_val)
        transpose_val.to_csv(common.ALT_Final_Report_Name,
                              header=False, index=True)