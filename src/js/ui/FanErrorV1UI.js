'use strict';

const {html} = require('htm/react');
const constants = require('../constants.js');

class FanErrorV1UI extends React.Component {
  constructor(props) {
    super(props);

    this.fan = props.fan;
    this.state = {};
    this.state.fanData = this.fan.getLastData();

    this.temperatureConfig = React.createRef();
    this.thresholdConfig = React.createRef();

    this.handleFanUpdate = this.handleFanUpdate.bind(this);
  }

  handleFanUpdate() {
    this.setState({
      fanData: this.fan.getLastData()
    });
  }

  componentDidMount() {
    if (this.fan != null) {
      this.fan.on(constants.EVENT_FANHW_DATA_UPDATE, this.handleFanUpdate);
    }
  }

  componentWillUnmount() {
    if (this.fan != null) {
      this.fan.off(constants.EVENT_FANHW_DATA_UPDATE, this.handleFanUpdate);
    }
  }

  render() {
    let lastData = this.state.fanData;
    let fanConfig = this.fan.getLastConfig();
    if (lastData == null || fanConfig == null)
      return ""

    return (
      html`
      <div className="row">        
      <div className="twelve columns">
        <div className="row"> 
          <div className="three columns">
            <div className="container">
              <div className="row"><center><div className=${(lastData.errorMask & constants.ERROR_VOLTAGE)== constants.ERROR_VOLTAGE ? "circle red" : "circle green"}/></center></div>
              <div className="row"><center><strong>Power</strong></center></div>
            </div>
          </div>
          <div className="three columns">
            <div className="container">
              <div className="row"><center><div className=${(lastData.errorMask & constants.ERROR_FAN)== constants.ERROR_FAN ? "circle red" : "circle green"}/></center></div>
              <div className="row"><center><strong>Fan</strong></center></div>
            </div>
          </div>
          <div className="three columns">
            <div className="container">
              <div className="row"><center><div className=${(lastData.errorMask & constants.ERROR_TEMP)== constants.ERROR_TEMP ? "circle red" : "circle green"}/></center></div>
              <div className="row"><center><strong>Temperature</strong></center></div>
            </div>
          </div>
          <div className="three columns">
            <div className="container">
              <div className="row"><center><div className=${(lastData.errorMask & constants.ERROR_SOUND)== constants.ERROR_SOUND ? "circle red" : "circle green"}/></center></div>
              <div className="row"><center><strong>Sound</strong></center></div>
            </div>
          </div>
        </div>
      </div>
      </div>`
    );
  }
}

module.exports = {
  FanErrorV1UI
};