'use strict';

const debug = require('debug')('nesjs:nes');
const ines = require('./ines');
const Cpu = require('./cpu');
const Apu = require('./apu');
const Ppu = require('./ppu');
const Mapper = require('./mapper');
const Input = require('./input');
const Memory = require('./memory');
//const client = require('./client');

class Nes {
  constructor(rom) {
    this.rom = rom;
    this.ppu = new Ppu();
    this.memory = new Memory();
    this.cpu = new Cpu(this.memory);
    this.apu = new Apu();
    this.input = new Input();
  }

  start() {
    debug('start NES');
    const mapper = Mapper.getMapper(this.rom);
    this.ppu.registerMapper(mapper);
    this.memory.registerPpu(this.ppu);
    this.memory.registerMapper(mapper);
    this.cpu.reset();
  }

  executeCycle() {
    this.cpu.executeCycle();
    this.ppu.executeCycle();
    this.ppu.executeCycle();
    this.ppu.executeCycle();
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
