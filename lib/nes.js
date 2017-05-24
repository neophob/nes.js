'use strict';

const debug = require('debug')('nesjs:nes');
const ines = require('./ines');
const Cpu = require('./cpu');
const Apu = require('./apu');
const Ppu = require('./ppu');
const Mapper = require('./mapper');
const Input = require('./input');
const Memory = require('./memory');

class Nes {
  constructor(rom) {
    this.rom = rom;
    this.memory = new Memory();
    this.cpu = new Cpu(this.memory);
    this.apu = new Apu();
    this.ppu = new Ppu();
    this.input = new Input();
    this.mapper = new Mapper();
  }

  start() {
    debug('start NES');
    this.memory.loadRom(this.rom);
    this.cpu.reset();

    setInterval(() => {
      this.cpu.executeCycle();
    }, 500);
  }

  reset() {
    debug('reset NES');
  }

}

function loadRom(romPath) {
  debug('load rom', romPath);
  return ines.loadRom(romPath)
    .then((result) => {
      debug('loading rom succeeds %o', result.metaData);
      return new Nes(result);
    });
}

module.exports.loadRom = loadRom;
