'use strict';

const debug = require('debug')('nesjs:nes');
const ines = require('./ines');
const Cpu = require('./cpu');
const Apu = require('./apu');
const Ppu = require('./ppu');
const Mapper = require('./mapper');
const Input = require('./input');
const Memory = require('./memory');
const memoryMap = require('./memoryMap.js');

class Nes {
  constructor(rom) {
    this.rom = rom;
    this.ppu = new Ppu();
    this.memory = new Memory();
    this.cpu = new Cpu(this.memory);
    this.apu = new Apu();
    this.input = new Input();
    this.mapper = new Mapper();
  }

  start() {
    debug('start NES');
    this.loadRom();
    this.cpu.reset();

    //setInterval(() => {
    while (true)
      this.cpu.executeCycle();
    //}, 20);
  }


  loadRom() {
    debug('load rom %o', this.rom.metaData);

    //TODO mapper?
    const programRomBuffer = this.rom.data.programRom;
    const oneProgramRomBuffer = this.rom.metaData.programRomPages === 1 ;
    debug('load program rom, has one Program ROM:', oneProgramRomBuffer);
		if (oneProgramRomBuffer) {
      debug('copy rom twice, length', programRomBuffer.length);
      const offsetLow = memoryMap.MEMORY_OFFSET_PRGROM_LOW.offset;
      const amountCopyLow = programRomBuffer.copy(this.memory.buffer, offsetLow);
      const offsetHigh = memoryMap.MEMORY_OFFSET_PRGROM_HIGH.offset;
      const amountCopyHigh = programRomBuffer.copy(this.memory.buffer, offsetHigh);
      if (amountCopyLow !== amountCopyHigh || amountCopyLow !== programRomBuffer.length) {
        throw new Error('COPY_ERROR');
      }
		} else {
      debug('copy rom once, length', programRomBuffer.length);
      const offsetLow = memoryMap.MEMORY_OFFSET_PRGROM_LOW.offset;
      programRomBuffer.copy(this.memory.buffer, offsetLow);
		}
    if (this.rom.data.characterRom) {
      // debug('TODO load character rom');
      // TODO
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
