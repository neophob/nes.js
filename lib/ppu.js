'use strict';

const debug = require('debug')('nesjs:ppu');
const memoryTranslate = require('./ppu/memoryTranslate');

/*

Picture Processing Unit

The PPU generated the video output for the NES. Unlike the CPU, the PPU chip was specially-built for the NES.
The PPU ran at 3x the frequency of the CPU. Each cycle of the PPU output one pixel while rendering.

The PPU could render a background layer and up to 64 sprites. Sprites could be 8x8 or 8x16 pixels.
The background could be scrolled in both the X and Y axis. It supported “fine” scrolling (one pixel at a time). This was kind of a big deal back then.

*/
const RAM_SIZE = 16384;
const OAM_RAM_SIZE = 256;
const PALETTE_RAM_SIZE = 32;

const MEMORY_ADDR_PPUCTRL = 0x2000;
const MEMORY_ADDR_PPUMASK = 0x2001;

// vblank (V), sprite 0 hit (S), sprite overflow (O), read resets write pair for $2005/2006
const MEMORY_ADDR_PPUSTATUS = 0x2002;
const MEMORY_ADDR_OAMADDR = 0x2003;
// OAM data read/write
const MEMORY_ADDR_OAMDATA = 0x2004;
const MEMORY_ADDR_PPUSCROLL = 0x2005;
const MEMORY_ADDR_PPUADDR = 0x2006;
// PPU data read/write
const MEMORY_ADDR_PPUDATA = 0x2007;
const MEMORY_ADDR_OAMDMA = 0x4014;
var a=0;

class Ppu {
  constructor() {
    this.registerV = 0;
    this.registerT = 0;
    this.registerX = 0;
    this.registerW = 0;
    this.registerF = 0;
    this.cycle = 0;
    this.frame = 0;
    this.scanLine = 0;
    this.paletteData = Buffer.from(new Uint8Array(PALETTE_RAM_SIZE));
    this.ram = Buffer.from(new Uint8Array(RAM_SIZE));
    this.objectAttributeMemory = Buffer.from(new Uint8Array(OAM_RAM_SIZE));
  }

  reset() {
    debug('reset');
    this.cycle = 340;
    this.frame = 0;
    this.scanLine = 240;
    debug('%o', this);
  }

  registerMapper(mapper) {
    this.mapper = mapper;
  }

  executeCycle() {
    this.cycle++;
  }

  readStatus() {

  }

  readRegister(memoryAddress16) {
    debug('readRegister: %d', memoryAddress16);
    switch(memoryAddress16) {
      case MEMORY_ADDR_PPUSTATUS:
    		return a++;
    	case MEMORY_ADDR_OAMDATA:
    		return 0;
    	case MEMORY_ADDR_PPUDATA:
    		return 0;
    }
    return 0;
  }

  writeRegister(memoryAddress16, value8) {
    debug('writeRegister: %d, value: %d', memoryAddress16, value8);
    switch (memoryAddress16) {
      case MEMORY_ADDR_PPUCTRL:
        break;
      case MEMORY_ADDR_PPUMASK:
        break;
      case MEMORY_ADDR_OAMADDR:
        break;
      case MEMORY_ADDR_OAMDATA:
        break;
      case MEMORY_ADDR_PPUSCROLL:
        break;
      case MEMORY_ADDR_PPUADDR:
        break;
      case MEMORY_ADDR_PPUDATA:
        break;
      case MEMORY_ADDR_OAMDMA:
        break;
    }
    return 0;
  }

  readMemory(offset) {
    const address = memoryTranslate.getAddress(offset);
    debug('MEM_READ_NOT_IMPLEMENTED %o', address);
    switch (address.subsystem) {
      case 'mapper':
        return this.mapper.read(address);
      case 'nametable':
        break;
      case 'palette':
        break;
    }
  }

  writeMemory(offset, data) {
    const address = memoryTranslate.getAddress(offset);
    debug('MEM_WRITE_NOT_IMPLEMENTED %o', address);
    switch (address.subsystem) {
      case 'mapper':
        return this.mapper.write(address, data);
      case 'nametable':
        break;
      case 'palette':
        break;
    }
  }

}

module.exports = Ppu;
