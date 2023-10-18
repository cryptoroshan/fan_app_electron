'use strict';

class FanConfig {
  constructor(numTemp, numTach, numVolt, numFan, maxVoltages) {
    this.numTemp = numTemp;
    this.numTach = numTach;
    this.numFan = numFan;
    this.numVolt = numVolt;
    this.maxVoltages = maxVoltages;
  }

  static convertToDisplay(value, max, type) {
    if (type == 1) {
      return ((value) / max) * 100
    } else {
      return value;
    }
  }

  static convertFromDisplay(value, max, type) {
    if (type == 1) {
      return (value / 100) * max;
    } else {
      return value;
    }
  }

  toCSV() {
    let rtnValue = ""
    for (var i = 0; i < this.numTemp; i++) {
      rtnValue += this.tempType[i] + ",";
    }

    for (var i = 0; i < this.numFan; i++) {
      rtnValue += this.fanConfig[i].minPWM + ",";
      rtnValue += this.fanConfig[i].tempSensor + ",";
      rtnValue += this.fanConfig[i].tempAtMinSpeed + ",";
      rtnValue += this.fanConfig[i].tempAtMaxSpeed + ",";
      rtnValue += (this.fanConfig[i].canStop ? "1" : "0") + ",";
      rtnValue += this.fanConfig[i].type + ",";
    }

    //FUDGE
    for(var i = 0; i < 2*6; i++) {
      rtnValue += "0,";
    }

    for (var i = 0; i < this.numVolt; i++) {
      rtnValue += Math.abs(this.voltageThreshold[i]) * 10 + ",";
      rtnValue += (this.voltageThresholdType[i] ? "1" : "0") + ",";
    }

    rtnValue = rtnValue.slice(0, -1);
    return rtnValue;
  }

  toCSV2() {
    let cFormat = new Intl.NumberFormat(undefined, { style: 'decimal', minimumFractionDigits: 1, maximumFractionDigits: 1 })

    let rtnValue = "";
    rtnValue +=  0x10 + ",";
    for (var i = 0; i < this.numTemp; i++) {
      rtnValue +=  this.tempType[i] + ",";
      rtnValue +=  this.tempLowerThreshold[i] + ",";
      rtnValue +=  this.tempUpperThreshold[i] + ",";
    }

    for (var i = 0; i < this.numFan; i++) {
      rtnValue += this.fanConfig[i].minPWM + ",";
      rtnValue += this.fanConfig[i].maxPWM + ",";
      rtnValue += this.fanConfig[i].tempSensor + ",";
      rtnValue += this.fanConfig[i].tempAtMinSpeed + ",";
      rtnValue += this.fanConfig[i].tempAtMaxSpeed + ",";
      rtnValue += (this.fanConfig[i].canStop ? 1 : 0) + ",";
      rtnValue += this.fanConfig[i].type + ",";
      rtnValue += this.fanConfig[i].calcType + ",";
      rtnValue += this.fanConfig[i].delta + ",";
      rtnValue += this.fanConfig[i].deltaFudge + ",";
      rtnValue += cFormat.format(this.fanConfig[i].deltaRamp) + ",";
    }

    for (var i = 0; i < this.numVolt; i++) {
      rtnValue += cFormat.format(this.voltageLowerThreshold[i]) + ",";
      rtnValue += cFormat.format(this.voltageUpperThreshold[i]) + ",";
      rtnValue +=  (this.voltageThresholdType[i] ? 1 : 0) + ",";
      rtnValue += "0,";
    }

    for (var i = 0; i < this.numTach; i++) {
      rtnValue +=  this.tachLowerThreshold[i] + ",";
    }

    rtnValue = rtnValue.slice(0, -1);
    console.log(rtnValue);
    return rtnValue;
  }

