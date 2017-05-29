'use strict';

const debug = require('debug')('nesjs:memory');
const memoryMap = require('./memoryMap.js');

const MEMORY_SIZE = 65536;

class Memory {
  constructor() {
    //this.memory = Buffer.alloc(MEMORY_SIZE);
    this.memory = Buffer.from(new Uint8Array(MEMORY_SIZE));
  }

  loadRom(rom) {
    debug('load rom %o', rom.metaData);

    //TODO mapper?
    const programRomBuffer = rom.data.programRom;
    const oneProgramRomBuffer = rom.metaData.programRomPages === 1 ;
    debug('load program rom, has one Program ROM:', oneProgramRomBuffer);
		if (oneProgramRomBuffer) {
      debug('copy rom twice, length', programRomBuffer.length);
      const offsetLow = memoryMap.MEMORY_OFFSET_PRGROM_LOW.offset;
      const amountCopyLow = programRomBuffer.copy(this.memory, offsetLow);
      const offsetHigh = memoryMap.MEMORY_OFFSET_PRGROM_HIGH.offset;
      const amountCopyHigh = programRomBuffer.copy(this.memory, offsetHigh);
      if (amountCopyLow !== amountCopyHigh || amountCopyLow !== programRomBuffer.length) {
        throw new Error('COPY_ERROR');
      }
		} else {
      debug('copy rom once, length', programRomBuffer.length);
      const offset = memoryMap.MEMORY_OFFSET_PRGROM_LOW.offset;
      programRomBuffer.copy(this.memory, offset);
		}
    if (rom.data.characterRom) {
      // debug('TODO load character rom');
      // TODO
    }
  }

  _adjustMirroredOffset(offset) {
    // remap internal RAM
    if (offset >= 0x0800 && offset < 0x2000) {
      debug('mirrored read 0x0800');
      offset %= 0x0800;
      return offset;
    }
    // remap PPU registers
    if (offset >= 0x2008 && offset < 0x3fff) {
      debug('mirrored read 0x2008');
      return 0x2000 + offset % 8;
    }
    return offset;
  }

  read8(_offset) {
    //debug('read8, offset', _offset);
    const offset = this._adjustMirroredOffset(_offset);
    return this.memory.readUInt8(offset);
  }

  read16(_offset) {
    debug('read16, offset', _offset);
    const offset = this._adjustMirroredOffset(_offset);
    if (offset !== _offset) {
      debug('updated offset', offset);
    }

    if ((offset & 0xff) === 0xff) {
      debug('BUUUGBUUUGBUUUGBUUUG');
			//highAddress = lowAddress - 0xff;
		}

    return this.memory.readUInt16LE(offset);
  }

  read16Bug(_offset) {
    // due to a bug in the 6502, the most significant byte of the address is always fetched
		// from the same page as the least significant byte
    debug('read16Bug, offset', _offset);
    const offset = this._adjustMirroredOffset(_offset);
    const b = (offset & 0xFF00) | ((offset & 0xff)+1) & 0xffff;
    const low = this.memory.readUInt8(offset);
  	const hi = this.memory.readUInt8(b);
    return (hi & 0xffff) << 8 | (low & 0xffff);
		/*if ((offset & 0xff) === 0xff) {
      debug('BUUUGBUUUGBUUUGBUUUG');
			//highAddress = lowAddress - 0xff;
		}
    return this.memory.readUInt16LE(offset);*/
  }

  write8(_offset, value) {
    //debug('write8, offset', _offset);
    const offset = this._adjustMirroredOffset(_offset);
    this.memory.writeUInt8(value & 0xff, offset);
  }

  write16(_offset, value) {
    debug('write16, offset', _offset);
    const offset = this._adjustMirroredOffset(_offset);
    this.memory.writeUInt16LE(value & 0xffff, offset);
  }

}

module.exports = Memory;
