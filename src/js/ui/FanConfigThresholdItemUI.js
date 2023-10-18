'use strict';
const { html } = require('htm/react');
const Switch = require('react-switch').default;
const { FanConfig } = require('../obj/FanConfig');

class FanConfigThresholdItemUI extends React.Component {
  constructor(props) {
    super(props);
    this.fan = this.props.fan;
    let fanConfig = this.props.fan.getLastConfig();

    let index = this.props.index;
    this.cFormat = new Intl.NumberFormat(undefined, { style: 'decimal', minimumFractionDigits: 1, maximumFractionDigits: 1 })

    this.state = {
      lowerThreshold: this.getDisplayLowerThreshold(index),
      upperThreshold: this.getDisplayUpperThreshold(index),
      thresholdType: fanConfig.voltageThresholdType[index]
    };

    this.voltageLowerThreshold = React.createRef();
    this.voltageUpperThreshold = React.createRef();
    this.voltageSwitch = React.createRef();
    
    this.handleLowerChange = this.handleLowerChange.bind(this);
    this.handleUpperChange = this.handleUpperChange.bind(this);
    this.handleSwitch = this.handleSwitch.bind(this);
    this.getDisplayLowerThreshold = this.getDisplayLowerThreshold.bind(this);
    this.getDisplayUpperThreshold = this.getDisplayUpperThreshold.bind(this);

    this.getLowerThreshold = this.getLowerThreshold.bind(this);
    this.getUpperThreshold = this.getUpperThreshold.bind(this);
    this.getThresholdType = this.getThresholdType.bind(this);
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

  reset() {
    let fanConfig = this.props.fan.getLastConfig();
    let index = this.props.index;
    var s = {
      lowerThreshold: this.getDisplayLowerThreshold(index),
      upperThreshold: this.getDisplayUpperThreshold(index),
      thresholdType: fanConfig.voltageThresholdType[index]
    };
    this.setState(s)
  }

  getDisplayLowerThreshold(index) {
    let fanConfig = this.props.fan.getLastConfig();
    let value = FanConfig.convertToDisplay(fanConfig.voltageLowerThreshold[index],
      fanConfig.maxVoltages[index],
      fanConfig.voltageThresholdType[index]);

    return this.cFormat.format(value);
  }

  getDisplayUpperThreshold(index) {
    let fanConfig = this.props.fan.getLastConfig();
    let value = FanConfig.convertToDisplay(fanConfig.voltageUpperThreshold[index],
      fanConfig.maxVoltages[index],
      fanConfig.voltageThresholdType[index]);

    return this.cFormat.format(value);
  }

  getLowerThreshold() {
    let fanConfig = this.props.fan.getLastConfig();
    let lowerThreshold = this.state.lowerThreshold
    if (isNaN(lowerThreshold))
      lowerThreshold = this.getDisplayLowerThreshold(this.props.index);

    return FanConfig.convertFromDisplay(lowerThreshold,
      fanConfig.maxVoltages[this.props.index],
      this.state.thresholdType);
  }

  getUpperThreshold() {
    let fanConfig = this.props.fan.getLastConfig();
    let upperThreshold = this.state.upperThreshold
    if (isNaN(upperThreshold))
      upperThreshold = this.getDisplayUpperThreshold(this.props.index);

    return FanConfig.convertFromDisplay(upperThreshold,
      fanConfig.maxVoltages[this.props.index],
      this.state.thresholdType);
  }

  getThresholdType() {
    return this.state.thresholdType
  }

  handleLowerChange(e) {
    this.setState({ lowerThreshold: e.target.value })
  }

  handleUpperChange(e) {
    this.setState({ upperThreshold: e.target.value })
  }

  handleSwitch(checked, event, id) {
    let value = checked ? 1 : 0;
    let fanConfig = this.props.fan.getLastConfig();

    let lowerThreshold = this.state.lowerThreshold
    if (isNaN(lowerThreshold))
      lowerThreshold = this.getLowerThreshold(this.props.index);
    lowerThreshold = FanConfig.convertFromDisplay(this.state.lowerThreshold,
      fanConfig.maxVoltages[this.props.index],
      this.state.thresholdType);
    lowerThreshold = FanConfig.convertToDisplay(lowerThreshold,
      fanConfig.maxVoltages[this.props.index],
      value);
    lowerThreshold = this.cFormat.format(lowerThreshold)

    let upperThreshold = this.state.upperThreshold
    if (isNaN(upperThreshold))
      upperThreshold = this.getDisplayUpperThreshold(this.props.index);
      upperThreshold = FanConfig.convertFromDisplay(this.state.upperThreshold,
      fanConfig.maxVoltages[this.props.index],
      this.state.thresholdType);
      upperThreshold = FanConfig.convertToDisplay(upperThreshold,
      fanConfig.maxVoltages[this.props.index],
      value);
      upperThreshold = this.cFormat.format(upperThreshold)

    this.setState({ lowerThreshold: lowerThreshold, upperThreshold: upperThreshold, thresholdType: value })
  }

  render() {
    let fanConfig = this.props.fan.getLastConfig();
    let i = this.props.index
    return html`
      <div className="three columns">
        <div className="container width-100 voltage-threshold-background">
          <div className="row">
            <div className="five columns">
              <input className="u-full-width no-margin" type="number" ref=${this.voltageLowerThreshold} value=${this.state.lowerThreshold} onChange=${this.handleLowerChange}/>
            </div>
            <div className="two columns">
              <center><h6 className="padding5">to</h6></center>
            </div>
            <div className="five columns">
              <input className="u-full-width no-margin" type="number" ref=${this.voltageUpperThreshold} value=${this.state.upperThreshold} onChange=${this.handleUpperChange}/>
            </div>
          </div>
          <div className="row">
            <div className="six columns">
                <center><strong><h5 className="no-margin">${Math.round(fanConfig.maxVoltages[i] * 10) / 10} V</h5></strong></center>
            </div>
            <div className="four columns">
                <${Switch}
                id=${'' + i}
                ref=${this.voltageSwitch}
                onChange=${this.handleSwitch}
                checked=${this.state.thresholdType != 0}
                className="react-switch"
                offColor="#999"
                onColor="#9BA2A7"                           
                uncheckedIcon=${html`<div className="react-switch-text">V</div>`}
                checkedIcon=${html`<div className="react-switch-text">%</div>`}
                />
            </div>
          </div>
        </div>
      </div>`;
  }
}

module.exports = {
  FanConfigThresholdItemUI
};