  static fromCSV(numTemp, numTach, numVolt, numFan, maxVoltages, raw) {
    let newConfig = new FanConfig(numTemp, numTach, numVolt, numFan, maxVoltages);
    var values = raw.split(",");
    var index = 0;
    newConfig.tempType = [];
    newConfig.tempLowerThreshold = [];
    newConfig.tempUpperThreshold = [];
    for (var i = 0; i < numTemp; i++) {
      newConfig.tempType[i] = parseInt(values[index++]);
      newConfig.tempLowerThreshold[i] = 0
      newConfig.tempUpperThreshold[i] = 50
    }

    newConfig.fanConfig = [];
    for (var i = 0; i < numFan; i++) {
      newConfig.fanConfig[i] = {};
      newConfig.fanConfig[i].minPWM = parseInt(values[index++]);
      newConfig.fanConfig[i].maxPWM = 100;
      newConfig.fanConfig[i].tempSensor = parseInt(values[index++]);
      newConfig.fanConfig[i].tempAtMinSpeed = parseInt(values[index++]);
      newConfig.fanConfig[i].tempAtMaxSpeed = parseInt(values[index++]);
      newConfig.fanConfig[i].canStop = parseInt(values[index++]);
      newConfig.fanConfig[i].type = parseInt(values[index++]);
      newConfig.fanConfig[i].calcType = 0;
    }

    //inconsisten numFan in that firmware. Skip fan 3/4
    index = index + 2*6;

    newConfig.voltageThreshold = new Array(numVolt);
    newConfig.voltageLowerThreshold = new Array(numVolt); //default values
    newConfig.voltageUpperThreshold = new Array(numVolt);
    newConfig.voltageThresholdType = new Array(numVolt);
    if (values.length > 26) {
      for (var i = 0; i < numVolt; i++) {
        let thresholdValue = parseInt(values[index++]) / 10.0;
        newConfig.voltageThreshold[i] = thresholdValue;
        newConfig.voltageThresholdType[i] = parseInt(values[index++]);
        if (maxVoltages[i] > 0) {
          newConfig.voltageLowerThreshold[i] = thresholdValue;
          if (newConfig.voltageThresholdType[i] == 0) {
            newConfig.voltageUpperThreshold[i] = maxVoltages[i] + (maxVoltages[i] - newConfig.voltageLowerThreshold[i]);
          } else {
            newConfig.voltageUpperThreshold[i] = (2 - newConfig.voltageLowerThreshold[i]);
          }
        }

        if (maxVoltages[i] < 0) {
          newConfig.voltageUpperThreshold[i] = thresholdValue;
          if (newConfig.voltageThresholdType[i] == 0) {
            newConfig.voltageUpperThreshold[i] = -1 * newConfig.voltageUpperThreshold[i]
            newConfig.voltageLowerThreshold[i] = maxVoltages[i] + (maxVoltages[i] - newConfig.voltageUpperThreshold[i]);
          } else {
            newConfig.voltageUpperThreshold[i] = (2 - newConfig.voltageLowerThreshold[i]);
          }
        }
      }
    }

    newConfig.tachLowerThreshold = new Array(numFan);
    for (var i = 0; i < numTach; i++) {
      newConfig.tachLowerThreshold[i] = 1500;
    }

    return newConfig;
  }

