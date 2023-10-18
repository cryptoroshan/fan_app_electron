'use strict';
const  econstants = require('../errors.js');
const { CheckboxButton } = require('./checkboxbutton.js');
const { html } = require('htm/react')
class FanConfigFanUI extends React.Component {
  constructor(props) {
    super(props);

    this.fan = this.props.fan;
    this.state = {};
    this.state.fanConfig = this.props.fan.getLastConfig();

    this.typeSelect = React.createRef();
    this.tempSelect = React.createRef();

    this.deltaSelect = React.createRef();
    this.txtDeltaFudge = React.createRef();

    this.txtMinPWM = React.createRef();
    this.txtMaxPWM = React.createRef();
    this.txtMinSpeed = React.createRef();
    this.txtMaxSpeed = React.createRef();

    this.checkStop = React.createRef();

    this.reset();

    this.handleChange = this.handleChange.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.reset = this.reset.bind(this);
  }

  componentDidMount() {
    if (this.fan != null) {
      this.fan.on(constants.EVENT_FANHW_UI_CONFIG_OPEN_UPDATE, this.reset);
    }
  }

  componentWillUnmount() {
    if (this.fan != null) {
      this.fan.off(constants.EVENT_FANHW_UI_CONFIG_OPEN_UPDATE, this.reset);
    }
  }


  handleChange(e) {
    this.setState(state => ({
      fanConfig: this.props.fan.getLastConfig(),
      typeSelectValue: parseInt(this.typeSelect.current.value),
      tempSelectValue: parseInt(this.tempSelect.current.value),
      deltaSelectValue:  parseInt(this.deltaSelect.current.value),
      txtDeltaFudgeValue: parseInt(this.txtDeltaFudge.current.value),
      txtMinSpeedValue: parseInt(this.txtMinSpeed.current.value),
      txtMaxSpeedValue: parseInt(this.txtMaxSpeed.current.value),
      txtMinPWMValue: parseInt(this.txtMinPWM.current.value),
      txtMaxPWMValue: parseInt(this.txtMaxPWM.current.value),
    }));
  }

  handleClick() {
    this.setState(state => ({
      checkStopValue: !this.state.checkStopValue
    }));
    this.handleChange();
  }

  reset() {
    let fanConfig = this.props.fan.getLastConfig();
    let fanSubConfig = fanConfig.fanConfig[this.props.index];

    this.isDirty = false;
    this.setState(state => ({
      fanConfig: fanConfig,
      typeSelectValue: undefined,
      tempSelectValue: undefined,
      deltaSelectValue:  undefined,
      txtDeltaFudgeValue: undefined,
      txtMinSpeedValue: undefined,
      txtMaxSpeedValue: undefined,
      txtMinPWMValue: undefined,
      txtMaxPWMValue: undefined,
      checkStopValue: fanSubConfig.canStop
    }));
  }

  validateInput() {
    let minPWM = parseInt(this.txtMinPWM.current.value)
    let maxPWM = parseInt(this.txtMaxPWM.current.value)
    let tempAtMinSpeed = parseInt(this.txtMinSpeed.current.value)
    let tempAtMaxSpeed = parseInt(this.txtMaxSpeed.current.value)
    if(isNaN(minPWM) || isNaN(maxPWM) || isNaN(tempAtMinSpeed) || isNaN(tempAtMaxSpeed)) {
      return econstants.ERROR_EMPTY
    }
    if(minPWM > 100 || maxPWM > 100) {
      return econstants.ERROR_FAN_POWER_100
    }
    if(minPWM > maxPWM) {
      return econstants.ERROR_FAN_POWER_ORDER;
    }
    if(tempAtMinSpeed > tempAtMaxSpeed) {
      return econstants.ERROR_FAN_TEMP_ORDER;
    }
    return econstants.ERROR_OK;
  }

  getConfig() {
    var fudge = parseInt(this.txtDeltaFudge.current.value)
    if (fudge > 10)
      fudge = 10
    if (fudge < 0 || isNaN(fudge))
      fudge = 0

    let fanConfig = this.state.fanConfig;
    let fanSubConfig = fanConfig.fanConfig[this.props.index];
    return {
      minPWM: parseInt(this.txtMinPWM.current.value),
      maxPWM: parseInt(this.txtMaxPWM.current.value),
      tempSensor: parseInt(this.tempSelect.current.value),
      tempAtMinSpeed: parseInt(this.txtMinSpeed.current.value),
      tempAtMaxSpeed: parseInt(this.txtMaxSpeed.current.value),
      canStop: this.state.checkStopValue,
      type: parseInt(this.typeSelect.current.value),
      calcType: fanSubConfig.calcType,
      delta: parseInt(this.deltaSelect.current.value),
      deltaFudge: fudge
    };
  }

  getIdentity() {
    var labels = ["Fan Front", "Fan Rear"];
    if(this.fan.model == constants.MODEL_V1 || this.fan.model == constants.MODEL_V1a || this.fan.model == constants.MODEL_V2) {
      labels = ["Fan A", "Fan B"]
    }
 
    return labels[this.props.index];
    //return String.fromCharCode('A'.charCodeAt() + this.props.index)
  }

  getTempLabel(i) {
    var labels = ["Air Inlet Front Sensor", "Air Exhaust Front Sensor", "Air Inlet Rear Sensor", "Air Exhaust Rear Sensor"];
    if(this.fan.model == constants.MODEL_V1 || this.fan.model == constants.MODEL_V1a || this.fan.model == constants.MODEL_V2) {
      labels = ["Sensor A", "Sensor B"]
    }
    return labels[i];
  }

