'use strict';
const { FanErrorUI } = require('./FanErrorUI.js');
const { FanErrorV1UI } = require('./FanErrorV1UI.js');
const { FanConfigUI } = require('./FanConfigUI.js');
const { Gauge } = require('./gauge.js');
const constants = require('../constants.js');
const { html } = require('htm/react');


class FanDisplay extends React.Component {
  constructor(props) {
    super(props);
    this.fan = props.data;
    this.state = {};
    this.state.fanData = this.fan.getLastData();
    this.state.fanConfig = this.fan.getLastConfig();
    this.state.openConfig = false;

    this.fanConfig = React.createRef();

    this.onConfigure = this.onConfigure.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onSaveClose = this.onSaveClose.bind(this);

    this.handleResize = this.handleResize.bind(this);
    this.handleFanUpdate = this.handleFanUpdate.bind(this);

    this.voltFormat = new Intl.NumberFormat(undefined, { style: 'decimal', minimumFractionDigits: 1, maximumFractionDigits: 1 })
    this.cFormat = new Intl.NumberFormat(undefined, { style: 'decimal', minimumFractionDigits: 1, maximumFractionDigits: 1 })
  }

  handleResize() {
    if (this.configSection) {
      this.setState(state => ({
        configSectionHeight: this.configSection.scrollHeight
      }))
    }
  }

  handleFanUpdate() {
    this.setState({
      fanData: this.fan.getLastData()
    });
  }

  componentDidMount() {
    this.handleResize();
    window.addEventListener('resize', this.handleResize);

    if (this.fan != null) {
      this.fan.on(constants.EVENT_FANHW_DATA_UPDATE, this.handleFanUpdate);
      this.fan.on(constants.EVENT_FANHW_CONFIG_UPDATE, this.handleFanUpdate);
      this.fan.on(constants.EVENT_FANHW_VERSION_UPDATE, this.handleFanUpdate);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize)

    if (this.fan != null) {
      this.fan.off(constants.EVENT_FANHW_DATA_UPDATE, this.handleFanUpdate);
      this.fan.off(constants.EVENT_FANHW_CONFIG_UPDATE, this.handleFanUpdate);
      this.fan.off(constants.EVENT_FANHW_VERSION_UPDATE, this.handleFanUpdate);
    }
  }

  onConfigure() {
    this.fanConfig.current.reset();
    this.fan.emit(constants.EVENT_FANHW_UI_CONFIG_OPEN_UPDATE);
    setTimeout(
      function () {
        this.configSection.scrollIntoView({ behavior: "smooth" });
      }
        .bind(this),
      450
    ); //This should chain the animation

    this.setState(state => ({
      configSectionHeight: this.configSection.scrollHeight,
      openConfig: true,
      lastError: 0
    }));
  }
  onClose() {
    this.fanConfig.current.reset();
    this.setState(state => ({
      openConfig: false,
      fanConfig: this.savedConfig,
      lastError: 0
    }));
  }
  onSaveClose() {
    var errorCode = this.fanConfig.current.validateInput()
    if(errorCode != 0) {
      this.setState(state => ({
        lastError: errorCode
      }));
    
      return;
    }
    this.fan.saveConfig(this.fanConfig.current.getConfig());
    this.setState(state => ({
      openConfig: false
    }));
  }

  formattedTemp(index) {
    let fanConfig = this.fan.getLastConfig();
    let type = fanConfig.tempType[index];
    let lastData = this.state.fanData;

    if (type == 0) {
      return '\u00A0';
    } else if (type == 1) {
      return this.cFormat.format(lastData.temperature[index]) + " °C";
    } else if (type == 2) {
      return this.cFormat.format(lastData.temperature[index] * 9.0 / 5.0 + 32) + " °F";
    }
  }

  getLabel(i) {
    let labels = ["Air Inlet Front", "Air Exhaust Front", "Air Inlet Rear", "Air Exhaust Rear"];
    if(this.fan.model == constants.MODEL_V1 || this.fan.model == constants.MODEL_V1a || this.fan.model == constants.MODEL_V2) {
      labels = ["Sensor A", "Sensor B"];
    }
    return labels[i];

  }

  getTempItem(i) {
    let lastData = this.state.fanData;
    var correctTable = [0,1,2,3]
    if(this.fan.model == constants.MODEL_V1 || this.fan.model == constants.MODEL_V1a ) {
      correctTable = [0,1,2,3]
    }
    if( this.fan.model == constants.MODEL_V2) {
      correctTable = [1,0]
    }

    let correctedIndex = correctTable[i]
    var isError = lastData.isITempError(this.fan.getLastConfig(), i)
    if (i < lastData.numTemp)
      return html`<div className="six columns">
        <div className="container">
          <div className="row highlight-text-wrapper ${isError ? "red" : ""}"><h4>${this.formattedTemp(correctedIndex)}</h4></div>
          <div className="row"><center><strong><h5>${this.getLabel(i)}</h5></strong></center></div>
        </div>
      </div>`
    return html``
  }