  static fromCSV2(raw) {
    let newConfig = new FanConfig();
    var values = raw.split(",");
    var index = 0;

    const protoVersion = values[index++];
    newConfig.isAscii = true;
    newConfig.numTemp = values[index++];
    newConfig.numVolt = values[index++];
    newConfig.numFan = values[index++];
    newConfig.numTach = values[index++];

    newConfig.tempType = [];
    newConfig.tempLowerThreshold = [];
    newConfig.tempUpperThreshold = [];
    for (var i = 0; i < newConfig.numTemp; i++) {
      newConfig.tempType[i] = parseInt(values[index++]);
      newConfig.tempLowerThreshold[i] = parseInt(values[index++])
      newConfig.tempUpperThreshold[i] = parseInt(values[index++])
    }

    newConfig.fanConfig = [];
    for (var i = 0; i < newConfig.numFan; i++) {
      newConfig.fanConfig[i] = {};
      newConfig.fanConfig[i].minPWM = parseInt(values[index++]);
      newConfig.fanConfig[i].maxPWM = parseInt(values[index++]);
      newConfig.fanConfig[i].tempSensor = parseInt(values[index++]);
      newConfig.fanConfig[i].tempAtMinSpeed = parseInt(values[index++]);
      newConfig.fanConfig[i].tempAtMaxSpeed = parseInt(values[index++]);
      newConfig.fanConfig[i].canStop = parseInt(values[index++]);
      newConfig.fanConfig[i].type = parseInt(values[index++]);
      newConfig.fanConfig[i].calcType = parseInt(values[index++]);
      newConfig.fanConfig[i].delta = parseInt(values[index++]);
      newConfig.fanConfig[i].deltaFudge = parseInt(values[index++]);
      newConfig.fanConfig[i].deltaRamp = parseFloat(values[index++]);
    }

    newConfig.voltageThreshold = new Array(newConfig.numVolt);
    newConfig.voltageLowerThreshold = new Array(newConfig.numVolt); //default values
    newConfig.voltageUpperThreshold = new Array(newConfig.numVolt);
    newConfig.voltageThresholdType = new Array(newConfig.numVolt);
    newConfig.maxVoltages = new Array(newConfig.numVolt);

      for (var i = 0; i < newConfig.numVolt; i++) {
        newConfig.voltageLowerThreshold[i] = parseFloat(values[index++]);
        newConfig.voltageUpperThreshold[i] = parseFloat(values[index++]);
        newConfig.voltageThresholdType[i] = parseInt(values[index++]);
        newConfig.maxVoltages[i] = parseFloat(values[index++]);
      }

    newConfig.tachLowerThreshold = new Array(newConfig.numTach);
    for (var i = 0; i < newConfig.numTach; i++) {
      newConfig.tachLowerThreshold[i] = parseInt(values[index++]);
    }

    return newConfig;
  }

  static fromBase64(maxVoltages, raw) {
    let newConfig = new FanConfig();
    newConfig.maxVoltages = maxVoltages;
    var index = 0;
    var protVersion = raw[index++];
    if (protVersion != 0x10 && protVersion != 0x11)
      return null;

    newConfig.tempType = [];
    newConfig.tempLowerThreshold = [];
    newConfig.tempUpperThreshold = [];
    var numTemp = raw[index++];
    for (var i = 0; i < numTemp; i++) {
      newConfig.tempType[i] = raw[index++];
      newConfig.tempLowerThreshold[i] = raw[index++];
      newConfig.tempUpperThreshold[i] = raw[index++];
    }

    var numFan = raw[index++];
    newConfig.fanConfig = [];
    for (var i = 0; i < numFan; i++) {
      var len = raw[index++];
      newConfig.fanConfig[i] = {};
      newConfig.fanConfig[i].minPWM = raw[index++];
      newConfig.fanConfig[i].maxPWM = raw[index++];
      newConfig.fanConfig[i].tempSensor = raw[index++];
      newConfig.fanConfig[i].tempAtMinSpeed = raw[index++];
      newConfig.fanConfig[i].tempAtMaxSpeed = raw[index++];
      newConfig.fanConfig[i].canStop = raw[index++];
      newConfig.fanConfig[i].type = raw[index++];
      newConfig.fanConfig[i].calcType = raw[index++];
      newConfig.fanConfig[i].delta = raw[index++];
      newConfig.fanConfig[i].deltaFudge = raw[index++];
      newConfig.fanConfig[i].deltaRamp = FanConfig.getFloatFromBytes(raw, index);
      index = index + 4
    }

    var numVolt = raw[index++];
    newConfig.voltageLowerThreshold = new Array(numVolt); //default values
    newConfig.voltageUpperThreshold = new Array(numVolt);
    newConfig.voltageThresholdType = new Array(numVolt);
    newConfig.maxVoltages = new Array(numVolt);

    for (var i = 0; i < numVolt; i++) {
      newConfig.voltageLowerThreshold[i] = FanConfig.getFloatFromBytes(raw, index);
      index = index + 4
      newConfig.voltageUpperThreshold[i] = FanConfig.getFloatFromBytes(raw, index);
      index = index + 4
      newConfig.voltageThresholdType[i] = raw[index++];
      newConfig.maxVoltages[i] = FanConfig.getFloatFromBytes(raw, index);
      index = index + 4
    }

    var numTach = raw[index++];
    newConfig.tachLowerThreshold = new Array(numTach);
    for (var i = 0; i < numTach; i++) {
      newConfig.tachLowerThreshold[i] = raw[index++] | (raw[index++] << 8);
    }
    newConfig.psuDelay = raw[index++] | (raw[index++] << 8);

    if (protVersion == 0x11) {
      newConfig.useOverride = raw[index++];

      newConfig.fanFactory = {};
      newConfig.fanFactory.dhcp = raw[index++];

      newConfig.fanFactory.ip_address = new Array(4);
      for (var i = 0; i < 4; i++) {
        newConfig.fanFactory.ip_address[i] = raw[index++];
      }
      newConfig.fanFactory.netmask_address = new Array(4);
      for (var i = 0; i < 4; i++) {
        newConfig.fanFactory.netmask_address[i] = raw[index++];
      }
      newConfig.fanFactory.gateway_address = new Array(4);
      for (var i = 0; i < 4; i++) {
        newConfig.fanFactory.gateway_address[i] = raw[index++];
      }
    }

    newConfig.numTemp = numTemp;
    newConfig.numTach = numTach;
    newConfig.numVolt = numVolt;
    newConfig.numFan = numFan;

    return newConfig;
  }

