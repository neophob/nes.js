'use strict';

const debug = require('debug')('nesjs:memory');
const memoryMap = require('./memoryMap.js');

const MEMORY_SIZE = 65536;
const MEMORY_ADDR_RAM = 0x2000;
const MEMORY_ADDR_PPU_REMAPPED = 0x4000;
const MEMORY_ADDR_MAPPER = 0x6000;

class Memory {

  constructor() {
    this.ram = Buffer.from(new Uint8Array(MEMORY_SIZE));
  }

  registerPpu(ppu) {
    this.ppu = ppu;
  }

  _readRam(offset, busSize) {
    if (busSize === 8) {
      return this.ram.readUInt8(offset);
    }
    return this.ram.readUInt16LE(offset);
  }

  _read(offset, busSize) {
    debug('read at %d: %d', offset, busSize);
    if (offset < MEMORY_ADDR_RAM) {
      return this._readRam(offset % 0x0800, busSize);
    }
    if (offset < MEMORY_ADDR_PPU_REMAPPED) {
      return this.ppu.readRegister(0x2000 + offset % 8, busSize);
    }
    switch (offset) {
      case memoryMap.MEMORY_ADDR_PPU.offset:
        return this.ppu.readRegister(offset, busSize);

      case memoryMap.MEMORY_ADDR_APU.offset:
        return 0;
        //return mem.console.PPU.readRegister(address)
      case memoryMap.MEMORY_ADDR_CONTROLLER1.offset:
        return 0;
      case memoryMap.MEMORY_ADDR_CONTROLLER2.offset:
        return 0;
    }
    if (offset >= MEMORY_ADDR_MAPPER) {
      // use mapper here
      return this._readRam(offset, busSize);
    }
    debug('INVALID_OFFSET_READ: %d', offset);
  }

  read8(offset) {
    return this._read(offset, 8);
  }

  read16(offset) {
    return this._read(offset, 16);
  }

  read16Bug(_offset) {
    return this.read16(_offset);
    // due to a bug in the 6502, the most significant byte of the address is always fetched
		// from the same page as the least significant byte
  }

  _writeRam(offset, value, busSize) {
    if (busSize === 8) {
      return this.ram.writeUInt8(value, offset);
    }
    return this.ram.writeUInt16LE(value, offset);
  }

  _write(offset, value, busSize) {
    if (offset < MEMORY_ADDR_RAM) {
      return this._writeRam(offset % 0x0800, value, busSize);
    }
    if (offset < MEMORY_ADDR_PPU_REMAPPED) {
      return this.ppu.writeRegister(0x2000 + offset % 8, busSize);
    }
    switch (offset) {
      case memoryMap.MEMORY_ADDR_PPU.offset:
        return this.ppu.writeRegister(offset, busSize);

      case memoryMap.MEMORY_ADDR_APU.offset:
        return 0;
        //return mem.console.PPU.readRegister(address)
      case memoryMap.MEMORY_ADDR_CONTROLLER1.offset:
        return 0;
      case memoryMap.MEMORY_ADDR_CONTROLLER2.offset:
        return 0;
    }
    if (offset >= MEMORY_ADDR_MAPPER) {
      // use mapper here
      this._writeRam(offset, value, busSize);
    }
    debug('INVALID_OFFSET_WRITE: %d', offset);
  }

  write8(offset, value) {
    return this._write(offset, value & 0xff, 8);
  }

  write16(offset, value) {
    return this._write(offset, value & 0xffff, 16);
  }

}

module.exports = Memory;
