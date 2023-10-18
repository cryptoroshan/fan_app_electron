'use strict';
const usb = require('usb');

const SerialPort = require('serialport');
const EventEmitter = require('events');

const { FanHWUART } = require('../obj/FanHWUART.js');
const { FanHWEth } = require('../obj/FanHWEth.js');
const constants = require('../constants.js');

const dgram = require('dgram');
const os = require('os');
const broadcastAddress = require('broadcast-address');

const webusb = new usb.WebUSB({
  allowAllDevices: true
});

const REFRESH_RATE = 60000;

class FanManager extends EventEmitter {
  constructor() {
    super();
    this.fans = new Map(); //com number => FanHW
    //todo find exisiting connections

    this.client = dgram.createSocket("udp4");

    this.client.on('listening', () => {
      this.client.setBroadcast(true);

      this.sendBroadcast();
    });

    this.client.on("message", (msg, rinfo) => {
      let ip = rinfo.address
      if (this.getLocalIPs().includes(ip))
        return;
      this.connectIP(ip)
    });

    this.client.bind(37020)
    webusb.addEventListener('connect', this.onDevice);
    webusb.addEventListener('attach', this.onDevice);
    this.interval = setInterval(() => this.scan(), REFRESH_RATE);

    this.scan();
  }

  onDevice(event) {
    var device = event.device
    console.log("Detected new usb: " + device)
    if (device.vendorIdF == 1240 && device.productId == 64850) {
      this.scan();
    }
  }

  scan() {
    SerialPort.list().then(
      ports => ports.forEach((port) => {
        console.log("Found Port: " + port.path)
        var portName = port.path;
        if (this.shouldConnect(port)) {
          if (!(this.fans.has(portName))) {
            var model = constants.MODEL_V1a
            if (port.productId == "FD52") {
              model = constants.MODEL_V1
            } else if (port.productId == "FD53") {
              model = constants.MODEL_V2
            }
            this.fans.set(portName, new FanHWUART(model, portName));
          }
          var fan = this.fans.get(portName);
          if (fan.isDisconnected()) {
            console.log("Connecting to: " + port.path)
            fan.connect(port)
          }

          fan.on(constants.EVENT_FANHW_STATE_UPDATE, () => {
            this.emit(constants.EVENT_FANMANAGER_LIST_UPDATE);
          })

          this.emit(constants.EVENT_FANMANAGER_LIST_UPDATE);
        }
      }),
      err => console.error(err)
    );
  }

  connectIP(ip) {
    if (!(this.fans.has(ip))) {
      this.fans.set(ip, new FanHWEth(constants.MODEL_V3));
    }
    var fan = this.fans.get(ip);
    if (fan.isDisconnected()) {
      console.log("Connecting to: " + ip)
      fan.connect(ip, 80, false);
    }

    fan.on(constants.EVENT_FANHW_STATE_UPDATE, () => {
      this.emit(constants.EVENT_FANMANAGER_LIST_UPDATE);
    })

    this.emit(constants.EVENT_FANMANAGER_LIST_UPDATE);
  }

  shouldConnect(port) {
    return port.vendorId == "04D8" && (port.productId == "FD52" || port.productId == "FD53" || port.productId == "FD54");
  }

  getAllFans() {
    return Array.from(this.fans.values());
  }

  getAllConnectedFans() {
    let arr = [];
    let fans = this.getAllFans();
    for (let index = 0; index < fans.length; index++) {
      let fan = fans[index];
      if (fan.isConnected()) {
        arr.push(fan);
      }
    }
    return arr;
  }


  getBoardcastIPs() {
    let networkInterfaces = os.networkInterfaces();
    let results = [];
    for (let inet in networkInterfaces) {
      results.push(broadcastAddress(inet))
    }
    return results;
  }

  getLocalIPs() {
    let networkInterfaces = os.networkInterfaces();
    let results = [];
    for (let inet in networkInterfaces) {
      let addresses = networkInterfaces[inet];
      for (let i = 0; i < addresses.length; i++) {
        let address = addresses[i];
        if (!address.internal) {
          results.push(address.address);
        }
      }
    }
    results.push("127.0.0.1")
    return results;
  }

  sendBroadcast() {
    this.getBoardcastIPs().forEach((ip) => {
      var message = Buffer.from([0x62, 0x75, 0x66, 0x66]);;
      this.client.send(message, 0, message.length, 37020, ip);
    });
  }
}

module.exports = {
  FanManager
};