  render() {
    let fanConfig = this.state.fanConfig;
    let fanSubConfig = fanConfig.fanConfig[this.props.index];
    let index = 0;

    var typeSelectValue = this.state.typeSelectValue;
    if (typeSelectValue == undefined)
      typeSelectValue = fanSubConfig.type

    var tempSelectValue = this.state.tempSelectValue;
    if (tempSelectValue == undefined)
      tempSelectValue = fanSubConfig.tempSensor

    var deltaSelectValue = this.state.deltaSelectValue;
    if (!deltaSelectValue)
      deltaSelectValue = fanSubConfig.delta

    var txtDeltaFudgeValue = this.state.txtDeltaFudgeValue;
    if (!txtDeltaFudgeValue)
      txtDeltaFudgeValue = fanSubConfig.deltaFudge

    var txtMinSpeedValue = this.state.txtMinSpeedValue;
    if (!txtMinSpeedValue)
      txtMinSpeedValue = fanSubConfig.tempAtMinSpeed
    var txtMaxSpeedValue = this.state.txtMaxSpeedValue;
    if (!txtMaxSpeedValue)
      txtMaxSpeedValue = fanSubConfig.tempAtMaxSpeed

    var txtMinPWMValue = this.state.txtMinPWMValue;
    if (!txtMinPWMValue)
      txtMinPWMValue = fanSubConfig.minPWM
    var txtMaxPWMValue = this.state.txtMaxPWMValue;
    if (!txtMaxPWMValue)
      txtMaxPWMValue = fanSubConfig.maxPWM

    var checkStopValue = this.state.checkStopValue;

    var configType = fanSubConfig.calcType;

    return (
      html`
  <div className="container">
    <div className="row vspace"></div>
    <div className="row">
      <h5>${this.getIdentity()}</h5>
    </div>
    <div className="row ${configType != 0 ? "hidden" : ""}">
      <div className="four columns">
        <h6>Fan Type</h6>
      </div>
      <div className="eight columns">
        <select className="u-full-width" ref=${this.typeSelect} value=${typeSelectValue} onChange=${this.handleChange}>
        <option value="0">Not Used</option>
        <option value="1">2 Wire</option>
        <option value="2">3 Wire - x1  tacho</option>
        <option value="3">3 Wire - x2  tacho</option>
        <option value="4">3 Wire - x4  tacho</option>
        <option value="5">4 Wire</option>
        </select>
      </div>
    </div>
    <div className="row">
      <div className="four columns marginT10">
        <h6 className="${configType == 1 ? "" : "hidden"}"></h6>
        <h6 className="${configType == 0 ? "" : "hidden"}">Control</h6>
      </div>
      <div className="eight columns">
        <select className="u-full-width" ref=${this.tempSelect} value=${tempSelectValue} onChange=${this.handleChange}>
          ${[...Array(Math.ceil(fanConfig.numTemp)).keys()].map(i => html`
            <option value="${index++}">${this.getTempLabel(i)}</option>
          `)}
          <!-- option value="${index}">Manual</option -->
        </select>
      </div>
    </div>

    <div className="row ${configType != 1 ? "hidden" : ""}">
      <div className="four columns marginT10">
        <h6>Temperature Delta</h6>
      </div>
      <div className="eight columns">
        <select className="u-full-width" ref=${this.deltaSelect} value=${deltaSelectValue} onChange=${this.handleChange}>
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="15">15</option>
          <option value="20">20</option>
          <option value="25">25</option>
          <option value="30">30</option>
          <option value="35">35</option>
        </select>
      </div>
    </div>

    <div className="row ${configType != 1 ? "hidden" : ""}">
      <div className="four columns marginT10">
        <h6>Hysteresis</h6>
      </div>
      <div className="three columns">
        <input className="u-full-width" type="number" ref=${this.txtDeltaFudge} value=${txtDeltaFudgeValue} onChange=${this.handleChange}/>
      </div>
    </div>
  
    <div className="row ${configType != 0 ? "hidden" : ""}">
      <div className="four columns marginT10">
        <h6>Temperature Range</h6>
      </div>
      <div className="three columns">
        <input className="u-full-width" type="number" ref=${this.txtMinSpeed} value=${txtMinSpeedValue} min=0 max=100 onChange=${this.handleChange}/>
      </div>
      <div className="two columns">
        <center><h6 className="padding5">to</h6></center>
      </div>
      <div className="three columns">
        <input className="u-full-width" type="number" ref=${this.txtMaxSpeed} value=${txtMaxSpeedValue} min=0 max=100 onChange=${this.handleChange}/>
      </div>
    </div>
  
    <div className="row">
      <div className="four columns marginT10">
        <h6>Power Range</h6>
      </div>
      <div className="three columns">
        <input className="u-full-width" type="number" ref=${this.txtMinPWM} value=${txtMinPWMValue} onChange=${this.handleChange}/>
      </div>
      <div className="two columns">
        <center><h6 className="padding5">to</h6></center>
      </div>
      <div className="three columns">
        <input className="u-full-width" type="number" ref=${this.txtMaxPWM} value=${txtMaxPWMValue} onChange=${this.handleChange}/>
      </div>
    </div>

    <div className="row">
      <div className="four columns">
        <h6>Can Stop</h6>
      </div>
      <div className="eight columns">
        <div ref=${this.checkStop} className=${checkStopValue ? "checkbox-on" : "checkbox-off"} onClick=${this.handleClick}>✓</div>
      </div>
    </div>
  </div>`
    );
  }
}

module.exports = {
  FanConfigFanUI
};