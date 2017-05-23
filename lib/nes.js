'use strict';

const debug = require('debug')('nesjs:nes');
const ines = require('./ines');
const Cpu = require('./cpu');
const Apu = require('./apu');
const Ppu = require('./ppu');
const Mapper = require('./mapper');
const Input = require('./input');

class Nes {
  constructor(rom) {
    this.rom = rom.romData;
    this.romMetaData = rom.romMetaData;
    this.cpu = new Cpu();
    this.apu = new Apu();
    this.ppu = new Ppu();
    this.input = new Input();
    this.mapper = new Mapper();
    this.ram = [];
  }

  start() {
    debug('start NES');
  }

  reset() {
    debug('reset NES');
  }

}

function loadRom(romPath) {
  debug('load rom', romPath);
  return ines.loadRom(romPath)
    .then((result) => {
      debug('loading rom succeeds %o', result.romMetaData);
      return new Nes(result);
    })
    .catch((error) => {
      debug('loading rom failed %o', error);
    });
}

module.exports.loadRom = loadRom;
