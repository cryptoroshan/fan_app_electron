'use strict';
const  econstants = require('../errors.js');
const { html } = require('htm/react')
class FanConfigTemperatureUI extends React.Component {
  constructor(props) {
    super(props);
    this.fan = this.props.fan;
    let fanConfig = this.props.fan.getLastConfig();

    this.tempType = new Array(fanConfig.numTemp);
    this.tempLowerThreshold = new Array(fanConfig.numTemp);
    this.tempUpperThreshold = new Array(fanConfig.numTemp);

    for (var i = 0; i < fanConfig.numTemp; i++) {
      this.tempType[i] = React.createRef();        
      this.tempLowerThreshold[i] = React.createRef();
      this.tempUpperThreshold[i] = React.createRef();
    }

    this.state={}

    this.getTempLabel = this.getTempLabel.bind(this);
    this.formattedTemp = this.formattedTemp.bind(this);
    this.unformattedTemp = this.unformattedTemp.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleTempChange = this.handleTempChange.bind(this);
    this.reset = this.reset.bind(this);

    this.reset()
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

  reset() {
    let fanConfig = this.props.fan.getLastConfig();
    var newState = {
      tempType: [],
      tempLowerThreshold: [],
      tempUpperThreshold: []
    };

    for (var i = 0; i < fanConfig.numTemp; i++) {
      newState.tempType.push(fanConfig.tempType[i])
      newState.tempLowerThreshold.push(fanConfig.tempLowerThreshold[i])
      newState.tempUpperThreshold.push(fanConfig.tempUpperThreshold[i])
    }
    this.setState(newState);
  }

  validateInput() {
    for (var i = 0; i < this.tempType.length; i++) {
      let tempLowerThreshold = parseInt(this.unformattedTemp(this.state.tempType[i], this.tempLowerThreshold[i].current.value));
      let tempUpperThreshold = parseInt(this.unformattedTemp(this.state.tempType[i], this.tempUpperThreshold[i].current.value));
      if(isNaN(tempLowerThreshold) || isNaN(tempUpperThreshold)) {
        return econstants.ERROR_EMPTY
      }
      if(tempLowerThreshold > tempUpperThreshold) {
        return econstants.ERROR_TEMP_THRESHOLD_ORDER;
      }
    }
    return econstants.ERROR_OK;
  }

  getConfig() {
    let tConfig = []
    for (var i = 0; i < this.tempType.length; i++) {
      let obj = {}
      obj.tempType = parseInt(this.tempType[i].current.value);
      obj.tempLowerThreshold = parseInt(this.unformattedTemp(this.state.tempType[i], this.tempLowerThreshold[i].current.value));
      obj.tempUpperThreshold = parseInt(this.unformattedTemp(this.state.tempType[i], this.tempUpperThreshold[i].current.value));
      tConfig[i] = obj;
    }
    return tConfig;
  }

  handleTempChange(e) {
    this.handleChange(e)
  }

  handleChange(e) {
    let fanConfig = this.props.fan.getLastConfig();
    var newState = {
      tempType: [],
      tempLowerThreshold: [],
      tempUpperThreshold: []
    };

    
    newState.tempType = new Array(fanConfig.numTemp);
    newState.tempLowerThreshold = new Array(fanConfig.numTemp);
    newState.tempUpperThreshold = new Array(fanConfig.numTemp);

    for (var i = 0; i < fanConfig.numTemp; i++) {
      var tempType = fanConfig.tempType[i]
      if(this.state.tempType && i < this.state.tempType.length)
        tempType = this.state.tempType[i]

      newState.tempLowerThreshold[i] = this.unformattedTemp(tempType, this.tempLowerThreshold[i].current.value)
      newState.tempUpperThreshold[i] = this.unformattedTemp(tempType, this.tempUpperThreshold[i].current.value)
      newState.tempType[i] = this.tempType[i].current.value
    }

    this.setState(newState);
  }

  getTempLabel(i) {
    var labels = ["Air Inlet Front", "Air Exhaust Front", "Air Inlet Rear", "Air Exhaust Rear"];
    if(this.fan.model == constants.MODEL_V1 || this.fan.model == constants.MODEL_V1a || this.fan.model == constants.MODEL_V2) {
      labels = ["Sensor A", "Sensor B"];
    }
    return labels[i]
  }

  formattedTemp(type, value) {
    if (type == 1) {
      return value;
    } else if (type == 2) {
      return value * 9.0 / 5.0 + 32;
    } else {
      return value;
    }
  }

  unformattedTemp(type, value) {
    if (type == 1) {
      return value;
    } else if (type == 2) {
      return (value - 32) * 5.0 / 9.0;
    } else {
      return value;
    }
  }

  getTempSelect(i, tempType) {
    if(this.fan.model == constants.MODEL_V1 || this.fan.model == constants.MODEL_V1a || this.fan.model == constants.MODEL_V2) {
      return html`<select className="u-full-width" ref=${this.tempType[i]} value=${tempType} index="${i}" onChange=${this.handleTempChange}>
      <option value="0">Not Connected</option>
      <option value="1">Show as °C</option>
      <option value="2">Show as °F</option>
      </select>`
    } else {
      return html`<select className="u-full-width" ref=${this.tempType[i]} value=${tempType} index="${i}" onChange=${this.handleTempChange}>
      <option value="1">Show as °C</option>
      <option value="2">Show as °F</option>
      </select>`
    }
  }

  getItem(i) {
    let fanConfig = this.props.fan.getLastConfig();
    if (i < fanConfig.numTemp)
      var tempType = fanConfig.tempType[i]
      if(this.state.tempType && i < this.state.tempType.length)
        tempType = this.state.tempType[i]

      var tempLowerThreshold = fanConfig.tempLowerThreshold[i]
      if(this.state.tempLowerThreshold && i < this.state.tempLowerThreshold.length)
        tempLowerThreshold = this.state.tempLowerThreshold[i]

      var tempUpperThreshold = fanConfig.tempUpperThreshold[i]
      if(this.state.tempType && i < this.state.tempUpperThreshold.length)
        tempUpperThreshold = this.state.tempUpperThreshold[i]

      return html`
      
      <div className="container">
        <div className="row">
          <h5>${this.getTempLabel(i)}</h5>
        </div>

        <div className="row">
          <div className="four columns marginT10">
            <h6>Units</h6>
          </div>
          <div className="eight columns">
            ${this.getTempSelect(i, tempType)}
          </div>
        </div>

        <div className="row ${this.fan.model == constants.MODEL_V1 ? "hidden" : ""} ${tempType == 0 ? "hidden" : ""}">
          <div className="four columns marginT10">
            <h6>Range</h6>
          </div>
          <div className="three columns">
            <input className="u-full-width" type="number" ref=${this.tempLowerThreshold[i]} value=${this.formattedTemp(tempType, tempLowerThreshold)} onChange=${this.handleChange}/>
          </div>
          <div className="two columns">
            <center><h6 className="padding5">to</h6></center>
          </div>
          <div className="three columns">
            <input className="u-full-width" type="number" ref=${this.tempUpperThreshold[i]} value=${this.formattedTemp(tempType, tempUpperThreshold)} onChange=${this.handleChange}/>
          </div>
        </div>
      </div>
  `
    return html``
  }

  render() {
    let fanConfig = this.props.fan.getLastConfig();
    return (
      html`
        <div className="container">
              <div className="row">
                <h5>Temperature</h5>
              </div>
              ${[...Array(Math.ceil(fanConfig.numTemp/2)).keys()].map(i => html`
                  <div className="row">
                      <div className="six columns">
                        ${this.getItem(2 * i)}
                      </div>
                      <div className="six columns">
                        ${this.getItem(2 * i + 1)}
                      </div>
                  </div>
              `)}
        </div>`
    );
  }
}

module.exports = {
  FanConfigTemperatureUI
};