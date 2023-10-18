'use strict';
const  econstants = require('../errors.js');
const { FanConfig } = require('../obj/FanConfig.js');
const { FanConfigFanUI } = require('./FanConfigFanUI.js');
const { FanConfigTemperatureUI } = require('./FanConfigTemperatureUI.js');
const { FanConfigThresholdUI } = require('./FanConfigThresholdUI.js');
const { FanFirmwareUpdateUI } = require('./FanFirmwareUpdateUI.js');
const { FanConfigIP } = require('./FanConfigIP.js');
const { html } = require('htm/react');

class FanConfigUI extends React.Component {
  constructor(props) {
    super(props);

    this.fan = this.props.fan
    let config = this.props.fan.getLastConfig();

    this.state = {};
    this.state.fanConfig = config;
    this.state.majorVersion = this.fan.getMajorVersion();
    this.state.minorVersion = this.fan.getMinorVersion();

    this.temperatureConfig = React.createRef();
    this.thresholdConfig = React.createRef();

    this.fanConfigUI = [];
    for (var i = 0; i < this.fan.getNumFanFromModel(); i++) {
      this.fanConfigUI[i] = React.createRef();
    }



    this.handleChange = this.handleChange.bind(this);
    this.handleFanUpdate = this.handleFanUpdate.bind(this);
    this.onReboot = this.onReboot.bind(this);
  }

  handleFanUpdate() {
    if (this.fan) {
      this.setState({
        majorVersion: this.fan.getMajorVersion(),
        minorVersion: this.fan.getMinorVersion()
      });
    }
  }

  componentDidMount() {
    if (this.fan) {
      this.fan.on(constants.EVENT_FANHW_CONFIG_UPDATE, this.handleFanUpdate);
      this.fan.on(constants.EVENT_FANHW_VERSION_UPDATE, this.handleFanUpdate);
    }
  }

  componentWillUnmount() {
    if (this.fan) {
      this.fan.off(constants.EVENT_FANHW_CONFIG_UPDATE, this.handleFanUpdate);
      this.fan.off(constants.EVENT_FANHW_VERSION_UPDATE, this.handleFanUpdate);
    }
  }

  validateInput() {
    var err = econstants.ERROR_OK
    if (this.thresholdConfig.current != null) {
      err = this.thresholdConfig.current.validateInput();
      if (err != 0)
        return err
    }
    err = this.temperatureConfig.current.validateInput();
    if (err != 0)
      return err
    for (var i = 0; i < this.fanConfigUI.length; i++) {
      err = this.fanConfigUI[i].current.validateInput();
      if (err != 0)
        return err
    }
    if (this.fanConfigIp) {
      err = this.fanConfigIp.current.validateInput();
    }
    return err
  }
  getConfig() {
    let tConfig = {}
    if (this.thresholdConfig.current != null)
      tConfig = this.thresholdConfig.current.getConfig();
    let temps = this.temperatureConfig.current.getConfig();
    let fans = [];
    for (var i = 0; i < this.fanConfigUI.length; i++) {
      fans[i] = this.fanConfigUI[i].current.getConfig();
    }

    var ipConfig = null;
    if (this.fanConfigIp) {
      ipConfig = this.fanConfigIp.current.getConfig();
    }

    let config = FanConfig.fromConfig(
      temps,
      fans,
      tConfig,
      ipConfig,
      this.props.fan.getLastConfig());
    return config;
  }

  handleChange() { //somewhat inefficient
    this.isDirty = true;
    this.setState(state => ({
      majorVersion: this.fan.getMajorVersion(),
      minorVersion: this.fan.getMinorVersion()
    }));
  }

  reset() {
    this.isDirty = false;
    this.setState(state => ({
      majorVersion: this.fan.getMajorVersion(),
      minorVersion: this.fan.getMinorVersion()
    }));
  }

  onReboot() {
    this.fan.rebootToBoot();
  };

  getIPSection() {
    if (this.fan.supportIPAddress()) {
      if (!this.fanConfigIp)
        this.fanConfigIp = React.createRef();
      return html`<${FanConfigIP} ref=${this.fanConfigIp} data=${this.fan}/>`
    } else {
      return html``
    }
  }

  getFirmwareSection() {
    if (this.fan.model == constants.MODEL_V1 || this.fan.model == constants.MODEL_V1a || this.fan.model == constants.MODEL_V2) {
      return html`
        <div className="row">
          <div className="nine columns"></div>
          <div className="three columns marginL80P ${(this.state.majorVersion == 1 && this.state.minorVersion == 0) ? "hidden" : ""}">
            <button className="button-primary u-pull-right config-button" onClick=${this.onReboot}>Restart for Update</button>
          </div>
        </div>`
    } else {
      return html`<${FanFirmwareUpdateUI}  data=${this.fan} />`
    }
  }

  render() {
    let fanConfig = this.fan.getLastConfig();
    if (fanConfig == null)
      return ""
    let vThreshold
    vThreshold = html`<${FanConfigThresholdUI} ref=${this.thresholdConfig} fan=${this.fan}/>`;

    return (
      html`
        <div>
          <${FanConfigTemperatureUI} ref=${this.temperatureConfig} fan=${this.fan}/>
          ${vThreshold}
          ${[...Array(this.fanConfigUI.length / 2).keys()].map(i => html`
            <div className="row">
                <div className="six columns">
                    <${FanConfigFanUI} ref=${this.fanConfigUI[2 * i]} fan=${this.fan} index="${2 * i}"/>
                </div>
                <div className="six columns">
                    ${((2 * i + 1) < this.fanConfigUI.length) ? html`<${FanConfigFanUI} ref=${this.fanConfigUI[2 * i + 1]} fan=${this.fan} index="${2 * i + 1}"/>` : html``}
                </div>
            </div>
        `)}
        ${this.getIPSection()}
          <div className="container width-90">
            <div className="row">
              <div className="nine columns"> </div>
              <div className="three columns talgin-right">
                <h6><b>Firmware Version ${this.state.majorVersion}.${this.state.minorVersion}</b></h6>
              </div>
            </div>
             ${this.getFirmwareSection()}
             <div className="row"> </div>
          </div>
          <div className="row">
            <h5>${'\u00A0'}</h5>
          </div>
        </div>`
    );
  }
}

module.exports = {
  FanConfigUI
};