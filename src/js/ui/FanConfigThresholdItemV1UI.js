'use strict';
const { html } = require('htm/react');
const Switch = require('react-switch').default;
const { FanConfig } = require('../obj/FanConfig');

class FanConfigThresholdItemV1UI extends React.Component {
  constructor(props) {
    super(props);
    this.fan = this.props.fan;
    let fanConfig = this.props.fan.getLastConfig();

    let index = this.props.index;
    this.cFormat = new Intl.NumberFormat(undefined, { style: 'decimal', minimumFractionDigits: 1, maximumFractionDigits: 1 })

    this.state = {
      lowerThreshold: this.getDisplayThreshold(index),
      thresholdType: fanConfig.voltageThresholdType[index]
    };

    this.voltageThreshold = React.createRef();
    this.voltageSwitch = React.createRef();

    this.handleTChange = this.handleTChange.bind(this);
    this.handleSwitch = this.handleSwitch.bind(this);

    this.getDisplayThreshold = this.getDisplayThreshold.bind(this);

    this.getThreshold = this.getThreshold.bind(this);
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
      threshold: this.getDisplayThreshold(index),
      thresholdType: fanConfig.voltageThresholdType[index]
    };
    this.setState(s)
  }

  getDisplayThreshold(index) {
    let fanConfig = this.props.fan.getLastConfig();
    var value = FanConfig.convertToDisplay(fanConfig.voltageThreshold[index],
      fanConfig.maxVoltages[index],
      fanConfig.voltageThresholdType[index]);
    
    value = Math.abs(value)
    if(fanConfig.maxVoltages[index] < 0 && fanConfig.voltageThresholdType[index] == 0)
      value = -1 * value

    return this.cFormat.format(value);
  }

  getThreshold() {
    let fanConfig = this.props.fan.getLastConfig();
    let threshold = this.state.threshold
    if (isNaN(threshold))
    threshold = this.getDisplayThreshold(this.props.index);

    return FanConfig.convertFromDisplay(threshold,
      fanConfig.maxVoltages[this.props.index],
      this.state.thresholdType);
  }

  getThresholdType() {
    return this.state.thresholdType
  }

  handleTChange(e) {
    this.setState({ threshold: e.target.value })
  }

  handleSwitch(checked, event, id) {
    let value = checked ? 1 : 0;
    let fanConfig = this.props.fan.getLastConfig();


    let threshold = this.state.threshold
    if (isNaN(threshold))
    threshold = this.getThreshold(this.props.index);
    threshold = FanConfig.convertFromDisplay(this.state.threshold,
      fanConfig.maxVoltages[this.props.index],
      this.state.thresholdType);
      threshold = FanConfig.convertToDisplay(threshold,
      fanConfig.maxVoltages[this.props.index],
      value);
      threshold = this.cFormat.format(threshold)

    this.setState({ threshold: threshold,  thresholdType: value })
  }

  render() {
    let fanConfig = this.props.fan.getLastConfig();
    let i = this.props.index
    return html`<div className="three columns">
      <div className="container width-100 voltage-threshold-background">
        <div className="row">
          <div className="seven columns">
            <input className="u-full-width no-margin" type="number" ref=${this.voltageThreshold} value=${this.state.threshold} onChange=${this.handleTChange}/>
          </div>
          <div className="five columns">
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
          <div className="row"><center><strong><h5 className="no-margin">${Math.round(fanConfig.maxVoltages[i] * 10) / 10} V</h5></strong></center></div>
      </div>
    </div>`;

  }
}

module.exports = {
  FanConfigThresholdItemV1UI
};
