'use strict';

const debug = require('debug')('nesjs:memory');
const memoryMap = require('./memoryMap.js');

const MEMORY_SIZE = 65536;

class Memory {
  constructor() {
    this.memory = Buffer.alloc(MEMORY_SIZE);
    this.stackPointer = 0;
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


  read16(vectorAddress) {
    debug('read vectorAddress',vectorAddress);
    return this.memory.readUInt16LE(vectorAddress);
  }

  getStackAddress() {
    return this.stackPointer + memoryMap.MEMORY_OFFSET_STACK.offset;
  }

  pushStack16(value) {
    this.memory.writeUInt16LE(value, this.getStackAddress());
    this.stackPointer += 2;
  }

  pushStack8(value) {
    this.memory.writeUInt8(value && 0xff, this.getStackAddress());
    this.stackPointer++;
  }

  popStack16() {
    this.stackPointer -= 2;
    const value = this.memory.readUInt16LE(this.getStackAddress());
    return value;
  }

  popStack8() {
    this.stackPointer--;
    const value = this.memory.readUInt8(this.getStackAddress());
    return value;
  }

}

module.exports = Memory;
