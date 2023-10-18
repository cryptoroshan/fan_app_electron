'use strict';

const { FanData } = require('./FanData.js');
const { FanConfig } = require('./FanConfig.js');
const { FanHW } = require('./FanHW.js');

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const constants = require('../constants.js');

const HW_STATE_UNKNOWN = -1;
const HW_STATE_CONNECTED = 2;
const HW_STATE_DISCONNECTED = 3;


class FanHWUART extends FanHW {
  constructor(model) {
    super(model);
    this.hwState = HW_STATE_UNKNOWN
    this.portName = ""
    this.port = null
  }

  connect(port) {
    if (this.hwState == HW_STATE_CONNECTED) {
      console.log("already connected");
      return;
    }

    this.portName = port.path;
    this.port = new SerialPort(this.portName, { baudRate: 9600 }, (err) => {
      console.log(err);
      if (err) {
        console.log("Failed to connect to the port.");
        this.doDisconnect();
        setTimeout(() => {
          this.connect(port);
        }, 1000);
      } else {
        this.hwState = HW_STATE_CONNECTED;
        this.emit(constants.EVENT_FANHW_STATE_UPDATE);

        const parser = new Readline()
        this.port.pipe(parser);
        parser.on('data', (info) => {
          this.onReceive(info)
        });

        this.port.on('close', (info) => {
          console.log(info);
          this.doDisconnect();
        });

       
        this.loadConfig();
      }
    });
  }

  disconnect() {
    port.close((err) => {
      console.log("Fan disconncted: " + this.portName + "|" + err);
      doDisconnect();
    });
  }

  doDisconnect() {
    this.hwState = HW_STATE_DISCONNECTED;
    this.emit(constants.EVENT_FANHW_STATE_UPDATE);
    this.removeAllListeners(constants.EVENT_FANHW_STATE_UPDATE);
  }

  isDisconnected() {
    return this.hwState == HW_STATE_UNKNOWN || this.hwState == HW_STATE_DISCONNECTED;
  }

  isConnected() {
    return this.hwState == HW_STATE_CONNECTED;
  }

  onReceive(info) {
    console.log(info);

    let numTemp = this.getNumTempFromModel();
    let numTach = this.getNumTachFromModel();
    let numVolt = this.getNumVoltFromModel();
    let numFan = this.getNumFanFromModel();

    if (info.startsWith("FCR") || info.startsWith("GCR")) { //config data
      if (this.model == constants.MODEL_V1) {
        this.config = FanConfig.fromCSV(numTemp, numTach, numVolt, numFan, this.getMaxVoltage(), info.slice(4)); //peel off FCR,
      } else if(info.startsWith("FCR")) {
        this.config = FanConfig.fromCSV2(info.slice(4)); //peel off FCR,
      } else {
        this.config = FanConfig.fromBase64(this.getMaxVoltage(), Buffer.from(info.slice(4), 'base64')); //peel off FCR,
      }

      this.loadVersion();
      this.emit(constants.EVENT_FANHW_CONFIG_UPDATE);
    } else if (info.startsWith("FCD") || info.startsWith("GCD")) { //sensor data
      if (this.model == constants.MODEL_V1) {
        this.lastData = FanData.fromCSV(numTemp, numTach, numVolt, numFan, this.getMaxVoltage(), info.slice(4));
      } else if(info.startsWith("FCD")) {
        this.lastData = FanData.fromCSV2(info.slice(4));
      } else {
        this.lastData = FanData.fromBase64(Buffer.from(info.slice(4), 'base64'));
      }
      console.log("PWM: " + this.lastData.fanCtrl[0])
      console.log("PWM: " + this.lastData.fanCtrl[1])
      this.emit(constants.EVENT_FANHW_DATA_UPDATE);
    } else if (info.startsWith("FVV") || info.startsWith("GVV")) { //sensor data
      var values = info.split(",");
      this.majorVersion = values[1];
      this.minorVersion = values[2];
    }
  }

  loadVersion() {
    if (this.hwState == HW_STATE_CONNECTED) {
      if (this.model ==  constants.MODEL_V1) {
        this.port.write("FCV\n")
      } else {
       this.port.write("FCV\n")
      }
    }
  }

  loadConfig() {
    if (this.hwState == HW_STATE_CONNECTED) {
      if (this.model == constants.MODEL_V1) {
        this.port.write("FCQ\n")
      } else {
        this.port.write("FCQ\n")
      }
    }
  }
  saveConfig(fanConfig) {
    if (this.hwState == HW_STATE_CONNECTED) {
      if (this.model == constants.MODEL_V1) {
        this.port.write("FCS,");
        this.port.write(fanConfig.toCSV());
        this.port.write("\n");
      } else  if (this.model == constants.MODEL_V1a || this.model == constants.MODEL_V2) {
        this.port.write("FCS,");
        this.port.write(fanConfig.toCSV2());
        this.port.write("\n");
      } 
      this.config = fanConfig;
      this.emit(constants.EVENT_FANHW_STATE_UPDATE);
    }
  }

  rebootToBoot() {
    if (this.hwState == HW_STATE_CONNECTED) {
      if (this.model == constants.MODEL_V1)
        this.port.write("FCR\n");
      else {
        this.port.write("FCR\n");
      }
    }
  }
}

module.exports = {
  FanHWUART
};