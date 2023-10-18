'use strict';

const {  v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

const HW_STATE_UNKNOWN = -1;
const HW_STATE_CONNECTED = 2;
const HW_STATE_DISCONNECTED = 3;

class FanHW extends EventEmitter {
  constructor(model) {
    super();
    this.id = uuidv4();
    this.model = model

    this.majorVersion = 1
    this.minorVersion = 0
  }

  getId() {
    return this.id;
  }

  getLastConfig() {
    return this.config;
  }
  getLastData() {
    return this.lastData;
  }
  getMajorVersion() {
    return this.majorVersion;
  }
  getMinorVersion() {
    return this.minorVersion;
  }

  isAnyError() {
    if(!this.lastData || !this.config)
      return false
    return (
    this.getLastData().isVoltageError(this.getLastConfig()) || 
    this.getLastData().isFanError(this.getLastConfig()) || 
    this.getLastData().isTempError(this.getLastConfig()) || 

    this.getLastData().isDC1Error() || 
    this.getLastData().isDC2Error() || 
    this.getLastData().isAC1Error() || 
    this.getLastData().isAC2Error() || 
    this.getLastData().is481Error() || 
    this.getLastData().is482Error())

  }

  getNumTempFromModel() {
    if (this.model == constants.MODEL_V1)
      return 2
    if (this.model == constants.MODEL_V1a || this.model == constants.MODEL_V2 || this.model == constants.MODEL_V3)
      var config = this.getLastConfig();
      if(config)
        return config.numTemp
    return 0
  }
  getNumTachFromModel() {
    if (this.model == constants.MODEL_V1)
      return 4
    if (this.model == constants.MODEL_V1a || this.model == constants.MODEL_V2 || this.model == constants.MODEL_V3)
      var config = this.getLastConfig();
      if(config)
        return config.numTach
    return 0
  }
  getNumVoltFromModel() {
    if (this.model == constants.MODEL_V1)
      return 4
    if (this.model == constants.MODEL_V1a ||this.model == constants.MODEL_V2 || this.model == constants.MODEL_V3)
      var config = this.getLastConfig();
      if(config)
        return config.numVolt
    return 0
  }
  getNumFanFromModel() {
    if (this.model == constants.MODEL_V1)
      return 2
    if (this.model == constants.MODEL_V1a ||this.model == constants.MODEL_V2 || this.model == constants.MODEL_V3)
      var config = this.getLastConfig();
      if(config)
        return config.numFan
    return 0
  }

  getMaxRPM() {
    return 15000;
  }

  getMaxVoltage() {
    if (this.model == constants.MODEL_V1a ||this.model == constants.MODEL_V2 || this.model == constants.MODEL_V3)
      var config = this.getLastConfig();
      if(config)
        return config.maxVoltages
    return [12,3.3,5,-12];
  }

  supportIPAddress() {
    return (this.model == constants.MODEL_V3 && (this.majorVersion > 1 || (this.majorVersion == 1 && this.minorVersion >= 4)))
  }
}

module.exports = {
  FanHW
};