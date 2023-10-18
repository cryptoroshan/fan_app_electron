'use strict';
const { FanDisplay } = require('./js/ui/FanDisplay.js');
const { FanManager } = require('./js/manager/FanManager.js');
const  constants = require('./js/constants.js');
const { html } = require('htm/react');
const log = require('electron-log');

let fanManager = new FanManager();

class FanApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.state.fans = [];
    this.state.connectText = ""

    this.txtIP = React.createRef();

    this.connect = this.connect.bind(this);

    fanManager.on(constants.EVENT_FANMANAGER_LIST_UPDATE, () => {
      console.log("refresh list")
      this.setState({
        fans: fanManager.getAllConnectedFans()
      });
    })
  }

  componentDidCatch(error, errorInfo) {
    //log the error to an error reporting service
    log.log({ error, errorInfo });
  }


  render() {

    return (
      html`<div className="row">
              <div className="twelve columns title-margin" >
                <div className="row">
                  <div className="five columns">
                    <h4>Fan Controller</h4>
                  </div>
                  <div className="three columns ipbox">
                    <input className="u-full-width" ref=${this.txtIP}/>
                  </div>
                  <div className="two columns" >
                    <button className="button-primary u-pull-right config-button" onClick=${this.connect}>Connect</button>
                  </div>
                  <div className="two columns" >
                    <button className="button-primary u-pull-right config-button" onClick=${this.refresh}>Refresh</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
            
            </div>
            ${this.loadFanWrapper()}
          `);
  }

  loadFanWrapper() {
    let fans = this.state.fans;
    if (fans.length <= 0) {
      return (
        html`<div>No Controllers Detected</div>`
      )
    }
    return (
      html`<div>${this.loadFans()}</div>`
    );
  }

  loadFans() {
    let table = []
    let fans = this.state.fans;
    for (let index = 0; index < fans.length; index++) {
      let fan = fans[index];
      table.push(html`<${FanDisplay} key=${fan.getId()} data=${fan} />`)
    }
    return table;
  }

  refresh() {
    fanManager.sendBroadcast();
    fanManager.scan();
  }

  connect() {
    this.state.connectText = "Trying to connect"
    fanManager.connectIP(this.txtIP.current.value);
  }
}

const domContainer = document.querySelector('#root');
ReactDOM.render(React.createElement(FanApp), domContainer);
