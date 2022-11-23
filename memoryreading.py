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
import time
import unittest

import pandas as pd

from Apps.Phone import PhoneOperation
from Apps.constants import common
from CommonMethods.CommonMethod import CommonMethods


class MemoryReading(unittest.TestCase):
    """Class contains common methods which is used from other classes."""

    def __init__(self, marionette_client):
        """Object for Gallery Class."""
        self.marionette_client = marionette_client
        self.cmnMethod = CommonMethods(self.marionette_client)
        self.global_path = self.cmnMethod.cfg.global_path()
        gaia_file = ["Resources", "gaia_apps.js"]
        self.js = os.path.abspath(os.path.join(self.global_path, *gaia_file))
        self.marionette_client.import_script(self.js)
        self.phoneOper = PhoneOperation(self.marionette_client)
        self.csv_report_fields = ["Serial_No", "Application_Name",
                                  "Memory_values"]
        deviceid = self.cmnMethod.pptFileFetch(common.FIRST_DEVICE_NUMBER)
        os.system("adb -s {} root".format(deviceid))
        time.sleep(5)
        # os.system("adb -s {} remount".format(deviceid))
        # time.sleep(5)
        self.launch_time_wait = 60

    def writeReport(self, data):
        """ write alt values into .csv file """
        if not os.path.exists(common.Memory_Report_Name):
            # print("Summary report file does not exist. Create new file.")
            with open(common.Memory_Report_Name, 'w') as f_object:
                writer_object = csv.DictWriter(f_object, fieldnames=self.csv_report_fields)
                writer_object.writeheader()

        with open(common.Memory_Report_Name, 'a') as f_object:
            writer_object = csv.DictWriter(f_object, fieldnames=self.csv_report_fields)
            writer_object.writerows([data])

    def collect_b2ginfo(self):
        """ Collect info from b2ginfo file"""
        log_folder = os.path.abspath(self.global_path)
        deviceid = self.cmnMethod.pptFileFetch(common.FIRST_DEVICE_NUMBER)
        filename = "b2ginfo"
        # For LF2401 & Kai, change appname - Contact, For Kai,
        # change Notes - Note, Unit Converter - Unit Conv.,
        # JioPages - Browser, JioStore - JIOSTORE_KAIOS
        # Call Log - Communications
        app_to_launch = common.AppNames.appname_list
        memory_values = []
        flag = []
        for i in range(len(app_to_launch)):
            self.cmnMethod.launch_app(app_to_launch[i])
            time.sleep(self.launch_time_wait)
            os.system("adb -s {} shell b2g-info -z > {}\\{}.txt".format(
                deviceid, log_folder, filename))
            time.sleep(10)
            print("After b2ginfo log collect")
            pid_list = []
            with open(log_folder + '\\b2ginfo.txt', "rt") as f:
                for line in f:
                    pid_list.append(line)
            lines_to_print = [1, 2, 3, 4, 5, 6, 7, 8]
            # For LF2401 & Kai, change appname - Contacts, For Kai :
            # JioPages - Browser, Notes - Note, JioStore - Kai_JioStore
            # Messages - JioShare
            app_name = common.B2G_APPNAMES.b2g_appname_list
            for index, line in enumerate(open(log_folder + '\\b2ginfo.txt', "rt")):
                if index in lines_to_print:
                    application_name = line.split()
                    if application_name[0] in app_name:
                        # for greater than one syllable names
                        if application_name[0] == common.B2G_APPNAMES.CALL or \
                                application_name[0] == common.B2G_APPNAMES.FM or \
                                application_name[0] == common.B2G_APPNAMES.Unit or \
                                application_name[0] == common.B2G_APPNAMES.Kai_JioStore or \
                                application_name[0].encode("utf-8") == common.AppNames.WHATSAPP:
                            print("App name", application_name[0] + " " + application_name[1])
                            print("Memory value", application_name[6])
                            mem_val = (application_name[6].decode())
                            memory_values.append(mem_val)
                        else:
                            print("App name", application_name[0])
                            print("Memory value", application_name[5])
                            mem_val = (application_name[5].decode())
                            memory_values.append(mem_val)

                    self.cmnMethod.collect_meminfo(
                        self.cmnMethod.pptFileFetch(common.FIRST_DEVICE_NUMBER), "meminfo" + str(i))
                    self.cmnMethod.collect_b2ginfo(
                        self.cmnMethod.pptFileFetch(common.FIRST_DEVICE_NUMBER), "b2ginfo" + str(i))

            app_name = self.phoneOper.displayed_app().name
            if app_name is None:
                self.cmnMethod.closeAppWithName(app_name)
            else:
                self.cmnMethod.kill_app_with_name(app_name)
                time.sleep(2)
                self.cmnMethod.closeAppWithName(app_name)
            print(memory_values)
            self.writeReport({"Serial_No": i + 1, "Application_Name": app_to_launch[i],
                              "Memory_values": memory_values[i]})

    def verdict_between_two_csv_files(self, dut_file, ref_file):
        """Calculate the difference between DUT & Ref average values, store verdict in new csv"""
        col_list = ["Serial_No", "Application_Name", "Memory_values"]
        # read dut csv values, Place csv location in common
        data1 = pd.read_csv(dut_file, usecols=col_list)
        print(data1.head())
        # read ref csv values, Place csv location in common
        data2 = pd.read_csv(ref_file, usecols=col_list)
        print(data2.head())
        # header names to be printed in new consolidated report
        field_names = ["Serial_No", "Application_Name",
                       "DUT_Memory_Values", "REF_Memory_Values", "Result", "Verdict"]
        # create a new final verdict report that contains average difference formula
        with open(common.MEM_VERDICT_REPORT, 'w') as f_object:
            writer_object = csv.writer(f_object)
            writer_object.writerow(field_names)
        for i in range(len(data1)):
            serial_no_data1 = data1['Serial_No'][i]
            # if isinstance(serial_no_data1, str):
            for j in range(len(data2)):
                serial_no_data2 = data2['Serial_No'][j]
                # if isinstance(serial_no_data2, str) and serial_no_data1 == serial_no_data2:
                if serial_no_data1 == serial_no_data2:

                    # delta formula
                    delta_val = ((float(data1['Memory_values'][i]) -
                                  float(data2['Memory_values'][j])) /
                                 float(data2['Memory_values'][j])) * 100
                    verdict = "Pass"
                    if delta_val > 10:
                        verdict = "Fail"
                    # values to print in new final report
                    output_list = [data2['Serial_No'][j],
                                   data2['Application_Name'][j],
                                   data1['Memory_values'][i],
                                   data2['Memory_values'][j],
                                   str(delta_val), verdict]
                    # append values to new final report
                    with open(common.MEM_VERDICT_REPORT, 'a') as f_object:
                        writer_object = csv.writer(f_object)
                        writer_object.writerow(output_list)
