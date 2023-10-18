'use strict';

const {html} = require('htm/react')
const { ipcRenderer } = require('electron');
const path = require('path'); 


class FanFirmwareUpdateUI extends React.Component {
    constructor(props) {
      super(props);
      this.fan = props.data;
      this.state = {};
      this.state.updateState = 0;
      this.state.progress = 0;
      

      this.handleChange = this.handleChange.bind(this);
      this.onSelectFile = this.onSelectFile.bind(this);
      this.handleFanUpdate = this.handleFanUpdate.bind(this);

      ipcRenderer.on('selected-file', this.onSelectFile)
      this.fan.on(constants.EVENT_FANHW_VERSION_UPDATE, this.handleFanUpdate);
    }
  
    onSelectFile (event, path) {
      console.log(path);
      this.setState({updateState: 1});
      this.fan.uploadFirmware(path,
        (value)=>{this.setState({progress: value},function(){ console.log("force update") });},
         ()=>{this.setState({updateState: 99});},
          ()=>{this.setState({updateState: -1});});
    }

    handleChange(e) {
      this.props.onChange();
    }

    onOpen() {
      ipcRenderer.invoke('show-dialog');
    }

    handleFanUpdate() {
      this.setState({updateState: 0});
    }
  
    render() {
      return (
        html`<div className="row talgin-right ${this.state.updateState != 1 ? "hidden" : ""}"><b>Firmware is updating, Please wait this may take several minutes. Progress ${Math.round(this.state.progress*100)}%</b></div>
        <div className="row text-red talgin-right ${this.state.updateState != -1 ? "hidden" : ""}">Firmware update has failed</div>
        <div className="row text-green talgin-right ${this.state.updateState != 99 ? "hidden" : ""}">Firmware update was successful</div>
        <div className="row ${this.state.updateState == 1 ? "hidden" : ""}">
          <div className="six columns"> </div>
          <div className="three columns marginT10">
            Upload system image:
          </div>
          <div className="three columns">
            <button className="button-primary u-pull-right" onClick=${this.onOpen}>Upload a File</button>
          </div>
        </div>`
      );
    }
  }
  
  module.exports = {
    FanFirmwareUpdateUI
  };