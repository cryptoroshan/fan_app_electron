'use strict';

const { html } = require('htm/react')
const { ipcRenderer } = require('electron');
const path = require('path');
const { InputMask } = require('react-input-mask')
const  econstants = require('../errors.js');

class FanConfigIP extends React.Component {
  constructor(props) {
    super(props);
    this.fan = props.data;
    this.state = {
      typeSelectValue: 1,
      ipAddress: "0.0.0.0",
      netMask: "0.0.0.0",
      gateway: "0.0.0.0"
    };

    this.typeSelect = React.createRef();
    this.ipAddressInput = React.createRef();
    this.netMaskInput = React.createRef();
    this.gatewayInput = React.createRef();

    this.handleChange = this.handleChange.bind(this);
    this.reset = this.reset.bind(this);
    this.validateIPaddressOnChange = this.validateIPaddressOnChange.bind(this);
    this.IPOnFocus = this.IPOnFocus.bind(this);
    this.handleSelectChange = this.handleSelectChange.bind(this);
    this.resizeWindow = this.resizeWindow.bind(this);
    this.scrollToBottom = this.scrollToBottom.bind(this);

    this.reset();
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

  handleSelectChange(e) {
    setTimeout(this.resizeWindow, 100);
    this.handleChange(e)
  }

  resizeWindow() {
    window.dispatchEvent(new Event('resize'));
    setTimeout(this.scrollToBottom, 300);
  }

  scrollToBottom() {
    if (this.gatewayInput.current)
      this.gatewayInput.current.scrollIntoView({ behavior: "smooth" });
  }

  handleChange(e) {
    if (this.props.onChange)
      this.props.onChange();

    this.setState(state => ({
      typeSelectValue: parseInt(this.typeSelect.current.value),
      ipAddress: this.ipAddressInput.current.value,
      netMask: this.netMaskInput.current.value,
      gateway: this.gatewayInput.current.value
    }));
  }

  reset() {
    let fanConfg = this.fan.getLastConfig()
    if (fanConfg.fanFactory) {
      this.isDirty = false;
      this.setState(state => ({
        typeSelectValue: fanConfg.fanFactory.dhcp,
        ipAddress: this.ipArrayToString(fanConfg.fanFactory.ip_address),
        netMask: this.ipArrayToString(fanConfg.fanFactory.netmask_address),
        gateway: this.ipArrayToString(fanConfg.fanFactory.gateway_address),
      }));
      setTimeout(this.resizeWindow, 100);
    }
  }

  ipArrayToString(array) {
    return array[0] + "." + array[1] + "." + array[2] + "." + array[3];
  }

  validateIPaddressOnChange(e) {
    var ipformat = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.?){0,2}(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))?$/;
    var input = e.target
    if (input.value.match(ipformat)) {
      this.handleChange();
    }
  }


  IPOnFocus(e) {
    var input = e.target
    if (input.value == "0.0.0.0") {
      input.value = ""
      this.handleChange();
    }
  }

  validateInput() {
    if (this.typeSelect.current.value == 0) {
      var address = this.parseIP(this.ipAddressInput.current.value)
      if (address.length != 4)
        return econstants.ERROR_IP;
      if (address[0] == 0 && address[1] == 0 && address[2] == 0 && address[3] == 0)
        return econstants.ERROR_IP;

      var address = this.parseIP(this.netMaskInput.current.value)
      if (address.length != 4)
        return econstants.ERROR_IP;
      if (address[0] == 0 && address[1] == 0 && address[2] == 0 && address[3] == 0)
        return econstants.ERROR_IP;

      var address = this.parseIP(this.gatewayInput.current.value)
      if (address.length != 4)
        return econstants.ERROR_IP;
      if (address[0] == 0 && address[1] == 0 && address[2] == 0 && address[3] == 0)
        return econstants.ERROR_IP;
    }
    return econstants.ERROR_OK;
  }

  getConfig() {
    let fanConfg = this.fan.getLastConfig()
    if (fanConfg.fanFactory) {
      return {
        dhcp: parseInt(this.typeSelect.current.value),
        ip_address: this.parseIP(this.ipAddressInput.current.value),
        netmask_address: this.parseIP(this.netMaskInput.current.value),
        gateway_address: this.parseIP(this.gatewayInput.current.value),
      };
    } else {
      return null
    }
  }

  parseIP(input) {
    var result = new Array(4);
    let sinput = input.split(".");
    for (var i = 0; i < 4 && i < sinput.length; i++) {
      result[i] = sinput[i]
    }
    return result;
  }

  render() {
    let fanConfg = this.fan.getLastConfig()
    if (fanConfg.fanFactory) {
      return (
        html`<div className="container">
          <div className="row">
              <h5>
                Network
                <small className="marginL5"><small><small>Reboot required for network settings to take affect</small></small></small>
              </h5>
          </div>
          <div className="row">
            <div className="six columns">
              <select className="u-full-width" ref=${this.typeSelect} value=${this.state.typeSelectValue} onChange=${this.handleSelectChange}>
                <option value="1">Automatic DHCP</option>
                <option value="0">Static IP</option>
              </select>
            </div>
          </div>

          <div className="row ${this.state.typeSelectValue == 1 ? "hidden" : ""}">
            <div className="two columns marginT10">
              <h6>IP Address</h6>
            </div>
            <div className="eight columns">
            <input required ref=${this.ipAddressInput} type="text" minlength="7" maxlength="15" size="15" value="${this.state.ipAddress}" pattern="^((\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.){3}(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$" onFocus=${this.IPOnFocus} onChange=${this.validateIPaddressOnChange}/>
        
            </div>
          </div>
          <div className="row ${this.state.typeSelectValue == 1 ? "hidden" : ""}">
            <div className="two columns marginT10">
              <h6>Subnet Mask</h6>
            </div>
            <div className="eight columns">
              <input required ref=${this.netMaskInput} type="text" minlength="7" maxlength="15" size="15" value="${this.state.netMask}" pattern="^((\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.){3}(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$" onFocus=${this.IPOnFocus} onChange=${this.validateIPaddressOnChange}/>
            </div>
          </div>
          <div className="row ${this.state.typeSelectValue == 1 ? "hidden" : ""}">
            <div className="two columns marginT10">
              <h6>Default Gateway</h6>
            </div>
            <div className="eight columns">
              <input required ref=${this.gatewayInput}  type="text" minlength="7" maxlength="15" size="15" value="${this.state.gateway}" pattern="^((\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.){3}(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$" onFocus=${this.IPOnFocus} onChange=${this.validateIPaddressOnChange}/>
            </div>
          </div>

        </div>`
      );
    } else {
      return (html`<div/>`);
    }
  }
}

module.exports = {
  FanConfigIP
};