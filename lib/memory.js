'use strict';

const debug = require('debug')('nesjs:memory');
const memoryMap = require('./memoryMap.js');

const MEMORY_SIZE = 65536;

class Memory {
  constructor() {
    this.memory = Buffer.alloc(MEMORY_SIZE);
  }

  loadRom(rom) {
    debug('load rom %o', rom.metaData);

    //TODO mapper?
    const programRomBuffer = rom.data.programRom;
    const oneProgramRom = rom.metaData.programRomPages === 1 ;
    debug('load program rom, has one Program ROM:', oneProgramRom);
		if (oneProgramRom) {
      const offsetLow = memoryMap.MEMORY_OFFSET_PRGROM_LOW.offset;
      programRomBuffer.copy(this.memory, offsetLow);
      const offsetHigh = memoryMap.MEMORY_OFFSET_PRGROM_HIGH.offset;
      programRomBuffer.copy(this.memory, offsetHigh);
		} else {
      const offset = memoryMap.MEMORY_OFFSET_PRGROM_LOW.offset;
      programRomBuffer.copy(this.memory, offset);
		}
    if (rom.data.characterRom) {
      debug('load character rom');
      // TODO
    }
  }

  read8(offset) {
    debug('read8', offset);
    return this.memory.readUInt8(offset);
  }

  read16(offset) {
    debug('read16', offset);
    return this.memory.readUInt16LE(offset);
  }

  write8(offset, value) {
    debug('write8', offset);
    this.memory.writeUInt8(value & 0xff, offset);
  }

  write16(offset, value) {
    debug('write16', offset);
    this.memory.writeUInt16LE(value & 0xffff, offset);
  }

}

module.exports = Memory;
