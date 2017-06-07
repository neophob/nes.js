'use strict';

const debug = require('debug')('nesjs:nes');
const ines = require('./ines');
const Cpu = require('./cpu');
const Apu = require('./apu');
const Ppu = require('./ppu');
const Mapper = require('./mapper');
const Input = require('./input');
const Memory = require('./memory');

const NTSC_REFRESHRATE = 60;
const NTSC_CYCLES_PER_SECOND = 1789773;
const NTSC_CYCLES_PER_INTERVAL = NTSC_CYCLES_PER_SECOND / NTSC_REFRESHRATE;

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
    this.ppu.registerCpu(this.cpu);
    this.memory.registerPpu(this.ppu);
    this.memory.registerMapper(mapper);
    this.cpu.reset();
  }

  executeCycle() {
    const currentCpuCycles = this.cpu.cycles;
    const expectedCpuCycles = currentCpuCycles + NTSC_CYCLES_PER_INTERVAL;
    while (this.cpu.cycles < expectedCpuCycles) {
      this.cpu.executeCycle();
    }
    // NTSC clocks runs 3 times faster than cpu
    let ppuTicksToRun = 3 * (this.cpu.cycles - currentCpuCycles);
    while (ppuTicksToRun--) {
      this.ppu.executeCycle();
    }
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
