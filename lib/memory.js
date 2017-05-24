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
      debug('TODO load character rom');
      // TODO
    }
  }

  _adjustMirroredOffset(offset) {
    // remap internal RAM
    if (offset >= 0x0800 && offset < 0x2000) {
      offset %= 0x0800;
      return offset;
    }
    // remap PPU registers
    if (offset >= 0x2008 && offset < 0x3fff) {
      return 0x2000 + offset % 8;
    }
    return offset;
  }

  read8(_offset) {
    debug('read8', _offset);
    const offset = this._adjustMirroredOffset(_offset);
    return this.memory.readUInt8(offset);
  }

  read16(_offset) {
    debug('read16', _offset);
    const offset = this._adjustMirroredOffset(_offset);
    return this.memory.readUInt16LE(offset);
  }

  write8(_offset, value) {
    debug('write8', _offset);
    const offset = this._adjustMirroredOffset(_offset);
    this.memory.writeUInt8(value & 0xff, offset);
  }

  write16(_offset, value) {
    debug('write16', _offset);
    const offset = this._adjustMirroredOffset(_offset);
    this.memory.writeUInt16LE(value & 0xffff, offset);
  }

}

module.exports = Memory;
