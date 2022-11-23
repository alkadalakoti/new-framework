var stopFlag = false;
var startTime = new Date();
var startTimeStamp = Date.now();
var endTime;
var totalLoop = 0;
var count = 100;
var totalRunTime;
var callTimeDuration = 10 * 18;//30 mins //1000*300; 5 mins
var callTimeInterval = 100 * 10;  // Gap of 10 secs
var callTimeIntervalVT = 100 * 10;
var callTimeDurationVT = 100 * 180; //30 mins   //1000*300;

var smstimeInterval = 100 * 10; //After every 5 mins  300 secs
var browsetimeDuration = 100 * 80;  // 30 Mins  1800 secs
var browsetimeDurationVideo = 100 * 60;  // 10*6 Mins  600 secs
var browsetimeDurationVideoInterval = 800 * 100;  //920*1000  updated by deepti
var musicOnlineDurationInterval = 600 * 100;
var fmInterval = 90 * 100;
var musicDuration = 80 * 100;   //1800
// for test
var musicInterval = 800 * 100;   // 1820
var downloadDataDuration = 100 * 90;//15 mins //1500*1000; 25 mins
var musicOnlineDuration = 60 * 100;   //1800
var musicOnlineInterval = 20 * 100;   // 1820
var videoDuration = 80 * 100;         //1800
var videoInetrval = 80 * 100;         //1820
var standbyDuration = 60 * 10;
var consoleShow = true;
var callTotal = 100;
var callTotalVT = 100;
var smsTotal = 100;
var musicTotal = 100;
var browsevideoTotal = 100;//6;
var bat_check_count = 100;
var Initial_battery;
var call_battery;
var display_battery;
var messaging_battery;
var browse_battery;
var FM_battery;
var music_battery;
var video_battery;
var displayNumber;
var downloadDataNumber;
var standbyNumber;
var music_online_battery;
var video_online_battery;
Var debug_ttl_enabled = true;
var browsingURL = "https://www.youtube.com/watch?v=nTWQtczUqUk"; // These videos are playing automatically now
var facebookURL = "https://www.facebook.com";
var downloadData = "http://speed.hetzner.de/100MB.bin";
var Number;

var start_battery_level = 0;
var standbycount = 2;
var standbyinterval = 10 * 60 * 30;

window.addEventListener("load", function () {
  var musicNumber;
  var videoNumber;
  var fmNumber;
  var cameraNumber;
  var browseFBNumber;
  var screenBrightnessNumber;
  var screenBrightnessNumber_1;
  var screenBrightnessNumber_2;
  var fmNumber_98;
  var fmNumber_91;
  var fmNumber_92;
  var fmNumber_93;
  var fmNumber_104;
  var musicOnlineNumber;
  var videoOnlineNumber;
  var item = 0;
  var universe = document.querySelectorAll('input,.btn');
  if (consoleShow != false) {
    console.log("Kaios-test number of buttons" + universe.length);
  }
  universe[item].classList.add('test');
  this.addEventListener("keyup", function (e) {
    switch (e.keyCode) {
      case 40:    // Down arrow
        universe[item].classList.remove('test');
        if (consoleShow != false) {
          console.log('Kaios-test downarrow' + item);
        }
        if (item >= 0 && (item < (universe.length) - 1)) {
          item++;
          universe[item].classList.add('test');
        }
        else {
          universe[item].classList.add('test');
        }
        if (consoleShow != false) {
          //console.log('Kaios-test: a'+item);
        }
        break;

      case 13:
        if (consoleShow != false) {
          console.log(item);
        }
        if (item === 0) {
          universe[item].select();
        }
        if (item === 1) {
          if (consoleShow != false) {
            console.log("Gdou-test start clicked");
          }
          stopFlag = false;
          mainFunction();
        }
        if (item === 3) {
          if (consoleShow != false) {
            console.log("Gdou-test stop clicked");
          }
          stopFlag = true;
          break;
        }
        break;
      case 38:      // up arrow

        if (item <= universe.length && item > 0) {
          universe[item].classList.remove('test');
          item--;
          universe[item].classList.add('test');
        }
        break;
    }
  });
});

navigator.mozSetMessageHandler('alarm', this.onMozAlarm.bind(this));
var sdcard = navigator.getDeviceStorage("sdcard");
//var sdcard = navigator.getDeviceStorage("Internal");
var request = sdcard.delete("Gdou_Report_with_data");  //Updated the folder name by deepti
request.onsuccess = function () { console.log('Gdou-test File successfully removed.'); }
request.onerror = function () { console.log('Gdou-test some error', this.error); }
var imsHandler = [];
imsHandler = navigator.mozMobileConnections[0].imsHandler;
if (consoleShow != false) {
  console.log("Gdou-test imshandler capability" + imsHandler.capability);
}
function networkCheck() {

  if (imsHandler.capability === null) {
    return false;
  }

  else {
    return true;
  }
}



