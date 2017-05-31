'use strict';

const debug = require('debug')('nesjs:memory');

const MEMORY_SIZE = 65536;
const MEMORY_ADDR_RAM = 0x2000;
const MEMORY_ADDR_PPU_REMAPPED = 0x4000;
const MEMORY_ADDR_PPU = 0x4014;
const MEMORY_ADDR_APU = 0x4015;
const MEMORY_ADDR_CONTROLLER1 = 0x4016;
const MEMORY_ADDR_CONTROLLER2 = 0x4017;
const MEMORY_ADDR_MAPPER = 0x6000;

class Memory {

  constructor(ppu) {
    this.ppu = ppu;
    this.ram = Buffer.from(new Uint8Array(MEMORY_SIZE));
  }

  read8(offset) {
    if (offset < MEMORY_ADDR_RAM) {
      return this.ram.readUInt8(offset % 0x0800);
    }
    if (offset < MEMORY_ADDR_PPU_REMAPPED) {
      return 0;
      //return mem.console.PPU.readRegister(0x2000 + address%8)
    }
    switch (offset) {
      case MEMORY_ADDR_PPU:
        return 0;
        //return mem.console.PPU.readRegister(address)
      case MEMORY_ADDR_APU:
        return 0;
        //return mem.console.PPU.readRegister(address)
      case MEMORY_ADDR_CONTROLLER1:
        return 0;
      case MEMORY_ADDR_CONTROLLER2:
        return 0;
    }
    if (offset >= MEMORY_ADDR_MAPPER) {
      // use mapper here
      return this.ram.readUInt8(offset);
    }
  }

  read16(offset) {
    if (offset < MEMORY_ADDR_RAM) {
      return this.ram.readUInt16LE(offset % 0x0800);
    }
    if (offset < MEMORY_ADDR_PPU_REMAPPED) {
      return 0;
      //return mem.console.PPU.readRegister(0x2000 + address%8)
    }
    switch (offset) {
      case MEMORY_ADDR_PPU:
        return 0;
        //return mem.console.PPU.readRegister(address)
      case MEMORY_ADDR_APU:
        return 0;
        //return mem.console.PPU.readRegister(address)
      case MEMORY_ADDR_CONTROLLER1:
        return 0;
      case MEMORY_ADDR_CONTROLLER2:
        return 0;
    }
    if (offset >= MEMORY_ADDR_MAPPER) {
      // use mapper here
      return this.ram.readUInt16LE(offset);
    }
  }

  read16Bug(_offset) {
    return this.read16(_offset);
    // due to a bug in the 6502, the most significant byte of the address is always fetched
		// from the same page as the least significant byte
  }

  write8(offset, value) {
    if (offset < MEMORY_ADDR_RAM) {
      this.ram.writeUInt8(value & 0xff, offset);
    }
    if (offset < MEMORY_ADDR_PPU_REMAPPED) {
      return 0;
      //return mem.console.PPU.readRegister(0x2000 + address%8)
    }
    switch (offset) {
      case MEMORY_ADDR_PPU:
        return 0;
        //return mem.console.PPU.readRegister(address)
      case MEMORY_ADDR_APU:
        return 0;
        //return mem.console.PPU.readRegister(address)
      case MEMORY_ADDR_CONTROLLER1:
        return 0;
      case MEMORY_ADDR_CONTROLLER2:
        return 0;
    }
    if (offset >= MEMORY_ADDR_MAPPER) {
      // use mapper here
      this.ram.writeUInt8(value & 0xff, offset);
    }
  }

  write16(offset, value) {
    if (offset < MEMORY_ADDR_RAM) {
      this.ram.writeUInt16LE(value & 0xffff, offset);
    }
    if (offset < MEMORY_ADDR_PPU_REMAPPED) {
      return 0;
      //return mem.console.PPU.readRegister(0x2000 + address%8)
    }
    switch (offset) {
      case MEMORY_ADDR_PPU:
        return 0;
        //return mem.console.PPU.readRegister(address)
      case MEMORY_ADDR_APU:
        return 0;
        //return mem.console.PPU.readRegister(address)
      case MEMORY_ADDR_CONTROLLER1:
        return 0;
      case MEMORY_ADDR_CONTROLLER2:
        return 0;
    }
    if (offset >= MEMORY_ADDR_MAPPER) {
      // use mapper here
      this.ram.writeUInt16LE(value & 0xffff, offset);
    }
  }

}

module.exports = Memory;
