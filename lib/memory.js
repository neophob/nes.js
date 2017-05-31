'use strict';

const debug = require('debug')('nesjs:memory');

const MEMORY_SIZE = 65536;

class Memory {
  
  constructor() {
    this.buffer = Buffer.from(new Uint8Array(MEMORY_SIZE));
  }

  log(offset) {
    if (offset >= 0x2000 && offset <= 0x3fff) {
      debug('access NES PPU registers', offset);
    }
    if (offset >= 0x4000 && offset <= 0x401F) {
      debug('access NES APU and I/O registers', offset);
    }
  }

  _adjustMirroredOffset(offset) {
    // remap internal RAM
    if (offset >= 0x0800 && offset < 0x2000) {
      debug('mirrored read 0x0800');
      offset %= 0x0800;
      return offset;
    }

    this.log(offset);
    // remap PPU registers
    if (offset >= 0x2008 && offset < 0x3fff) {
      debug('mirrored read 0x2008');
      return 0x2000 + offset % 8;
    }
    return offset;
  }

  read8(_offset) {
    const offset = this._adjustMirroredOffset(_offset);
    return this.buffer.readUInt8(offset);
  }

  read16(_offset) {
    const offset = this._adjustMirroredOffset(_offset);
    if (offset !== _offset) {
      debug('updated offset', offset);
    }
    if ((offset & 0xff) === 0xff) {
      debug('BUUUGBUUUGBUUUGBUUUG');
			//highAddress = lowAddress - 0xff;
		}
    return this.buffer.readUInt16LE(offset);
  }

  read16Bug(_offset) {
    // due to a bug in the 6502, the most significant byte of the address is always fetched
		// from the same page as the least significant byte
    debug('read16Bug, offset', _offset);
    const offset = this._adjustMirroredOffset(_offset);
    /*const b = (offset & 0xFF00) | ((offset & 0xff)+1) & 0xffff;
    const low = this.memory.readUInt8(offset);
  	const hi = this.memory.readUInt8(b);
    return (hi & 0xffff) << 8 | (low & 0xffff);*/
		if ((offset & 0xff) === 0xff) {
      debug('BUUUGBUUUGBUUUGBUUUG');
			//highAddress = lowAddress - 0xff;
		}
    return this.buffer.readUInt16LE(offset);
  }

  write8(_offset, value) {
    const offset = this._adjustMirroredOffset(_offset);
    this.buffer.writeUInt8(value & 0xff, offset);
  }

  write16(_offset, value) {
    const offset = this._adjustMirroredOffset(_offset);
    this.buffer.writeUInt16LE(value & 0xffff, offset);
  }

}

module.exports = Memory;