  getTachItem(i) {
    let lastData = this.state.fanData;
    var correctTable = [1,2,3,4, 0,7,6,5, 9,10,11,12,8,15,14,13]
    if(this.fan.model == constants.MODEL_V1 || this.fan.model == constants.MODEL_V1a || this.fan.model == constants.MODEL_V2) {
      correctTable = [0,1,2,3]
    }

    let correctedIndex = correctTable[i]
    var isError = lastData.isIFanError(this.fan.getLastConfig(), i)
    if (correctedIndex < lastData.numTach)
      return html`<div className="three columns ${isError ? "#red" : ""}">
        <${Gauge} value=${lastData.tach[correctedIndex]} min="0" max=${this.fan.getMaxRPM()} label="" decimals="0" label="Tach ${correctedIndex+1} (RPM)" symbol="" levelColor="#3a508d" gaugeColor="#9ba2a7"/>
      </div>`
    return html``
  }

  getVoltItem(i) {
    let lastData = this.state.fanData;

    var isError = lastData.isIVoltageError(this.fan.getLastConfig(), i)

    if (i < lastData.numVolt)
      return html`<div className="three columns">
            <div className="container">
              <div className="row highlight-text-wrapper ${isError ? "red" : ""}">
                    <h3 className="animated_border_text">${this.voltFormat.format(lastData.voltage[i])} V</h3>
                    <h3 className="animated_border">\u00A0</h3>
              </div>
              <div className="row"><center><strong><h3>${Math.round(this.fan.getLastConfig().maxVoltages[i] * 10) / 10} V</h3></strong></center></div>
            </div>
          </div>`
    return html``
  }

  getErrorItems() {
    if(this.fan.model == constants.MODEL_V1 || this.fan.model == constants.MODEL_V1a || this.fan.model == constants.MODEL_V2) {
      return html`<${FanErrorV1UI} fan=${this.fan}/>`
    } else if(this.fan.model == constants.MODEL_V3) {
      return html`<${FanErrorUI} fan=${this.fan}/>`
    }
  }

 
  render() {
    let lastData = this.state.fanData;
    let fanConfig = this.fan.getLastConfig();
    if (lastData == null || fanConfig == null)
      return ""

    const configStyle = {
      maxHeight: this.state.openConfig ? this.state.configSectionHeight : 0
    };

    return (
      html`<div>
        <div className="row">
          <h4>Temperature</h4>
        </div>
        ${[...Array(Math.ceil(lastData.numTemp / 2)).keys()].map(i => html`
        <div className="row">
          ${this.getTempItem(2 * i)}
          ${this.getTempItem(2 * i + 1)}
        </div>
        `)}
        <div className="row">
          <h4>Fans</h4>
        </div>
        
        ${[...Array(Math.ceil(lastData.numTach / 4)).keys()].map(i => html`
        ${i == 0 ?
            html `<div className="row"><h5>Front</h5></div>` :
          i == 2 ? 
            html `<div className="row"><h5>Rear</h5></div>` :
          html ``}

        <div className="row">
          ${this.getTachItem(4 * i)}
          ${this.getTachItem(4 * i + 1)}
          ${this.getTachItem(4 * i + 2)}
          ${this.getTachItem(4 * i + 3)}
        </div>
          `)}

        <div className="row">
          <h4>Voltage</h4>
        </div>
        
        ${[...Array(Math.ceil(lastData.numVolt / 4)).keys()].map(i => html`
          <div className="row">
            <h5 className="marginzero">PSU ${i+1}</h5>
          </div>
          <div className="row">
            ${this.getVoltItem(4 * i)}
            ${this.getVoltItem(4 * i + 1)}
            ${this.getVoltItem(4 * i + 2)}
            ${this.getVoltItem(4 * i + 3)}
          </div>
        `)}
        <div className="row">
          <h4>Alarms</h4>
        </div>

        ${this.getErrorItems()}

        <div className="row">
          <button className="button-primary u-pull-right config-button ${this.state.openConfig ? "hidden" : ""}" onClick=${this.onConfigure}>Configure</button>
          <button className="button-primary u-pull-right config-button ${!this.state.openConfig ? "hidden" : ""}"  onClick=${this.onClose}>Close</button>
          <button className="button-primary u-pull-right config-button ${!this.state.openConfig ? "hidden" : ""}"  onClick=${this.onSaveClose}>Apply & Close</button>
        </div>
        <div ref=${(ref) => this.configSection = ref} className="animated-open" style=${configStyle}>
          <div className="row ${!this.state.lastError > 0 ? "hidden" : ""}" >
            <div className="tvelve columns text-red errorText marginT10 marginR10">
              <h5>Invalid configuration input. Please check below</h5>
            </div>
          </div>
          <${FanConfigUI} ref=${this.fanConfig} fan=${this.fan}/>
        </div>
        </div>`
    )
  }
}

module.exports = {
  FanDisplay
};