  static getFloatFromBytes(raw, index) {
    var b = [raw[index + 3],
    raw[index + 2],
    raw[index + 1],
    raw[index + 0]
    ]
    return Buffer.from(b).readFloatBE(0)
  }

  static getBytesFromFloat(num) {
    var buffer = Buffer.alloc(4);
    buffer.writeFloatBE(num, 0);
    return buffer
  }


  toBase64(supportIP) {
    let index = 0
    let buff_size = (1 + 1 + this.numTemp * 3 + 1 + this.numFan * (1 + 14) + 1 + this.numVolt * 13 + this.numTach * 2 + 2 + 1 + 2 + 4 + 4 + 4);
    let rtnValue = new Uint8Array(buff_size);
    rtnValue[index++] = supportIP ? 0x11 : 0x10;
    rtnValue[index++] = this.numTemp;
    for (var i = 0; i < this.numTemp; i++) {
      rtnValue[index++] = this.tempType[i];
      rtnValue[index++] = this.tempLowerThreshold[i];
      rtnValue[index++] = this.tempUpperThreshold[i];
    }

    rtnValue[index++] = this.numFan;
    for (var i = 0; i < this.numFan; i++) {
      rtnValue[index++] = 14
      rtnValue[index++] = this.fanConfig[i].minPWM;
      rtnValue[index++] = this.fanConfig[i].maxPWM;
      rtnValue[index++] = this.fanConfig[i].tempSensor;
      rtnValue[index++] = this.fanConfig[i].tempAtMinSpeed;
      rtnValue[index++] = this.fanConfig[i].tempAtMaxSpeed;
      rtnValue[index++] = (this.fanConfig[i].canStop ? 1 : 0);
      rtnValue[index++] = this.fanConfig[i].type;
      rtnValue[index++] = this.fanConfig[i].calcType;
      rtnValue[index++] = this.fanConfig[i].delta;
      rtnValue[index++] = this.fanConfig[i].deltaFudge;
      var floatBuff = FanConfig.getBytesFromFloat(this.fanConfig[i].deltaRamp);
      for (var j = 0; j < 4; j++)
        rtnValue[index++] = floatBuff[3 - j];
    }

    rtnValue[index++] = this.numVolt;
    for (var i = 0; i < this.numVolt; i++) {
      var floatBuff = FanConfig.getBytesFromFloat(this.voltageLowerThreshold[i]);
      for (var j = 0; j < 4; j++)
        rtnValue[index++] = floatBuff[3 - j];
      floatBuff = FanConfig.getBytesFromFloat(this.voltageUpperThreshold[i]);
      for (var j = 0; j < 4; j++)
        rtnValue[index++] = floatBuff[3 - j];
      rtnValue[index++] = (this.voltageThresholdType[i] ? 1 : 0);
      for (var j = 0; j < 4; j++)
        rtnValue[index++] = 0;; //padding
    }

    rtnValue[index++] = this.numTach;
    for (var i = 0; i < this.numTach; i++) {
      rtnValue[index++] = this.tachLowerThreshold[i] & 0xFF;
      rtnValue[index++] = (this.tachLowerThreshold[i] >> 8) & 0xFF;
    }

    rtnValue[index++] = this.psuDelay & 0xFF;
    rtnValue[index++] = (this.psuDelay >> 8) & 0xFF;


    if (supportIP && this.fanFactory) {
      rtnValue[index++] = this.useOverride;
      rtnValue[index++] = this.fanFactory.dhcp;
      for (var i = 0; i < 4; i++) {
        rtnValue[index++] = this.fanFactory.ip_address[i];
      }
      for (var i = 0; i < 4; i++) {
        rtnValue[index++] = this.fanFactory.netmask_address[i];
      }
      for (var i = 0; i < 4; i++) {
        rtnValue[index++] = this.fanFactory.gateway_address[i];
      }
    }

    var concat = "";
    for (var i = 0; i < index; i++) {
      concat = concat.concat(String.fromCharCode(rtnValue[i]));
    }
    return btoa(concat);
  }

