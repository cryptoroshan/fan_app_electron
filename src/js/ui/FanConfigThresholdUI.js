'use strict';
const { html } = require('htm/react');
const  econstants = require('../errors.js');
const { FanConfigThresholdItemUI } = require('./FanConfigThresholdItemUI.js');
const { FanConfigThresholdItemV1UI } = require('./FanConfigThresholdItemV1UI.js');

class FanConfigThresholdUI extends React.Component {
  constructor(props) {
    super(props);
    this.fan = this.props.fan;
    this.cFormat = new Intl.NumberFormat(undefined, { style: 'decimal', minimumFractionDigits: 1, maximumFractionDigits: 1 })

    let fanConfig = this.props.fan.getLastConfig();
    this.voltageThresholdItem = new Array(fanConfig.numVolt);

    for (var i = 0; i < fanConfig.numVolt; i++) {
      this.voltageThresholdItem[i] = React.createRef();
    }

    this.getConfig = this.getConfig.bind(this);
  }

  validateInput() {
    for (var i = 0; i < this.voltageThresholdItem.length; i++) {
      let low = Number(this.voltageThresholdItem[i].current.getLowerThreshold())
      let high = Number(this.voltageThresholdItem[i].current.getUpperThreshold()) 
      if(isNaN(low) || isNaN(high)) {
        return econstants.ERROR_EMPTY
      }
      if (low > high)
        return econstants.ERROR_VOLT_THRESHOLD_ORDER;
    }
    return econstants.ERROR_OK;
  }

  getConfig() {
    let vConfig = []
    for (var i = 0; i < this.voltageThresholdItem.length; i++) {
      let obj = {}
      if (this.fan.model == constants.MODEL_V1) {
        obj.voltageThreshold = this.voltageThresholdItem[i].current.getThreshold();
      } else {
        obj.voltageLowerThreshold = this.voltageThresholdItem[i].current.getLowerThreshold();
        obj.voltageUpperThreshold = this.voltageThresholdItem[i].current.getUpperThreshold();
      }
      obj.voltageThresholdType = this.voltageThresholdItem[i].current.getThresholdType();
      vConfig[i] = obj;
    }
    return vConfig;
  }

  getItem(i) {
    let fanConfig = this.props.fan.getLastConfig();
    if (i < fanConfig.numVolt) {
      if (this.fan.model == constants.MODEL_V1) {
        return html`
        <${FanConfigThresholdItemV1UI} ref=${this.voltageThresholdItem[i]} fan=${this.props.fan} index=${i}/>
        `;
      } else {
        return html`
      <${FanConfigThresholdItemUI} ref=${this.voltageThresholdItem[i]} fan=${this.props.fan} index=${i}/>
      `;
      }
    }
    return html``;
  }

  render() {
    let fanConfig = this.props.fan.getLastConfig();
    return (
      html`
        <div className="container">
              <div className="row">
                <h5>Voltage Threshold</h5>
              </div>
              
              ${[...Array(Math.ceil(fanConfig.numVolt / 4)).keys()].map(i => html`
                  <div className="row ${(this.fan.model == constants.MODEL_V1 || this.fan.model == constants.MODEL_V1a || this.fan.model == constants.MODEL_V2) ? "hidden" : ""}">
                    <h5 className="marginzero">PSU ${i + 1}</h5>
                  </div>
                  <div className="row">
                    ${this.getItem(4 * i)}
                    ${this.getItem(4 * i + 1)}
                    ${this.getItem(4 * i + 2)}
                    ${this.getItem(4 * i + 3)}
                  </div>
                `)}
        </div>`
    );
  }
}

module.exports = {
  FanConfigThresholdUI
};