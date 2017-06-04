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

class Ppu {
  constructor() {
    // current vram address (15 bit)
    this.registerV = 0;
    // temporary vram address (15 bit)
    this.registerT = 0;
    // fine x scroll (3 bit)
    this.registerX = 0;
    // write toggle (1 bit)
    this.registerW = 0;
    // even/odd frame flag (1 bit)
    this.registerF = 0;
    this.register = 0;

    // 0-340
    this.cycle = 0;
    // 0-261, 0-239=visible, 240=post, 241-260=vblank, 261=pre
    this.scanLine = 0;

    this.frame = 0;
    this.paletteData = Buffer.from(new Uint8Array(PALETTE_RAM_SIZE));
    this.ram = Buffer.from(new Uint8Array(RAM_SIZE));
    this.oamData = Buffer.from(new Uint8Array(OAM_RAM_SIZE));

    this.flagShowBackground = true;
    this.flagShowSprites = true;

    this.flagSpriteOverflow = 0;
    this.flagSpriteZeroHit = 0;

    this.nmiOccurred = false;
    this.nmiOutput = false;
    this.nmiPrevious = false;
	  this.nmiDelay = 0;
  }

  reset() {
    debug('reset');
    this.scanLine = 240;
    this.cycle = 340;
    this.frame = 0;
    this.writeControl(0);
    this.writeMask(0);
    this.writeOAMAddress(0);
    debug('%o', this);
  }

  nmiChange() {
    const nmi = this.nmiOutput && this.nmiOccurred;
    if (nmi && this.nmiPrevious) {
      // TODO: this fixes some games but the delay shouldn't have to be so
		    // long, so the timings are off somewhere
      this.nmiDelay = 15;
    }
    this.nmiPrevious = nmi;
  }

  // $2003: OAMADDR
  writeOAMAddress(flag) {
  	this.oamAddress = flag & 0xff;
  }

  // $2004: OAMDATA (read)
  readOAMData() {
  	return this.oamData.readUInt8(this.oamAddress);
  }

  // $2004: OAMDATA (write)
  writeOAMData(value) {
  	this.oamData.writeUInt8(value, this.oamAddress);
  	this.oamAddress++;
  }

  readStatus() {
  	let result = this.register & 0x1F;
  	result |= (this.flagSpriteOverflow << 5);
  	result |= (this.flagSpriteZeroHit << 6);
  	if (this.nmiOccurred) {
  		result |= (1 << 7);
  	}
  	this.nmiOccurred = false;
  	this.nmiChange();
  	this.registerW = 0;
  	return result;
  }

  // $2001: PPUMASK
  writeMask(flag) {
  	this.flagGrayscale = ((flag >>> 0) & 1) === 1;
  	this.flagShowLeftBackground = ((flag >>> 1) & 1) === 1;
  	this.flagShowLeftSprites = ((flag >>> 2) & 1) === 1;
  	this.flagShowBackground = ((flag >>> 3) & 1) === 1;
  	this.flagShowSprites = ((flag >>> 4) & 1) === 1;
  	this.flagRedTint = ((flag >>> 5) & 1) === 1;
  	this.flagGreenTint = ((flag >>> 6) & 1) === 1;
  	this.flagBlueTint = ((flag >>> 7) & 1) === 1;
  }

  // $2000: PPUCTRL
  writeControl(flag) {
    this.flagNameTable = ((flag >>> 0) & 3) === 1;
  	this.flagIncrement = ((flag >>> 2) & 1) === 1;
  	this.flagSpriteTable = ((flag >>> 3) & 1) === 1;
  	this.flagBackgroundTable = ((flag >>> 4) & 1) === 1;
  	this.flagSpriteSize = ((flag >>> 5) & 1) === 1;
  	this.flagMasterSlave = ((flag >>> 6) & 1) === 1;
  	this.nmiOutput = ((flag >>> 7) & 1) === 1;
  	this.nmiChange();
  	// t: ....BA.. ........ = d: ......BA
  	this.registerT = (this.registerT & 0xF3FF) | ((flag & 0x03) << 10);
  }

  registerMapper(mapper) {
    this.mapper = mapper;
  }

  _tick() {
    if (this.nmiDelay > 0) {
      this.nmiDelay--;
      if (this.nmiDelay === 0 && this.nmiOutput && this.nmiOccurred) {
        //TODO cpu.triggerNMI()
      }
    }

    const showBackgroundOrSprite = this.flagShowBackground || this.flagShowSprites;
    if (showBackgroundOrSprite) {
      if (this.registerF === 1 && this.scanLine === 261 && this.cycle === 239) {
        this.cycle = 0;
        this.scanLine = 0;
        this.frame++;
        this.registerF ^= 1;
        return;
      }
    }

    this.cycle++;
    if (this.cycle > 340) {
      this.cycle = 0;
      this.scanLine++;
      if (this.scanLine > 261) {
      	this.scanLine = 0;
      	this.frame++;
        debug('frame %d', this.frame);
      	this.registerF ^= 1;
      }
    }
  }

  executeCycle() {
    this._tick();
  }

  readRegister(memoryAddress16) {
    debug('readRegister: %d', memoryAddress16);
    switch(memoryAddress16) {
      case MEMORY_ADDR_PPUSTATUS:
    		return this.readStatus();
    	case MEMORY_ADDR_OAMDATA:
    		return this.oamData[this.oamAddress];
    	case MEMORY_ADDR_PPUDATA:
        //readData
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