  static fromConfig(tConfig, fans, vConfig, ipConfig, oldConfig) {
    let newConfig = new FanConfig();

    newConfig.tempType = [];
    newConfig.tempLowerThreshold = [];
    newConfig.tempUpperThreshold = [];
    for (var i = 0; i < tConfig.length; i++) {
      newConfig.tempType[i] = tConfig[i].tempType;
      if(tConfig[i].tempType > 0) {
        newConfig.tempLowerThreshold[i] = tConfig[i].tempLowerThreshold;
        newConfig.tempUpperThreshold[i] = tConfig[i].tempUpperThreshold;
      } else {
        newConfig.tempLowerThreshold[i] = oldConfig.tempLowerThreshold[i];
        newConfig.tempUpperThreshold[i] = oldConfig.tempUpperThreshold[i];
      }
    }

    newConfig.fanConfig = [];
    for (var i = 0; i < fans.length; i++) {
      newConfig.fanConfig[i] = fans[i];
      newConfig.fanConfig[i].deltaRamp = oldConfig.fanConfig[i].deltaRamp;
    }

    newConfig.voltageThreshold = new Array(vConfig.length);
    newConfig.voltageLowerThreshold = new Array(vConfig.length); //default values
    newConfig.voltageUpperThreshold = new Array(vConfig.length);
    newConfig.voltageThresholdType = new Array(vConfig.length);
    for (var i = 0; i < vConfig.length; i++) {
      newConfig.voltageThreshold[i] = vConfig[i].voltageThreshold;
      newConfig.voltageLowerThreshold[i] = vConfig[i].voltageLowerThreshold;
      newConfig.voltageUpperThreshold[i] = vConfig[i].voltageUpperThreshold;
      newConfig.voltageThresholdType[i] = vConfig[i].voltageThresholdType;
    }

    newConfig.tachLowerThreshold = oldConfig.tachLowerThreshold
    newConfig.psuDelay = oldConfig.psuDelay

    if (ipConfig) {
      newConfig.useOverride = oldConfig.useOverride;
      newConfig.fanFactory = {}
      newConfig.fanFactory.dhcp = ipConfig.dhcp;
      newConfig.fanFactory.ip_address = new Array(4);
      for (var i = 0; i < 4; i++) {
        newConfig.fanFactory.ip_address[i] = ipConfig.ip_address[i];
      }
      newConfig.fanFactory.netmask_address = new Array(4);
      for (var i = 0; i < 4; i++) {
        newConfig.fanFactory.netmask_address[i] = ipConfig.netmask_address[i];
      }
      newConfig.fanFactory.gateway_address = new Array(4);
      for (var i = 0; i < 4; i++) {
        newConfig.fanFactory.gateway_address[i] = ipConfig.gateway_address[i];
      }
    }


    newConfig.numTemp = oldConfig.numTemp
    newConfig.numTach = oldConfig.numTach
    newConfig.numVolt = oldConfig.numVolt
    newConfig.numFan = oldConfig.numFan

    newConfig.maxVoltages = oldConfig.maxVoltages

    return newConfig;
  }
}

module.exports = {
  FanConfig
};