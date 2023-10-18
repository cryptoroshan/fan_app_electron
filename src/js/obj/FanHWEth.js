'use strict';

const { FanData } = require('./FanData.js');
const { FanConfig } = require('./FanConfig.js');
const { FanHW } = require('../obj/FanHW.js');
const fetch = require('node-fetch');
const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
const dgram = require('dgram');

const HW_STATE_UNKNOWN = -1;
const HW_STATE_CONNECTED = 2;
const HW_STATE_DISCONNECTED = 3;

const REFRESH_RATE = 1000;
const MAX_ERROR = 3;

class FanHWEth extends FanHW {
  constructor(model) {
    super(model);
    this.hwState = HW_STATE_UNKNOWN
    this.ip = ""
    this.port = 80
    this.errorCount = 0;
  }

  connect(ip, port, force) {
    if (this.hwState == HW_STATE_CONNECTED && !force) {
      console.log("already connected");
      return;
    }
    this.ip = ip
    this.port = port

    this.errorCount = 0;
    this.hwState = HW_STATE_CONNECTED;
    this.emit(constants.EVENT_FANHW_STATE_UPDATE);

    this.interval = setInterval(() => this.loadData(), REFRESH_RATE);
    this.loadConfig();
    this.loadVersion();
  }

  disconnect() {
    console.log("Fan disconncted: " + this.ip);
    this.doDisconnect();
  }

  doDisconnect() {
    clearInterval(this.interval);
    this.hwState = HW_STATE_DISCONNECTED;
    this.emit(constants.EVENT_FANHW_STATE_UPDATE);
    this.removeAllListeners(constants.EVENT_FANHW_STATE_UPDATE);
  }

  isDisconnected() {
    return this.hwState == HW_STATE_UNKNOWN || this.hwState == HW_STATE_DISCONNECTED;
  }

  isConnected() {
    return this.hwState == HW_STATE_CONNECTED;
  }



  getRequest(endpoint, onReceive) {
    this.doRequest(endpoint, { method: 'GET' }, onReceive);
  }
  postRequest(endpoint, data, onReceive) {
    let options = {
      method: 'POST', // or 'PUT'
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: data
    };
    this.doRequest(endpoint, options, onReceive);
  }
  doRequest(endpoint, option, onReceive) {
    let uri = 'http://' + this.ip + ':' + this.port + '/' + endpoint
    if (option.method == 'GET')
      uri += '?'; //limitation fo lwip http server
    fetch(uri, option)
      .then((data) => {
        this.errorCount = 0;
        onReceive(data)
      })
      .catch((err) => {
        this.errorCount++;
        if (this.errorCount > MAX_ERROR) {
          this.disconnect();
        }
        console.log(err);
      })
  }

  async doAsyncRequest(endpoint, option) {
    let uri = 'http://' + this.ip + ':' + this.port + '/' + endpoint
    if (option.method == 'GET')
      uri += '?'; //limitation fo lwip http server
    return await fetch(uri, option)
  }

  loadVersion() {
    if (this.hwState == HW_STATE_CONNECTED) {
      this.getRequest('version', (response) => {
        response.arrayBuffer().then((arrayBuffer) => {
          var base64String = atob(String.fromCharCode.apply(null, new Uint8Array(arrayBuffer)));
          this.majorVersion = base64String.charCodeAt(0);
          this.minorVersion = base64String.charCodeAt(1);
          this.emit(constants.EVENT_FANHW_VERSION_UPDATE);
        });
      })
    }
  }


  loadData() {
    if (this.hwState == HW_STATE_CONNECTED) {
      this.getRequest('fan', (response) => {
        response.arrayBuffer().then((arrayBuffer) => {
          var base64String = Buffer.from((String.fromCharCode.apply(null, new Uint8Array(arrayBuffer))), 'base64');
          this.lastData = FanData.fromBase64(base64String); //peel off FCR,
          this.emit(constants.EVENT_FANHW_DATA_UPDATE);
        });
      })
    }
  }

