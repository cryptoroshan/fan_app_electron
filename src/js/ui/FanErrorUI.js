'use strict';

const {html} = require('htm/react');

class FanErrorUI extends React.Component {
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
      <div className="six columns">
        <div className="row"> 
          <div className="two columns marginT25">
            <center><h6><b>System</b></h6></center>
          </div>   
          <div className="three columns">
            <div className="container">
              <div className="row"><center><div className=${lastData.isTempError(fanConfig) ? "circle red" : "circle green"}/></center></div>
              <div className="row"><center><strong>Temperature</strong></center></div>
            </div>
          </div>
          <div className="three columns">
            <div className="container">
              <div className="row"><center><div className=${lastData.isFanError(fanConfig) ? "circle red" : "circle green"}/></center></div>
              <div className="row"><center><strong>Fan</strong></center></div>
            </div>
          </div>
          <div className="three columns">
            <div className="container">
              <div className="row"><center><div className=${lastData.isVoltageError(fanConfig) ? "circle red" : "circle green"}/></center></div>
              <div className="row"><center><strong>Voltage</strong></center></div>
            </div>
          </div>
      
        </div>
      </div>
      </div>
      
      <div className="row">      
      <div className="six columns">
        <div className="container">
          <div className="row">   
            <div className="two columns marginT25">
              <center><h6><b>PSU 1</b></h6></center>
            </div>   
            <div className="three columns ">
              <div className="container">
                <div className="row"><center><div className=${lastData.isDC1Error() ? "circle red" : "circle green"}/></center></div>
                <div className="row"><center><strong>DC</strong></center></div>
              </div>
            </div>
            <div className="three columns">
              <div className="container">
                <div className="row"><center><div className=${lastData.isAC1Error() ? "circle red" : "circle green"}/></center></div>
                <div className="row"><center><strong>AC</strong></center></div>
              </div>
            </div>
            <div className="three columns">
              <div className="container">
                <div className="row"><center><div className=${lastData.is481Error() ? "circle red" : "circle green"}/></center></div>
                <div className="row"><center><strong>48 V</strong></center></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="six columns">
        <div className="container">
          <div className="row">   
            <div className="two columns marginT25">
              <center><h6><b>PSU 2</b></h6></center>
            </div>    
            <div className="three columns">
              <div className="container">
                <div className="row"><center><div className=${lastData.isDC2Error() ? "circle red" : "circle green"}/></center></div>
                <div className="row"><center><strong>DC</strong></center></div>
              </div>
            </div>
            <div className="three columns">
              <div className="container">
                <div className="row"><center><div className=${lastData.isAC2Error() ? "circle red" : "circle green"}/></center></div>
                <div className="row"><center><strong>AC</strong></center></div>
              </div>
            </div>
            <div className="three columns">
              <div className="container">
                <div className="row"><center><div className=${lastData.is482Error() ? "circle red" : "circle green"}/></center></div>
                <div className="row"><center><strong>48 V</strong></center></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>`
    );
  }
}

module.exports = {
  FanErrorUI
};