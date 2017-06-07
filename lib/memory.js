'use strict';

const debug = require('debug')('nesjs:memory');
const addressTranslate = require('./memory/translate.js');

const MEMORY_SIZE = 65536;

class Memory {

  constructor() {
    this.ram = Buffer.from(new Uint8Array(MEMORY_SIZE));
  }

  registerPpu(ppu) {
    this.ppu = ppu;
  }

  registerMapper(mapper) {
    this.mapper = mapper;
  }

  _readRam(offset, busSize) {
    if (busSize === 8) {
      return this.ram.readUInt8(offset);
    }
    return this.ram.readUInt16LE(offset);
  }

  _read(offset, busSize) {
    const address = addressTranslate.getAddress(offset);
    debug('read from adr %o', { address, busSize, offset });
    switch (address.subsystem) {
      case 'cpu':
        return this._readRam(address.offset, busSize);
      case 'ppu':
        return this.ppu.readRegister(address.offset);
      case 'apu':
        debug('apu read not implemented', address.offset);
        break;
      case 'controller':
        debug('controller read not implemented', address.offset);
        break;
      case 'mapper':
        return this.mapper.read(address.offset, busSize);
    }
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
    const address = addressTranslate.getAddress(offset);
    debug('write to adr %o', { address, busSize, offset });
    switch (address.subsystem) {
      case 'cpu':
        return this._writeRam(address.offset, value, busSize);
      case 'ppu':
        return this.ppu.writeRegister(address.offset, value);
      case 'apu':
        debug('apu write not implemented', address.offset);
        break;
      case 'controller':
        debug('controller write not implemented', address.offset);
        break;
      case 'mapper':
        return this.mapper.write(address.offset, value, busSize);
    }
  }

  write8(offset, value) {
    return this._write(offset, value & 0xff, 8);
  }

  write16(offset, value) {
    return this._write(offset, value & 0xffff, 16);
  }

}

module.exports = Memory;
