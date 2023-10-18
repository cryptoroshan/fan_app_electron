'use strict';
const constants = require('../constants.js');

class FanData {
  constructor(numTemp, numTach, numVolt, numFan) {
    this.numTemp = numTemp;
    this.numTach = numTach;
    this.numVolt = numVolt;
    this.numFan = numFan;
  }

  static fromCSV(numTemp, numTach, numVolt, numFan, maxVoltages, raw) {
    let newData = new FanData(numTemp, numTach, numVolt, numFan);

    var values = raw.split(",");
    newData.temperature = [];
    var running = 0;
    for(var i = 0; i < newData.numTemp; i++) {
      newData.temperature[i] = values[running++];
    }

    newData.voltage = [];
    for(var i = 0; i < newData.numVolt; i++) {
      newData.voltage[i] = values[running++] / 10.0;
      if(maxVoltages[i] < 0) {
        newData.voltage[i] = -1*newData.voltage[i];
      }
    }

    newData.fanCtrl = [];
    for(var i = 0; i < newData.numFan; i++) {
      newData.fanCtrl[i] = values[running++];
    }

    newData.tach = [];
    for(var i = 0; i < newData.numTach; i++) {
      newData.tach[i] = values[running++];
    }

    if(values[running++] == 1) {
      newData.errorMask = newData.errorMask | constants.ERROR_VOLTAGE;
    }
    if(values[running++] == 1) {
      newData.errorMask = newData.errorMask | constants.ERROR_FAN;
    }
    if(values[running++] == 1) {
      newData.errorMask = newData.errorMask | constants.ERROR_TEMP;
    }
    if(values[running++] == 1) {
      newData.errorMask = newData.errorMask | constants.ERROR_SOUND;
    }

    return newData;
  }

  static fromCSV2(raw) {
    let newData = new FanData();
    var index = 0;

    var values = raw.split(",");
    const protoVersion = values[index++];
    newData.numTemp = values[index++];
    newData.numVolt = values[index++];
    newData.numFan = values[index++];
    newData.numTach = values[index++];

    newData.temperature = [];
    for(var i = 0; i < newData.numTemp; i++) {
      newData.temperature[i] = parseFloat(values[index++]);
    }

    newData.voltage = [];
    for(var i = 0; i < newData.numVolt; i++) {
      newData.voltage[i] = parseFloat(values[index++]);
    }

    newData.fanCtrl = [];
    for(var i = 0; i < newData.numFan; i++) {
      newData.fanCtrl[i] = parseFloat(values[index++]);
    }

    newData.tach = [];
    for(var i = 0; i < newData.numTach; i++) {
      newData.tach[i] = parseFloat(values[index++]);
    }

    newData.errorMask = values[index++];

    return newData;
  }

  static getFloatFromBytes(raw, index) {
    var b = [raw[index + 3],
    raw[index + 2],
    raw[index + 1],
    raw[index + 0]
    ]
    return Buffer.from(b).readFloatBE(0)
  }

  static fromBase64(raw) {
    let newData = new FanData();
    var index = 0;

    var protoVersion = raw[index++]
    const numTemp = raw[index++] / 4
    newData.numTemp = numTemp;
    newData.temperature = [];
    for(var i = 0; i < numTemp; i++) {
      newData.temperature[i] = this.getFloatFromBytes(raw, index);
      index = index + 4;
    }

    const numTach = raw[index++] / 4
    newData.numTach = numTach;
    newData.tach = [];
    for(var i = 0; i < numTach; i++) {
      newData.tach[i] = this.getFloatFromBytes(raw, index);
      index = index + 4;
    }
    const numVolt = raw[index++] / 4
    newData.numVolt = numVolt;
    newData.voltage = [];
    for(var i = 0; i < numVolt; i++) {
      newData.voltage[i] = this.getFloatFromBytes(raw, index);
      index = index + 4;
    }
    const numFan = raw[index++] / 4
    newData.numFan = numFan;
    newData.fanCtrl = [];
    for(var i = 0; i < numFan; i++) {
      newData.fanCtrl[i] = this.getFloatFromBytes(raw, index);
      index = index + 4;
    }

    raw[index++];
    newData.gpio_states = ((raw[index++] & 0xFF) | ((raw[index++] << 8) & 0xFF));

    const numError = raw[index++];
    newData.errorMask = raw[index++];
    return newData;
  }

  isVoltageError(config) {
    for(var i = 0; i < this.numVolt; i++) {
      if(this.isIVoltageError(config, i)) {
        return true;
      }
    }
    return false;
  }
  isIVoltageError(config, i) {
    if(this.voltage[i] < config.voltageLowerThreshold[i] ||
      (config.voltageUpperThreshold && config.voltageUpperThreshold[i] && this.voltage[i] > config.voltageUpperThreshold[i])) {
      return true;
    }
    return false;
  }
  isFanError(config) {
    for(var i = 0; i < this.numTach; i++) {
      if(this.isIFanError(config, i)) {
        return true;
      }
    }
    return false;
  }
  isIFanError(config, i) {
    if(this.tach[i] < config.tachLowerThreshold[i]) {
      return true;
    }
    return false;
  }
  isTempError(config) {
    for(var i = 0; i < this.numTemp; i++) {
      if(this.isITempError(config, i)) {
        return true;
      }
    }
    return false;
  }
  isITempError(config, i) {
    if (config.tempType[i] > 0 && this.temperature[i] < config.tempLowerThreshold[i]) {
      return true;
    } else if (config.tempType[i] > 0 && this.temperature[i] > config.tempUpperThreshold[i]) {
      return true;
    }
    return false;
  }

  isDC1Error() {
    return !((this.gpio_states & constants.GPIO_PSU_DC_1) == 0);
  }
  isDC2Error() {
    return !((this.gpio_states & constants.GPIO_PSU_DC_2) == 0);
  }

  isAC1Error() {
    return !((this.gpio_states & constants.GPIO_PSU_AC_1) == 0);
  }
  isAC2Error() {
    return !((this.gpio_states & constants.GPIO_PSU_AC_2) == 0);
  }

  is481Error() {
    return !((this.gpio_states & constants.GPIO_PSU_48_1) == 0);
  }
  is482Error() {
    return !((this.gpio_states & constants.GPIO_PSU_48_2) == 0);
  }
}

module.exports = {
  FanData
};