// Battery at the time of start of test
function Initial_Battery_level() {
  // checking the current battery level
  navigator.getBattery().then(function (battery) {
    console.log("Battery level: " + battery.level * 100 + " %");
    Initial_battery = "Initial Battery level: " + battery.level * 100 + " %";
   
   window.navigator.mozSettings.createLock().set({ "debug.ttl.enabled": true });
   console.log("TTL time: " + ttl ")
   
    var endTime = new Date();
    console.log(endTime);
    var diff = endTime - startTime;
    timeFormat(diff);

    var d = new Date();
    var n = d.toLocaleTimeString();
    var content = "\r\n" + Initial_battery + "\r\n Total runtime: " + totalRunTime + ",\r\n Time: " + d.toString();
    
    var sdcard = navigator.getDeviceStorage("sdcard");
    var file = new Blob([content], { type: "text/plain" });

    var request = sdcard.addNamed(file, "GDOU_" + startTimeStamp + "/" + "Gdou_Report_at_initial.txt");

    request.onsuccess = function () {
      var name = this.result;
      console.log('File "' + name + '" successfully wrote on the sdcard storage area');
    }

    // An error typically occur if a file with the same name already exist
    request.onerror = function () {
      console.warn('Unable to write the file: ' + this.error);
    }
  });
}

// Battery status after call scenario
function Call_Battery_level(battery_level_at_start) {
  // checking the current battery level
  navigator.getBattery().then(function (battery) {
    console.log("Battery level: " + battery.level * 100 + " %");
    call_battery = "\r\n Battery level after call scenario: " + battery.level * 100 + " %";
    var endTime = new Date();
    console.log(endTime);
    var diff = endTime - startTime;
    timeFormat(diff);

    var d = new Date();
    var n = d.toLocaleTimeString();
    var content = "\r\n" + battery_level_at_start + "\r\n" + call_battery + "\r\n Total runtime: " + totalRunTime + ",\r\n Time: " + d.toString();

    var sdcard = navigator.getDeviceStorage("sdcard");
    var file = new Blob([content], { type: "text/plain" });

    var request = sdcard.addNamed(file, "GDOU_" + startTimeStamp + "/" + "Gdou_Report_after_call.txt");

    request.onsuccess = function () {
      var name = this.result;
      console.log('File "' + name + '" successfully wrote on the sdcard storage area');
    }

    // An error typically occur if a file with the same name already exist
    request.onerror = function () {
      console.warn('Unable to write the file: ' + this.error);
    }
  });
}

function VT_Call_Battery_level(battery_level_at_start) {
  // checking the current battery level
  navigator.getBattery().then(function (battery) {
    console.log("Battery level: " + battery.level * 100 + " %");
    VT_call_battery = "\r\n Battery level after VTcall scenario: " + battery.level * 100 + " %";
    var endTime = new Date();
    console.log(endTime);
    var diff = endTime - startTime;
    timeFormat(diff);

    var d = new Date();
    var n = d.toLocaleTimeString();
    var content = "\r\n" + battery_level_at_start + "\r\n" + VT_call_battery + "\r\n Total runtime: " + totalRunTime + ",\r\n Time: " + d.toString();

    var sdcard = navigator.getDeviceStorage("sdcard");
    var file = new Blob([content], { type: "text/plain" });

    var request = sdcard.addNamed(file, "GDOU_" + startTimeStamp + "/" + "Gdou_Report_after_VT_call.txt");

    request.onsuccess = function () {
      var name = this.result;
      console.log('File "' + name + '" successfully wrote on the sdcard storage area');
    }

    // An error typically occur if a file with the same name already exist
    request.onerror = function () {
      console.warn('Unable to write the file: ' + this.error);
    }
  });
}

// Battery status after Messaging scenario
function messaging_Battery_level(battery_level_at_start) {
  // checking the current battery level
  navigator.getBattery().then(function (battery) {
    console.log("Battery level: " + battery.level * 100 + " %");
    messaging_battery = "\r\n Battery level after Messaging scenario: " + battery.level * 100 + " %";

    var endTime = new Date();
    console.log(endTime);
    var diff = endTime - startTime;
    timeFormat(diff);

    var d = new Date();
    var n = d.toLocaleTimeString();
    var content = "\r\n" + battery_level_at_start + "\r\n" + messaging_battery + "\r\n Total runtime: " + totalRunTime + ",\r\n Time: " + d.toString();

    var sdcard = navigator.getDeviceStorage("sdcard");
    var file = new Blob([content], { type: "text/plain" });

    var request = sdcard.addNamed(file, "GDOU_" + startTimeStamp + "/" + "Gdou_Report_after_Messaging_scenario.txt");

    request.onsuccess = function () {
      var name = this.result;
      console.log('File "' + name + '" successfully wrote on the sdcard storage area');
    }

    // An error typically occur if a file with the same name already exist
    request.onerror = function () {
      console.warn('Unable to write the file: ' + this.error);
    }
  });
}
// Battery status after data download
function data_downloading_Battery_level(battery_level_at_start) {
  // checking the current battery level
  navigator.getBattery().then(function (battery) {
    console.log("Battery level: " + battery.level * 100 + " %");
    download_battery = "\r\n Battery level after data download over 4G scenario: " + battery.level * 100 + " %";

    var endTime = new Date();
    console.log(endTime);
    var diff = endTime - startTime;
    timeFormat(diff);

    var d = new Date();
    var n = d.toLocaleTimeString();
    var content = "\r\n" + battery_level_at_start + "\r\n" + download_battery + "\r\n Total runtime: " + totalRunTime + ",\r\n Time: " + d.toString();

    var sdcard = navigator.getDeviceStorage("sdcard");
    var file = new Blob([content], { type: "text/plain" });

    var request = sdcard.addNamed(file, "GDOU_" + startTimeStamp + "/" + "Gdou_Report_after_Download_scenario.txt");

    request.onsuccess = function () {
      var name = this.result;
      console.log('File "' + name + '" successfully wrote on the sdcard storage area');
    }

    // An error typically occur if a file with the same name already exist
    request.onerror = function () {
      console.warn('Unable to write the file: ' + this.error);
    }
  });
}

// Battery status after browse facebook
function browse_facebook_Battery_level(battery_level_at_start) {
  // checking the current battery level
  navigator.getBattery().then(function (battery) {
    console.log("Battery level: " + battery.level * 100 + " %");
    Facebook_battery = "\r\n Battery level after Browse Facebook scenario: " + battery.level * 100 + " %";

    var endTime = new Date();
    console.log(endTime);
    var diff = endTime - startTime;
    timeFormat(diff);

    var d = new Date();
    var n = d.toLocaleTimeString();
    var content = "\r\n" + battery_level_at_start + "\r\n" + Facebook_battery + "\r\n Total runtime: " + totalRunTime + ",\r\n Time: " + d.toString();

    var sdcard = navigator.getDeviceStorage("sdcard");
    var file = new Blob([content], { type: "text/plain" });

    var request = sdcard.addNamed(file, "GDOU_" + startTimeStamp + "/" + "Gdou_Report_after_Facebook_Browsing_scenario.txt");

    request.onsuccess = function () {
      var name = this.result;
      console.log('File "' + name + '" successfully wrote on the sdcard storage area');
    }

    // An error typically occur if a file with the same name already exist
    request.onerror = function () {
      console.warn('Unable to write the file: ' + this.error);
    }
  });
}

// Battery status after LCD idle with 100% brightness
function lcd_idle_Battery_level(battery_level_at_start) {
  // checking the current battery level
  navigator.getBattery().then(function (battery) {
    console.log("Battery level: " + battery.level * 100 + " %");
    lcd_idle_battery = "\r\n Battery level after LCD idle with 60% brightness scenario: " + battery.level * 100 + " %";

    var endTime = new Date();
    console.log(endTime);
    var diff = endTime - startTime;
    timeFormat(diff);

    var d = new Date();
    var n = d.toLocaleTimeString();
    var content = "\r\n" + battery_level_at_start + "\r\n" + lcd_idle_battery + "\r\n Total runtime: " + totalRunTime + ",\r\n Time: " + d.toString();

    var sdcard = navigator.getDeviceStorage("sdcard");
    var file = new Blob([content], { type: "text/plain" });

    var request = sdcard.addNamed(file, "GDOU_" + startTimeStamp + "/" + "Gdou_Report_after_LCD_idle_scenario.txt");

    request.onsuccess = function () {
      var name = this.result;
      console.log('File "' + name + '" successfully wrote on the sdcard storage area');
    }

    // An error typically occur if a file with the same name already exist
    request.onerror = function () {
      console.warn('Unable to write the file: ' + this.error);
    }
  });
}

// Battery status after fm scenario
function fm_Battery_level(battery_level_at_start) {
  // checking the current battery level
  navigator.getBattery().then(function (battery) {
    console.log("Battery level: " + battery.level * 100 + " %");
    FM_battery = "\r\n Battery level after FM scenario: " + battery.level * 100 + " %";
	
	window.navigator.mozSettings.createLock().set({ "debug.ttl.enabled": true });

    var endTime = new Date();
    console.log(endTime);
    var diff = endTime - startTime;
    timeFormat(diff);

    var d = new Date();
    var n = d.toLocaleTimeString();
    var content = "\r\n" + battery_level_at_start + "\r\n" + FM_battery + "\r\n Total runtime: " + totalRunTime + ",\r\n Time: " + d.toString();

    var sdcard = navigator.getDeviceStorage("sdcard");
    var file = new Blob([content], { type: "text/plain" });

    var request = sdcard.addNamed(file, "GDOU_" + startTimeStamp + "/" + "Gdou_Report_after_FM_scenario.txt");

    request.onsuccess = function () {
      var name = this.result;
      console.log('File "' + name + '" successfully wrote on the sdcard storage area');
    }

    // An error typically occur if a file with the same name already exist
    request.onerror = function () {
      console.warn('Unable to write the file: ' + this.error);
    }
  });
}

// Battery status after playing Music scenario
function play_music_Battery_level(battery_level_at_start) {
  // checking the current battery level
  navigator.getBattery().then(function (battery) {
    console.log("Battery level: " + battery.level * 100 + " %");
    music_battery = "\r\n Battery level after Playing Music scenario: " + battery.level * 100 + " %";

    var endTime = new Date();
    console.log(endTime);
    var diff = endTime - startTime;
    timeFormat(diff);

    var d = new Date();
    var n = d.toLocaleTimeString();
    var content = "\r\b" + battery_level_at_start + "\r\n" + music_battery + "\r\n Total runtime: " + totalRunTime + ",\r\n Time: " + d.toString();

    var sdcard = navigator.getDeviceStorage("sdcard");
    var file = new Blob([content], { type: "text/plain" });

    var request = sdcard.addNamed(file, "GDOU_" + startTimeStamp + "/" + "Gdou_Report_after_playing_music_scenario.txt");

    request.onsuccess = function () {
      var name = this.result;
      console.log('File "' + name + '" successfully wrote on the sdcard storage area');
    }

    // An error typically occur if a file with the same name already exist
    request.onerror = function () {
      console.warn('Unable to write the file: ' + this.error);
    }
  });
}

// Battery status after playing Video scenario
function play_video_Battery_level(battery_level_at_start) {
  // checking the current battery level
  navigator.getBattery().then(function (battery) {
    console.log("Battery level: " + battery.level * 100 + " %");
    video_battery = "\r\n Battery level after Playing Video scenario: " + battery.level * 100 + " %";

    window.navigator.mozSettings.createLock().set({ "debug.ttl.enabled": true });
	
    var endTime = new Date();
    console.log(endTime);
    var diff = endTime - startTime;
    timeFormat(diff);

    var d = new Date();
    var n = d.toLocaleTimeString();
    var content = "\r\n" + battery_level_at_start + "\r\n" + video_battery + "\r\n Total runtime: " + totalRunTime + ",\r\n Time: " + d.toString();

    var sdcard = navigator.getDeviceStorage("sdcard");
    var file = new Blob([content], { type: "text/plain" });

    var request = sdcard.addNamed(file, "GDOU_" + startTimeStamp + "/" + "Gdou_Report_after_Playing_Video_scenario.txt");

    request.onsuccess = function () {
      var name = this.result;
      console.log('File "' + name + '" successfully wrote on the sdcard storage area');
    }

    // An error typically occur if a file with the same name already exist
    request.onerror = function () {
      console.warn('Unable to write the file: ' + this.error);
    }
  });
}

// Battery status after playing Music Online scenario
function play_music_online_Battery_level(battery_level_at_start) {
  // checking the current battery level
  navigator.getBattery().then(function (battery) {
    console.log("Battery level: " + battery.level * 100 + " %");
    music_online_battery = "\r\n Battery level after Playing music online scenario: " + battery.level * 100 + " %";

    var endTime = new Date();
    console.log(endTime);
    var diff = endTime - startTime;
    timeFormat(diff);

    var d = new Date();
    var n = d.toLocaleTimeString();
    var content = "\r\n" + battery_level_at_start + "\r\n" + music_online_battery + "\r\n Total runtime: " + totalRunTime + ",\r\n Time: " + d.toString();

    var sdcard = navigator.getDeviceStorage("sdcard");
    var file = new Blob([content], { type: "text/plain" });

    var request = sdcard.addNamed(file, "GDOU_" + startTimeStamp + "/" + "Gdou_Report_after_Playing_music_online_scenario.txt");

    request.onsuccess = function () {
      var name = this.result;
      console.log('File "' + name + '" successfully wrote on the sdcard storage area');
    }

    // An error typically occur if a file with the same name already exist
    request.onerror = function () {
      console.warn('Unable to write the file: ' + this.error);
    }
  });
}
// Battery status after Default_Display_Browsing scenario
function browsing_Battery_level(battery_level_at_start) {
  // checking the current battery level
  navigator.getBattery().then(function (battery) {
    console.log("Battery level: " + battery.level * 100 + " %");
    browse_battery = "\r\n Battery level after Browsing scenario: " + battery.level * 100 + " %";
    var endTime = new Date();
    console.log(endTime);
    var diff = endTime - startTime;
    timeFormat(diff);
	
	

    var d = new Date();
    var n = d.toLocaleTimeString();
    var content = "\r\n" + battery_level_at_start + "\r\n" + browse_battery + "\r\n Total runtime: " + totalRunTime + ",\r\n Time: " + d.toString();

    var sdcard = navigator.getDeviceStorage("sdcard");
    var file = new Blob([content], { type: "text/plain" });

    var request = sdcard.addNamed(file, "GDOU_" + startTimeStamp + "/" + "Gdou_Report_after_Browsing_scenario.txt");

    request.onsuccess = function () {
      var name = this.result;
      console.log('File "' + name + '" successfully wrote on the sdcard storage area');
    }

    // An error typically occur if a file with the same name already exist
    request.onerror = function () {
      console.warn('Unable to write the file: ' + this.error);
    }
  });
}

function record_battery_level_at_start(testcasename) {
  console.log("GDOU_" + "Recording start battery level for " + testcasename);
  navigator.gettimestamp().then(function (Time to load) {
    this[testcasename + 'start_battery_level'] = battery.level * 100;
    console.log("GDOU_" + "Fetched start battery level for " + testcasename + " = " + this[testcasename + 'start_battery_level']);
  });
}

// Battery status after playing Video online scenario
function save_battery_level_report(testcasename) {
  // checking the current battery level
  console.log("GDOU_" + "Recording end battery level for " + testcasename);
  navigator.getBattery().then(function (battery) {
    this[testcasename + 'end_battery_level'] = battery.level * 100;
    console.log("GDOU_" + "Fetched end battery level for " + testcasename + " = " + this[testcasename + 'end_battery_level']);

    var endTime = new Date();
    console.log("GDOU_" + endTime);
    var diff = endTime - startTime;
    timeFormat(diff);

    var d = new Date();
    var n = d.toLocaleTimeString();
    var content =
      "Battery level at the start of " + testcasename + " scenario: " + (this[testcasename + 'start_battery_level']) + " %" +
      "\r\n" +
      "Battery level at the end of " + testcasename + " scenario: " + (this[testcasename + 'end_battery_level']) + " %" +
      "\r\n Total runtime: " +
      totalRunTime +
      ",\r\n Time: " +
      d.toString();

    var sdcard = navigator.getDeviceStorage("sdcard");
    var file = new Blob([content], { type: "text/plain" });
    var fileName = "Gdou_Report_after_" + testcasename + ".txt";
    var request = sdcard.addNamed(file, "GDOU_" + startTimeStamp + "/" + fileName);

    request.onsuccess = function () {
      var name = this.result;
      console.log("GDOU_" + "Saved File" + name + ' successfully wrote on the sdcard storage area');
    };

    // An error typically occur if a file with the same name already exist
    request.onerror = function () {
      console.error("GDOU_Saving File " + fileName + ' failed');
    };
  });
}

// Battery status after playing Video online scenario
function play_video_online_Battery_level(battery_level_at_start) {
  // checking the current battery level
  navigator.getBattery().then(function (battery) {
    console.log("Battery level: " + battery.level * 100 + " %");
    video_online_battery = "\r\n Battery level after Playing Video online scenario: " + battery.level * 100 + " %";

    var endTime = new Date();
    console.log(endTime);
    var diff = endTime - startTime;
    timeFormat(diff);

    var d = new Date();
    var n = d.toLocaleTimeString();
    var content = "\r\n" + battery_level_at_start + "\r\n" + video_online_battery + "\r\n Total runtime: " + totalRunTime + ",\r\n Time: " + d.toString();

    var sdcard = navigator.getDeviceStorage("sdcard");
    var file = new Blob([content], { type: "text/plain" });

    var request = sdcard.addNamed(file, "GDOU_" + startTimeStamp + "/" + "Gdou_Report_after_Playing_video_online_scenario.txt");

    request.onsuccess = function () {
      var name = this.result;
      console.log('File "' + name + '" successfully wrote on the sdcard storage area');
    }

    // An error typically occur if a file with the same name already exist
    request.onerror = function () {
      console.warn('Unable to write the file: ' + this.error);
    }
  });
}

// Battery status after standby scenario
function standby_Battery_level(battery_level_at_start) {
  // checking the current battery level
  navigator.getBattery().then(function (battery) {
    console.log("Battery level: " + battery.level * 100 + " %");
    standby_battery = "\r\n Battery level after Test End scenario: " + battery.level * 100 + " %";

    var endTime = new Date();
    console.log(endTime);
    var diff = endTime - startTime;
    timeFormat(diff);

    var d = new Date();
    var n = d.toLocaleTimeString();
    var content = "\r\n" + battery_level_at_start + "\r\n" + standby_battery + "\r\n Total runtime: " + totalRunTime + ",\r\n Time: " + d.toString();

    var sdcard = navigator.getDeviceStorage("sdcard");
    var file = new Blob([content], { type: "text/plain" });

    var request = sdcard.addNamed(file, "GDOU_" + startTimeStamp + "/" + "Gdou_Report_after_Standby_scenario_test_end.txt");

    request.onsuccess = function () {
      var name = this.result;
      console.log('File "' + name + '" successfully wrote on the sdcard storage area');
    }

    // An error typically occur if a file with the same name already exist
    request.onerror = function () {
      console.warn('Unable to write the file: ' + this.error);
    }
  });
}


function mainFunction() {
  console.log("GDoU test for JPV phone started...");
  startTime = new Date();
  startTimeStamp = Date.now();
  Initial_Battery_level();
  var lock = navigator.mozSettings.createLock();
  //var result = lock.set({'screen.timeout': 0});

  var lock = window.navigator.requestWakeLock('screen');

  if (consoleShow != false) {
    console.log("Test startTime", startTime);
  }
  if (stopFlag === false) {
    callNumber = 0;
    callNumberVT = 0;
    messageNumber = 0;
    browseNumber = 0;
    musicNumber = 0;
    videoNumber = 0;
    cameraNumber = 0;
    browseFBNumber = 0;
    downloadDataNumber = 0;
    standbyNumber = 0;
    screenBrightnessNumber = 0;
    fmNumber_91 = 0;
    fmNumber_92 = 0;
    fmNumber_93 = 0;
    fmNumber_98 = 0;
    fmNumber_104 = 0;
    fmNumber = 0;
    musicOnlineNumber = 0;
    videoOnlineNumber = 0;
    displayNumber = 0;
    Number = document.getElementById("receiverNumber").value;
    if (Number === "8860538699") {
      swal({
        title: 'Enter a valid number',
        timer: 5000
      })
    }

    else {
      var lock = navigator.mozSettings.createLock();
      var result = lock.set({ 'screen.brightness': 0.1 });
      video_online();
      document.getElementById("demo").style.display = "block";
      document.getElementById('startBtn').style.display = "none";
      document.getElementById('editNumber').style.display = "none";
      document.getElementById('testStatus').style.display = "block";
      document.getElementById('stopBtn').style.display = "none";

    }

  }
}

// Scenario 4 - Play Video Online for 1 hour
function video_online() {
  navigator.getBattery().then(function (battery) {
    console.log("Battery level: " + battery.level * 100 + " %");
    battery_level_at_start = "\r\n Battery level at the start of test scenario: " + battery.level * 100 + " %";
  });
  navigator.getBattery().then(function (battery) {
    console.log("Battery level: " + battery.level * 100 + " %");
    battery_level_at_start = "\r\n Battery level at the start of test scenario: " + battery.level * 100 + " %";
  });
  console.log("inside video_online test")
  console.log(battery_level_at_start);
  if (consoleShow !== false) {
    console.log("Gdou-test Online Video started");
    console.log("Gdou-test network check", networkCheck());
  }
  if (networkCheck() === false) {
    document.getElementById("testStatus").innerHTML = "<h4>  Checking for network connection...</h4>";
    swal({
      title: "No network",
      timer: 5000
    });
    setTimeout(function () {
      video_online();
    }, 10000)

  } else {
    document.getElementById('testStatus').innerHTML = "<h4>  Test is in Progress.<br>Playing video Online...</h4>";
    var win = window.open(browsingURL);
    setTimeout(function () {
      console.log("win", win);
      win.close();
    }, browsetimeDurationVideo); //duration 1 hour
    screenBrightnessNumber = screenBrightnessNumber + 1;
    setTimeout(function () {
      console.log("screenBrightnessNumber", screenBrightnessNumber);
      if (screenBrightnessNumber < 1) {
        video_online();
      }
      else {
        play_video_online_Battery_level(battery_level_at_start);
        console.log("Gdou-test Online Video Completed");
        document.getElementById('testStatus').innerHTML = "<h4>Online Video.<br>Testing Completed...</h4>";
        makeCall();
      }
    }, browsetimeDurationVideo);
  }
}


//Scenario 1 - Call for 1.5 hrs brightness 10%

function makeCall() {
  if (bat_check_count == 1) {
    navigator.getBattery().then(function (battery) {
      console.log("Battery level: " + battery.level * 100 + " %");
      battery_level_at_start = "\r\n Battery level at the start of test scenario: " + battery.level * 100 + " %";
      bat_check_count = bat_check_count + 1;
    });
  };
  if (consoleShow != false) {
    console.log("Gdou-test Call started...");
    console.log("Gdou-test network check", networkCheck());
  }

  if (networkCheck() === false) {
    document.getElementById('testStatus').innerHTML = "<h4>  Checking for network connection...</h4>";
    swal({
      title: 'No network',
      timer: 5000
    })

    setTimeout(function () {
      makeCall();
    }, 10000)
  }
  else {
    const CALL_TYPE = {
      CALL_TYPE_VOICE: 2,
      //VT:4
    };
    document.getElementById('testStatus').innerHTML = "<h3>  Test is in Progress.<br>Making Call</h3>";


    // Telephony object
    var tel = navigator.mozTelephony;

    // Place a call
    var call = tel.dial(Number, CALL_TYPE, 0).then(function (call) {
      //call.id;
      console.log("Connecting");
      // Events for that call
      call.onstatechange = function (event) {
        /*
            Possible values for state:
            "dialing", "ringing", "busy", "connecting", "connected",
            "disconnecting", "disconnected", "incoming"
        */
        if (consoleShow != false) {
          console.log("Gdou-test call state" + event.call.state);
        }
      };

      // Above options as direct events
      call.onconnected = function () {
        // Call was connected
        if (consoleShow != false) {
          console.log("Gdou-test Call is connected");
        }
        setTimeout(function () {
          call.hangUp();
        }, callTimeDuration); //duration 30 mins
      };

      call.ondisconnected = function () {
        // Call is disconnected
        if (consoleShow != false) {
          console.log("Gdou-test Call is disconnected");
          console.log("Scenario 1 - Calling completed...");
        }
        callNumber = callNumber + 1;

        setTimeout(function () {
          if (callNumber < callTotal) {
            makeCall();
          }
          else {
            Call_Battery_level(battery_level_at_start);
            console.log("Make Call test scenario completed");
            document.getElementById('testStatus').innerHTML = "<h4> Make call testing completed..</h4>";
            download_data_over_4g(); //for test
          }
        }, callTimeInterval); //interval 10 secs

      };
    });
  }
}

//Scenario 2 - download over 4g for 15 mins
function download_data_over_4g() {
  navigator.getBattery().then(function (battery) {
    console.log("Battery level: " + battery.level * 100 + " %");
    battery_level_at_start = "\r\n Battery level at the start of test scenario: " + battery.level * 100 + " %";
  });
  if (consoleShow !== false) {
    console.log("Gdou-test downloading started");
    console.log("Gdou-test network check", networkCheck());
  }
  if (networkCheck() === false) {
    document.getElementById("testStatus").innerHTML = "<h4>  Checking for network connection...</h4>";
    swal({
      title: "No network",
      timer: 5000
    });
    setTimeout(function () {
      download_data_over_4g();
    }, 10000)

  } else {
    document.getElementById('testStatus').innerHTML = "<h4>  Test is in Progress.<br>data download...</h4>";
    var win = window.open(downloadData);
    console.log(win);
    downloadDataNumber = downloadDataNumber + 1;
    setTimeout(function () {
      win.close();
      if (downloadDataNumber < 1) {
        download_data_over_4g();
      }
      else {
        data_downloading_Battery_level(battery_level_at_start);
        console.log("Download data over 4G test completed");
        document.getElementById('testStatus').innerHTML = "<h4> Download data over 4G test Completed...</h4>";
        messaging(); //for test
      }
    }, downloadDataDuration);  //duration 15 Mins

  }
}

//Scenario 3- VT Call for 30 Mins brighness 60%

function makeCallVT() {
  navigator.getBattery().then(function (battery) {
    console.log("Battery level: " + battery.level * 100 + " %");
    battery_level_at_start = "\r\n Battery level at the start of test scenario: " + battery.level * 100 + " %";
  });
  if (consoleShow != false) {
    console.log("Gdou-test Call started...");
    console.log("Gdou-test network check", networkCheck());
  }

  if (networkCheck() === false) {
    document.getElementById('testStatus').innerHTML = "<h4>  Checking for network connection...</h4>";
    swal({
      title: 'No network',
      timer: 5000
    })

    setTimeout(function () {
      makeCallVT();
    }, 10000)
  }
  else {
    const CALL_TYPE = {
      //CALL_TYPE_VOICE:2,
      CALL_TYPE_VT: 4
    };
    document.getElementById('testStatus').innerHTML = "<h3>  Test is in Progress.<br>Making VT Call</h3>";
    var lock = navigator.mozSettings.createLock();
    var result = lock.set({ 'screen.brightness': 0.6 });

    // Telephony object
    var tel = navigator.mozTelephony;
    var call_type = tel.CALL_TYPE_VT;
    // Place a call
    var call = tel.dialVT(Number, call_type).then(function (call) {
      //call.id;
      console.log("Connecting");
      // Events for that call
      call.onstatechange = function (event) {
        /*
            Possible values for state:
            "dialing", "ringing", "busy", "connecting", "connected",
            "disconnecting", "disconnected", "incoming"
        */
        if (consoleShow != false) {
          console.log("Gdou-test call state" + event.call.state);
        }
      };

      // Above options as direct events
      call.onconnected = function () {
        // Call was connected
        if (consoleShow != false) {
          console.log("Gdou-test Call is connected");
        }
        setTimeout(function () {
          call.hangUp();
        }, callTimeDurationVT); //duration 30 mins
      };

      call.ondisconnected = function () {
        // Call is disconnected
        if (consoleShow != false) {
          console.log("Gdou-test Call is disconnected");
          console.log("Scenario 1 - Calling completed...");

        }
        callNumberVT = callNumberVT + 1;

        setTimeout(function () {
          if (callNumberVT < callTotalVT) {
            makeCallVT();
          }
          else {

            VT_Call_Battery_level(battery_level_at_start);
            console.log("VT call test Completed");
            document.getElementById('testStatus').innerHTML = "<h3>VT Call Test Completed...</h3>";
            messaging();
          }
        }, callTimeIntervalVT); //interval 10 secs

      };
    });
  }
}


//Scenario 5 - Messaging for 15 Mins
function messaging() {
  navigator.getBattery().then(function (battery) {
    console.log("Battery level: " + battery.level * 100 + " %");
    battery_level_at_start = "\r\n Battery level at the start of test scenario: " + battery.level * 100 + " %";
  });
  if (consoleShow != false) {
    console.log("Scenario 3 - Gdou-test messaging started");
    console.log("Gdou-test network check", networkCheck());
  }

  if (networkCheck() === false) {
    document.getElementById('testStatus').innerHTML = "<h4>  Checking for network connection...</h4>";
    swal({
      title: 'No network',
      timer: 5000
    })

    setTimeout(function () {
      messaging();
    }, 10000)
  }
  else {
    document.getElementById('testStatus').innerHTML = "<h3>  Test is in Progress.<br>Sending SMS...</h3>";
    var startTime_sms = new Date();
    var message = "Gdou Test For JPV phones..!!!";

    navigator.mozMobileMessage.send(Number, message);
    messageNumber = messageNumber + 1;


    setTimeout(function () {
      if (messageNumber < smsTotal) {
        messaging();
      }
      else {
        messaging_Battery_level(battery_level_at_start);
        console.log("Messaging test case completed");
        document.getElementById('testStatus').innerHTML = "<h3> Messaging test scenario Completed...</h4>";
        browse_facebook();  //for test
      }
    }, smstimeInterval); //interval 3 Mins
    if (consoleShow != false) {
      console.log("Scenario 3 - Gdou-test sent Message");
    }
  }

}

//Scenario 6 - Browse Facebook for 15 mins
function browse_facebook() {
  navigator.getBattery().then(function (battery) {
    console.log("Battery level: " + battery.level * 100 + " %");
    battery_level_at_start = "\r\n Battery level at the start of test scenario: " + battery.level * 100 + " %";
  });
  if (consoleShow !== false) {
    console.log("Gdou-test Facebook started");
    console.log("Gdou-test network check", networkCheck());
  }
  if (networkCheck() === false) {
    document.getElementById("testStatus").innerHTML = "<h4>  Checking for network connection...</h4>";
    swal({
      title: "No network",
      timer: 5000
    });
    setTimeout(function () {
      browse_facebook();
    }, 10000)

  } else {
    document.getElementById('testStatus').innerHTML = "<h4>  Test is in Progress.<br>Facebook...</h4>";
    var win = window.open(facebookURL);
    console.log(win);
    browseFBNumber = browseFBNumber + 1;
    setTimeout(function () {
      win.close();
      if (browseFBNumber < 1) {
        browse_facebook();
      }
      else {
        //display();
        browse_facebook_Battery_level(battery_level_at_start);
        console.log("Facebook browsing test case completed");
        document.getElementById('testStatus').innerHTML = "<h4> Facebook browsing test completed... </h4> "
        playFM_91(); //for test
      }
    }, downloadDataDuration);  //duration 15 Mins
    if (consoleShow != false) {
      console.log("Scenario 5 - Gdou-test Facebook");
    }
  }
}

//Scenario 7 - Play FM for 1.25hrs
function playFM_91() {
  navigator.getBattery().then(function (battery) {
    console.log("Battery level: " + battery.level * 100 + " %");
    battery_level_at_start = "\r\n Battery level at the start of test scenario: " + battery.level * 100 + " %";
  });
  document.getElementById('testStatus').innerHTML = "<h4>  Test is in Progress.<br>Playing FM. 91.1 Station</h4>";
  var lock = navigator.mozSettings.createLock();
  var result = lock.set({ 'screen.brightness': 0.1 });
  var frequency = 91.1;
  console.log("Frequency : " + frequency);
  fmRadio = navigator.mozFMRadio.enable(frequency);
  console.log(fmRadio);
  console.log("Playing " + frequency + "FM now...");
  document.getElementById("fmDiv").style.display = "block";
  setTimeout(function () {
    fmRadio_1 = navigator.mozFMRadio.disable(frequency);
    console.log("FM is stopped...");
    document.getElementById("fmDiv").style.display = "none";
  }, fmInterval);
  fmNumber_91 = fmNumber_91 + 1;
  console.log("fmNumber", fmNumber);
  setTimeout(function () {

    if (fmNumber_91 < 1) {
      playFM_91();
    }
    else {
      playFM_92(battery_level_at_start);
    }
  }, fmInterval);
}

function playFM_92(battery_level_at_start) {
  battery_level = battery_level_at_start;
  document.getElementById('testStatus').innerHTML = "<h4>  Test is in Progress.<br>Playing FM. 92.7 Station</h4>";
  var frequency = 92.7;
  console.log("Frequency : " + frequency);
  fmRadio = navigator.mozFMRadio.enable(frequency);
  console.log(fmRadio);
  console.log("Playing " + frequency + "FM now...");
  document.getElementById("fmDiv").style.display = "block";
  setTimeout(function () {
    fmRadio_1 = navigator.mozFMRadio.disable(frequency);
    console.log("FM is stopped...");
    document.getElementById("fmDiv").style.display = "none";
  }, fmInterval);
  fmNumber_92 = fmNumber_92 + 1;
  console.log("fmNumber", fmNumber_92);
  setTimeout(function () {

    if (fmNumber_92 < 1) {
      playFM_92();
    }
    else {
      playFM_93(battery_level);
    }
  }, fmInterval);
}

function playFM_93(battery_level_at_start) {
  battery_level = battery_level_at_start;
  document.getElementById('testStatus').innerHTML = "<h4>  Test is in Progress.<br>Playing FM. 93.5 Station</h4>";
  var frequency = 93.5;
  console.log("Frequency : " + frequency);
  fmRadio = navigator.mozFMRadio.enable(frequency);
  console.log(fmRadio);
  console.log("Playing " + frequency + "FM now...");
  document.getElementById("fmDiv").style.display = "block";
  setTimeout(function () {
    fmRadio_1 = navigator.mozFMRadio.disable(frequency);
    console.log("FM is stopped...");
    document.getElementById("fmDiv").style.display = "none";
  }, fmInterval);
  fmNumber_93 = fmNumber_93 + 1;
  console.log("fmNumber", fmNumber_93);
  setTimeout(function () {

    if (fmNumber_93 < 1) {
      playFM_93();
    }
    else {
      playFM_98(battery_level);
    }
  }, fmInterval);
}

function playFM_98(battery_level_at_start) {
  battery_level = battery_level_at_start;
  document.getElementById('testStatus').innerHTML = "<h4>  Test is in Progress.<br>Playing FM. 98.3 Station</h4>";
  var frequency = 98.3;
  console.log("Frequency : " + frequency);
  fmRadio = navigator.mozFMRadio.enable(frequency);
  console.log(fmRadio);
  console.log("Playing " + frequency + "FM now...");
  document.getElementById("fmDiv").style.display = "block";
  setTimeout(function () {
    fmRadio_1 = navigator.mozFMRadio.disable(frequency);
    console.log("FM is stopped...");
    document.getElementById("fmDiv").style.display = "none";
  }, fmInterval);
  fmNumber_98 = fmNumber_98 + 1;
  console.log("fmNumber", fmNumber_98);
  setTimeout(function () {

    if (fmNumber_98 < 1) {
      playFM_98();
    }
    else {
      playFM_104(battery_level_at_start);
    }
  }, fmInterval);
}

function playFM_104(battery_level_at_start) {
  document.getElementById('testStatus').innerHTML = "<h4>  Test is in Progress.<br>Playing FM 104.8 Station...</h4>";
  var frequency = 104.8;
  console.log("Frequency : " + frequency);
  fmRadio = navigator.mozFMRadio.enable(frequency);
  console.log(fmRadio);
  console.log("Playing FM now...");
  document.getElementById("fmDiv").style.display = "block";
  setTimeout(function () {
    fmRadio_1 = navigator.mozFMRadio.disable(frequency);
    console.log("FM is stopped...");
    document.getElementById("fmDiv").style.display = "none";
  }, fmInterval);
  fmNumber_104 = fmNumber_104 + 1;
  console.log("fmNumber", fmNumber_104);
  setTimeout(function () {

    if (fmNumber_104 < 1) {
      playFM_104();
    }
    else {
      //playmusic();
      fm_Battery_level(battery_level_at_start);
      console.log("FM test case Completed...");
      document.getElementById('testStatus').innerHTML = "<h4> FM test Scenario Completed... </h4>";
      display();
    }
  }, fmInterval);
}

//Scenario 8 - 60% brightness display for 30 mins
function display() {
  navigator.getBattery().then(function (battery) {
    console.log("Battery level: " + battery.level * 100 + " %");
    battery_level_at_start = "\r\n Battery level at the start of test scenario: " + battery.level * 100 + " %";
  });
  if (consoleShow !== false) {
    console.log("Gdou-test Display started");
    console.log("Gdou-test network check", networkCheck());
  }
  if (networkCheck() === false) {
    document.getElementById("testStatus").innerHTML = "<h4>  Checking for network connection...</h4>";
    swal({
      title: "No network",
      timer: 5000
    });
    setTimeout(function () {
      display();
    }, 10000)
  }
  else {
    document.getElementById('testStatus').innerHTML = "<h3>Test is in Progress.<br>LCD idle with 100% brightness...</h3>";
    var lock = navigator.mozSettings.createLock();
    var result = lock.set({ 'screen.brightness': 0.6 });
    var win = window.open("https://mobile-automation-testing.blogspot.com/");
    console.log(win);
    displayNumber = displayNumber + 1;
    setTimeout(function () {
      win.close();
      if (displayNumber < 1) {
        display();
      }
      else {
        lcd_idle_Battery_level(battery_level_at_start);
        console.log("Display test case Completed");
        document.getElementById('testStatus').innerHTML = "<h4> Display test scenario completed...</h4>";
        playmusic(); //for test
      }
    }, videoDuration);//); // 30 Mins
    if (consoleShow != false) {
      console.log("LCD idle with 100% brightness is Completed....");
    }
  }
}

//Scenario 9 - Play Music for 30 Mins brightness 10%

function playmusic() {
  navigator.getBattery().then(function (battery) {
    console.log("Battery level: " + battery.level * 100 + " %");
    battery_level_at_start = "\r\n Battery level at the start of test scenario: " + battery.level * 100 + " %";
  });
  //document.getElementById('testStatus').innerHTML = "<h4>  Test is in Progress.<br>Playing Music...</h4>";
  var lock = navigator.mozSettings.createLock();
  var result = lock.set({ 'screen.brightness': 0.1 });
  var myAudio = new Audio();
  myAudio.preload = 'none';
  myAudio.mozAudioChannelType = 'content';
  myAudio.src = 'tracks/Love.mp3';
  document.getElementById("musicDiv").style.display = "block";
  myAudio.play();
  setTimeout(function () {
    myAudio.pause();
    document.getElementById("musicDiv").style.display = "none";
  }, musicDuration);
  musicNumber = musicNumber + 1;
  console.log("musicNumber", musicNumber);
  setTimeout(function () {
    if (musicNumber < 1) {
      playmusic();
    }
    else {
      play_music_Battery_level(battery_level_at_start);
      console.log("Play music test case Completed");
      document.getElementById('testStatus').innerHTML = "<h4> Play music test scenario completed...</h4>";
      Browsing();
    }
  }, musicInterval); //30 mins
}

//Scenario 10  - Browsing on default brightness for 30 Mins
function Browsing() {
  navigator.getBattery().then(function (battery) {
    console.log("Battery level: " + battery.level * 100 + " %");
    battery_level_at_start = "\r\n Battery level at the start of test scenario: " + battery.level * 100 + " %";
  });
  var lock = navigator.mozSettings.createLock();
  var result = lock.set({ 'screen.brightness': 0.6 });


  if (consoleShow != false) {
    console.log("Gdou-test - Scenario 6 - Browsing on default brightness of 70%");
    console.log("Gdou-test network check", networkCheck());
  }

  if (networkCheck() === false) {
    document.getElementById('testStatus').innerHTML = "<h4>Checking for network connection...</h4>";
    swal({
      title: 'No network',
      timer: 5000
    })

    setTimeout(function () {
      Browsing();
    }, 10000)
  }
  else {
    document.getElementById('testStatus').innerHTML = "<h3>Test is in Progress.<br>Browsing with default brightness...</h3>";

    var win = window.open("http://yahoo.com");
    //var win = window.open("http://streambox.fr/mse/hls.js-0.8.4/demo/");
    console.log(win);
    videoOnlineNumber = videoOnlineNumber + 1;


    setTimeout(function () {
      win.close();
      if (videoOnlineNumber < 1) {
        Browsing();
      }
      else {
        browsing_Battery_level(battery_level_at_start);
        console.log("Browsing test case completed");
        document.getElementById('testStatus').innerHTML = "<h4> Browsing test scenario completed...</h4>";
        playvideo();
      }
    }, browsetimeDuration);
    if (consoleShow != false) {
      console.log("Scenario 6 : Browsing on default brightness of 70% is Completed...");
    }
  }

}

//Scenario 11 - Play local Video for 30 Mins
function playvideo() {
  navigator.getBattery().then(function (battery) {
    console.log("Battery level: " + battery.level * 100 + " %");
    battery_level_at_start = "\r\n Battery level at the start of test scenario: " + battery.level * 100 + " %";
  });
  var lock = navigator.mozSettings.createLock();
  var result = lock.set({ 'screen.brightness': 0.6 });
  //document.getElementById('testStatus').innerHTML = "<h4>  Test is in Progress.<br>Playing Video...</h4>";
  var myvid = document.getElementById("myVideo");
  document.getElementById("myVideo").style.display = "block";
  myvid.play();
  setTimeout(function () {
    myvid.pause();
    document.getElementById("myVideo").style.display = "none";
  }, videoDuration);


  videoNumber = videoNumber + 1;
  console.log("videoNumber", videoNumber);
  setTimeout(function () {
    if (videoNumber < 1) {
      playvideo();
    }
    else {
      play_video_Battery_level(battery_level_at_start);
      console.log("Play video offline test case completed");
      music_online();
    }
  }, videoInetrval);
}

// Scenario 12 - Play Music Online for 1 hr
function music_online() {
  navigator.getBattery().then(function (battery) {
    console.log("Battery level: " + battery.level * 100 + " %");
    battery_level_at_start = "\r\n Battery level at the start of test scenario: " + battery.level * 100 + " %";
  });
  var lock = navigator.mozSettings.createLock();
  var result = lock.set({ 'screen.brightness': 0.1 });
  if (consoleShow != false) {
    console.log("Gdou-test - Scenario 8 - Play Music Online");
    console.log("Gdou-test network check", networkCheck());
  }

  if (networkCheck() === false) {
    document.getElementById('testStatus').innerHTML = "<h4>Checking for network connection...</h4>";
    swal({
      title: 'No network',
      timer: 5000
    })

    setTimeout(function () {
      music_online();
    }, 10000)
  }
  else {

    document.getElementById('testStatus').innerHTML = "<h4>Test is in Progress.<br>Play Music Online...</h4>";
    var win = window.open("http://stream-tx3.radioparadise.com/mp3-192");
    setTimeout(function () {
      console.log("win", win);
      win.close();
    }, musicOnlineDuration);
    musicOnlineNumber = musicOnlineNumber + 1;
    setTimeout(function () {
      //console.log("screenBrightnessNumber",screenBrightnessNumber);
      if (musicOnlineNumber < 1) {
        music_online();
      }
      else {
        play_music_online_Battery_level(battery_level_at_start);
        console.log("Play Music Online test case completed");
        document.getElementById('testStatus').innerHTML = "<h4> Play music online test scenario completed...</h4>";
        standby();
      }
    }, musicOnlineDurationInterval);

  }

}

function onMozAlarm(message) {
  // message.detail in only for marionette test.
  // We pass it via AlarmActions.fire method.
  var data = message.data || message.detail;
  data.date = message.date || message.detail.date;
  navigator.mozAlarms.remove(data.id);
  console.log("GDOU_" + " ALARM FIRED! ### Details:", JSON.stringify(message));
  console.log("GDOU_" + "StandBy Iteration " + standbyNumber);
  standby(data.standbyNumber);
}

//Scenario 13 - Idle for 16 hrs.
function standby(standbyNumber) {
  console.log("GDOU_" + "StandBy Iteration " + standbyNumber);
  if (!standbyNumber) {
    record_battery_level_at_start("standby");
    standbyNumber = 0;
  } else {
    save_battery_level_report("standby_" + standbyNumber);
    console.log("GDOU_" + "StandBy Iteration " + standbyNumber + " end");
  }
  standbyNumber++;
  console.log("GDOU_" + "StandBy Iteration " + standbyNumber + " started");
  record_battery_level_at_start("standby_" + standbyNumber);

  console.log("GDOU_" + "Standby testcase Seting screen timeout to 1");
  var lock = navigator.mozSettings.createLock();
  var result = lock.set({ "screen.timeout": 1 });
  console.log("GDOU_" + "Set screen timeout to 1");

  document.getElementById("testStatus").innerHTML =
    "<h3>  Test is in Progress.<br>Opening Standby...</h3>" +
    "<br><h3>Stage " +
    standbyNumber;

  if (standbyNumber <= standbycount) {
    var now = new Date();
    var firedate = new Date(now.getTime() + standbyinterval);
    navigator.mozAlarms.add(firedate, 'ignoreTimezone', { "standbyNumber": standbyNumber, "type": "GDOU" });
  } else {
    save_battery_level_report("standby");
    document.getElementById("testStatus").innerHTML =
      "<h4>  Test End...</h4>";
    console.log("GDOU_" + "End of the test Batch");
    var lock = navigator.mozSettings.createLock();
    var result = lock.set({ "screen.timeout": 120 });
    console.log("GDOU_" + "StandBy Test case Completed");
  }
}


function downloadReport(data, filename, type) {
  var file = new Blob([data], { type: type });
  if (window.navigator.msSaveOrOpenBlob) { // IE10+
    window.navigator.msSaveOrOpenBlob(file, filename);
  } else { // Others
    console.log("Kaios-test download report");
    var a = document.createElement("a"), url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    console.log("Kaios-test:download successful", a);
    setTimeout(function () {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 90000);
  }
}
function timeFormat(diffTime) {
  seconds = Math.floor(diffTime / 1000);
  minutes = Math.floor(seconds / 60);
  hours = Math.floor(minutes / 60);
  days = addZero(Math.floor(hours / 24));

  hh = addZero(hours - (days * 24));
  mm = addZero(minutes - (days * 24 * 60) - (hours * 60));
  ss = addZero(seconds - (days * 24 * 60 * 60) - (hours * 60 * 60) - (minutes * 60));
  totalRunTime = days + "Days " + hh + "Hr " + mm + "Min " + ss + "Sec ";
  if (consoleShow != false) {
    console.log("Kaios-test runTime diff", days + "Days" + hh + ":" + mm + ":" + ss);
  }
}

function addZero(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

//var content = Initial_battery + call_battery + video_online_battery + messaging_battery + download_battery + Facebook_battery + lcd_idle_battery+ FM_battery + music_battery + display_battery + video_battery + music_online_battery + "\r\n Battery level after standby scenario : " + level_change + "\r\n Total runtime: " + totalRunTime + ",\r\n Time: "+ d.toString();