  loadConfig() {
    console.log('load config')
    if (this.hwState == HW_STATE_CONNECTED) {
      this.getRequest('config', (response) => {
        response.arrayBuffer().then((arrayBuffer) => {
          var base64String = Buffer.from((String.fromCharCode.apply(null, new Uint8Array(arrayBuffer))), 'base64');
          var c = FanConfig.fromBase64(this.getMaxVoltage(), Buffer.from(base64String, 'base64')); //peel off FCR,
          if(c)
            this.config = c;
          this.emit(constants.EVENT_FANHW_CONFIG_UPDATE);
        });
      })
    }
  }
  saveConfig(fanConfig) {
    if (this.hwState == HW_STATE_CONNECTED) {
      var base64String = fanConfig.toBase64(this.supportIPAddress());
      this.postRequest('config', base64String, (response) => { });
      this.config = fanConfig;
      this.emit(constants.EVENT_FANHW_STATE_UPDATE);
      this.emit(constants.EVENT_FANHW_CONFIG_UPDATE);

    }
  }

  rebootToBoot() {
    if (this.hwState == HW_STATE_CONNECTED) {

    }
  }


  async uploadFirmware(selectedFile, onUpdate, onSuccess, onError) {
    if (this.uploadLock)
      return
    this.uploadLock = true;

    clearInterval(this.interval);

    fs.readFile(selectedFile, (err, data) => {
      if (err) {
        onError(err);
        return;
      }

      this.afterRead(data, onUpdate, () => {
        this.uploadLock = false;
        if (onSuccess)
          onSuccess()
      }, () => {
        this.uploadLock = false;
        if (onError)
          onError()
      })
    });
  }

  async sendChunk(client, buf, i, chunkSize, attempt) {
    return new Promise(resolve => {
      if (attempt > 5) {
        resolve(false)
      }
      var watchDog = setTimeout(async () => {
        if (attempt < 3) {
          var result = await this.sendChunk(client, buf, i, chunkSize, attempt + 1)
          resolve(result)
        } else {
          resolve(false)
        }
      }, 10000)

      const callback = async (msg, rinfo) => {
        client.off('message', callback);
        clearTimeout(watchDog)
        if (msg.length == 2 && msg[0] == 0x08) {
          if (msg[1] == 0x01) {
            resolve(true)
          } else if (msg[1] == 0x02) { //retry
            var result = await this.sendChunk(client, buf, i, chunkSize, attempt + 1)
            resolve(result)
          } else {
            resolve(false)
          }
        }
      };
      client.on('message', callback);

      let header = new Uint8Array(4);
      header[0] = 0x20;
      header[1] = i;
      header[2] = chunkSize & 0xFF;
      header[3] = (chunkSize >> 8) & 0xFF;

      var packet = Buffer.concat([Buffer.from(header), buf]);
      client.send(packet, 0, packet.length, 37021, this.ip, (err) => {
        if (err) {
          console.log(err)
          clearTimeout(watchDog)
          resolve(false)
        }
      });
    })
  }

  async afterRead(inputData, onUpdate, onSuccess, onError) {
    onUpdate(0);

    const httpAgent = new http.Agent({ keepAlive: true });
    var options = {
      method: 'POST', // or 'PUT'
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      keepalive: true,
      body: [],
      httpAgent
    };

    var response;
    const chunkSize = 1 * 1024
    try {
      var numChunk = Math.ceil(inputData.length / chunkSize)
      if(numChunk > 256) {
        console.log("File too big")
        if (onError)
          onError()
        return
      }

      response = await fetch('http://' + this.ip + ':' + this.port + '/' + 'fw-start', options)
      if (response.status != 200) {
        console.log("Not 200 at start")
        if (onError)
          onError()
        return;
      }

      var client = dgram.createSocket("udp4");
     
      for (var i = 0; i < numChunk; i++) {
        console.log("start: " + i)

        var buf = inputData.slice(i * chunkSize, Math.min((i + 1) * chunkSize, inputData.length));
        var result = await this.sendChunk(client, buf, i, chunkSize, 0)
        if (!result) {
          console.log("Not 200")
          if (onError)
            onError()
          return;
        }

        console.log("Finished: " + i)
        onUpdate(i / (1.0*(numChunk)))
      }

      var hash = crypto.createHash('md5').update(inputData).digest('base64');
      console.log(hash);
      options.body = hash;
      response = await fetch('http://' + this.ip + ':' + this.port + '/' + 'fw-end?size=' + inputData.length, options);
      if (response.status != 200) {
        console.log("Not 200 at start")
        if (onError)
          onError()
        return;
      }

      console.log("Success")
      if (onSuccess)
        onSuccess();

      setTimeout(() => this.connect(this.ip, this.port, true), 3000);
    } catch (err) {
      if (onError)
        onError()
      console.log(err)
      return
    }
  }
}
module.exports = {
  FanHWEth
};