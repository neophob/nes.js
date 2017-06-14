'use strict';

const debug = require('debug')('nesjs:ppu');
const memoryTranslate = require('./ppu/memoryTranslate');
const TV = require('./ppu/tvscreen');

/*

Picture Processing Unit

The PPU generated the video output for the NES. Unlike the CPU, the PPU chip was specially-built for the NES.
The PPU ran at 3x the frequency of the CPU. Each cycle of the PPU output one pixel while rendering.

The PPU could render a background layer and up to 64 sprites. Sprites could be 8x8 or 8x16 pixels.
The background could be scrolled in both the X and Y axis. It supported “fine” scrolling (one pixel at a time). This was kind of a big deal back then.

*/

// the address space is 16k, but there is only 2kb vram
const RAM_SIZE = 2048*8;
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

//screen resolution is 256*240

class Ppu {
  //The PPU is big endian
  constructor() {
    // current vram address (15 bit)
    this.registerV = 0;
    // temporary vram address (15 bit)
    this.registerT = 0;
    // fine x scroll (3 bit)
    this.registerX = 0;
    // write toggle (1 bit)
    this.registerW = false;
    this.register = 0;

    this.bufferedData = 0;
    this.paletteData = Buffer.from(new Uint8Array(PALETTE_RAM_SIZE));
    this.vramData = Buffer.from(new Uint8Array(RAM_SIZE));
    this.oamData = Buffer.from(new Uint8Array(OAM_RAM_SIZE));

    this.flagShowBackground = true;
    this.flagShowSprites = true;

    this.flagSpriteOverflow = 0;
    this.flagSpriteZeroHit = 0;

    this.nmiOccurred = false;
    this.nmiOutput = false;
    this.nmiPrevious = false;
	  this.nmiDelay = 0;
    this.tv = new TV();
  }

  reset() {
    debug('reset');
    this.tv.reset();
    this.writeControl(0);
    this.writeMask(0);
    this.writeOAMAddress(0);
    debug('%o', this);
  }

  //TODO remove me!
  registerMapper(mapper) {
    this.mapper = mapper;
  }

  registerTriggerNmiFunction(triggerNmiFunction) {
    this.triggerNmiFunction = triggerNmiFunction;
  }

  nmiChange() {
    const nmi = this.nmiOutput && this.nmiOccurred;
    if (nmi && !this.nmiPrevious) {
      // TODO: this fixes some games but the delay shouldn't have to be so
		    // long, so the timings are off somewhere
      this.nmiDelay = 15;
    }
    this.nmiPrevious = nmi;
  }

  readPalette(address) {
  	if (address >= 16 && address%4 === 0) {
  		address -= 16;
  	}
  	return this.paletteData.readUInt8(address);
  }

  writePalette(address, value) {
  	if (address >= 16 && address%4 === 0) {
  		address -= 16;
  	}
  	this.paletteData.writeUInt8(value, address);
  }

  writeControl(flag) {
    // $2000: PPUCTRL
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

  readStatus() {
    // $2002: PPUSTATUS
  	let result = this.register & 0x1F;
  	result |= (this.flagSpriteOverflow << 5);
  	result |= (this.flagSpriteZeroHit << 6);
  	if (this.nmiOccurred) {
  		result |= (1 << 7);
  	}
  	this.nmiOccurred = false;
  	this.nmiChange();
  	this.registerW = false;
    debug('status returns %d', result);
  	return result;
  }

  writeOAMAddress(address) {
    // $2003: OAMADDR
  	this.oamAddress = address & OAM_RAM_SIZE;
  }

  readOAMData() {
    // $2004: OAMDATA (read)
  	return this.oamData.readUInt8(this.oamAddress);
  }

  writeOAMData(value) {
    // $2004: OAMDATA (write)
  	this.oamData.writeUInt8(value, this.oamAddress);
  	this.oamAddress = (this.oamAddress + 1) % OAM_RAM_SIZE;
  }

  writeScroll(value) {
    // $2005: PPUSCROLL
  	if (!this.registerW) {
  		// t: ........ ...HGFED = d: HGFED...
  		// x:               CBA = d: .....CBA
  		// w:                   = 1
  		this.registerT = (this.registerT & 0xFFE0) | (value >>> 3);
  		this.registerX = value & 0x07;
  		this.registerW = true;
  	} else {
  		// t: .CBA..HG FED..... = d: HGFEDCBA
  		// w:                   = 0
  		this.registerT = (this.registerT & 0x8FFF) | ((value & 0x07) << 12);
  		this.registerT = (this.registerT & 0xFC1F) | ((value & 0xF8) << 2);
  		this.registerW = false;
  	}
  }

  writeAddress(value) {
    // $2006: PPUADDR
    if (!this.registerW) {
  		// t: ..FEDCBA ........ = d: ..FEDCBA
  		// t: .X...... ........ = 0
  		// w:                   = 1
  		this.registerT = (this.registerT & 0x80FF) | ((value & 0x3F) << 8);
      this.registerW = true;
  	} else {
  		// t: ........ HGFEDCBA = d: HGFEDCBA
  		// v                    = t
  		// w:                   = 0
  		this.registerT = (this.registerT & 0xFF00) | value;
  		this.registerV = this.registerT;
      this.registerW = false;
  	}
  }

  readPpuData() {
    // $2007: PPUDATA (read)
  	let result = this.readMemory(this.registerV);
  	if (this.registerV % 0x4000 < 0x3F00) {
      // emulate buffered reads
      const oldBufferedValue = this.bufferedData;
      this.bufferedData = result;
  		result = oldBufferedValue;
  	} else {
  		this.bufferedData = this.readMemory(this.registerV - 0x1000);
  	}
  	// increment address
  	if (this.flagIncrement === 0) {
  		this.registerV += 1;
  	} else {
  		this.registerV += 32;
  	}
  	return result;
  }

  writePpuData(value) {
    // $2007: PPUDATA (write)
    this.writeMemory(this.registerV, value);
    if (this.flagIncrement === 0) {
      this.registerV += 1;
  	} else {
  		this.registerV += 32;
  	}
  }

  renderPixel() {
  }

  fetchNameTableByte() {
    const v = this.registerV;
    const address = 0x2000 | (v & 0x0FFF);
    this.nameTableByte = this.readMemory(address);
  }

  fetchLowTileByte() {
  }

  fetchHighTileByte() {
  }

  storeTileData() {
  }

  copyX() {
    this.registerV = (this.registerV & 0xFBE0) | (this.registerT & 0x041F);
  }

  copyY() {
    this.registerV = (this.registerV & 0x841F) | (this.registerT & 0x7BE0);
  }

  incrementX() {
    // increment hori(v)
  	// if coarse X == 31
  	if (this.registerV & 0x001F === 31) {
  		// coarse X = 0
  		this.registerV &= 0xFFE0;
  		// switch horizontal nametable
  		this.registerV ^= 0x0400;
  	} else {
  		// increment coarse X
  		this.registerV++;
  	}
  }

  incrementY() {
    // increment vert(v)
  	// if fine Y < 7
  	if (this.registerV & 0x7000 !== 0x7000) {
  		// increment fine Y
  		this.registerV += 0x1000;
  	} else {
  		// fine Y = 0
  		this.registerV &= 0x8FFF;
  		// let y = coarse Y
  		let y = (this.registerV & 0x03E0) >>> 5;
  		if (y === 29) {
  			// coarse Y = 0
  			y = 0;
  			// switch vertical nametable
  			this.registerV ^= 0x0800;
  		} else if (y === 31) {
  			// coarse Y = 0, nametable not switched
  			y = 0;
  		} else {
  			// increment coarse Y
  			y++;
  		}
  		// put coarse Y back into v
  		this.registerV = (this.registerV & 0xFC1F) | (y << 5);
  	}
  }

  evaluateSprites(){
  }

  setVerticalBlank() {
    debug('setVerticalBlank');
    //TODO switch image buffers
    this.nmiOccurred = true;
    this.nmiChange();
  }

  clearVerticalBlank() {
    debug('clearVerticalBlank');
    this.nmiOccurred = false;
    this.nmiChange();
  }

  fetchAttributeTableByte() {
  }

  executeCycle() {
    if (this.nmiDelay > 0) {
      this.nmiDelay--;
      if (this.nmiDelay === 0 && this.nmiOutput && this.nmiOccurred) {
        debug('NMI IRQ');
        this.triggerNmiFunction();
      }
    }

    const showBackgroundOrSprite = this.flagShowBackground || this.flagShowSprites;
    if (showBackgroundOrSprite) {
      //TODO move to tv
/*      if (this.registerF === 1 && this.scanLine === 261 && this.cycle === 239) {
        this.tv.nextFrame();
        this.registerF ^= 1;
        return;
      }*/
    }

    this.tv.executeCycle();

    //TODO remove true once code is implemented
    const renderingEnabled = this.flagShowBackground || this.flagShowSprites || true;
    // background logic
    if (!renderingEnabled) {
      return;
    }

    const renderingHints = this.tv.getRenderingHints();
		if (renderingHints.shouldRenderCurrentPixel) {
      //TODO implement
			this.renderPixel();
		}
    //TODO rename
		if (renderingHints.renderLine && renderingHints.fetchCycle) {
			this.tileData <<= 4;
			switch (renderingHints.cycleMod8) {
			case 1:
        //TODO
				this.fetchNameTableByte();
        break;
			case 3:
        //TODO
				this.fetchAttributeTableByte();
        break;
			case 5:
        //TODO
				this.fetchLowTileByte();
        break;
			case 7:
        //TODO
				this.fetchHighTileByte();
        break;
			case 0:
        //TODO
				this.storeTileData();
        break;
			}
		}
  	if (renderingHints.shouldCopyY) {
  		this.copyY();
  	}

    if (renderingHints.renderLine) {
			if (renderingHints.shouldIncrementX) {
        //TODO
				this.incrementX();
			}
			if (renderingHints.shouldIncrementY) {
        //TODO
				this.incrementY();
			}
			if (renderingHints.shouldCopyX) {
				this.copyX();
			}
  	}

  	// sprite logic
    //shouldcopyx === cycle 257
  	if (renderingHints.shouldCopyX) {
			if (renderingHints.visibleLine) {
        //TODO
				this.evaluateSprites();
			} else {
				this.spriteCount = 0;
			}
  	}

  	// vblank logic
  	if (this.tv.shouldTriggerVerticalBlank()) {
  		this.setVerticalBlank();
  	}

  	if (renderingHints.shouldClearVerticalBlank) {
  		this.clearVerticalBlank();
  		this.flagSpriteZeroHit = 0;
  		this.flagSpriteOverflow = 0;
  	}
  }

  readRegister(memoryAddress16) {
    debug('readRegister: %d', memoryAddress16);
    switch(memoryAddress16) {
      case MEMORY_ADDR_PPUSTATUS:
        return this.readStatus();
    	case MEMORY_ADDR_OAMDATA:
    		return this.readOAMData();
    	case MEMORY_ADDR_PPUDATA:
    		return this.readPpuData();
    }
    return 0;
  }

  writeRegister(memoryAddress16, value8) {
    debug('writeRegister: %d, value: %d', memoryAddress16, value8);
    this.register = value8;
    switch (memoryAddress16) {
      case MEMORY_ADDR_PPUCTRL:
        this.writeControl(value8);
        break;
      case MEMORY_ADDR_PPUMASK:
        this.writeMask(value8);
        break;
      case MEMORY_ADDR_OAMADDR:
        this.writeOAMAddress(value8);
        break;
      case MEMORY_ADDR_OAMDATA:
        this.writeOAMData(value8);
        break;
      case MEMORY_ADDR_PPUSCROLL:
        this.writeScroll(value8);
        break;
      case MEMORY_ADDR_PPUADDR:
        this.writeAddress(value8);
        break;
      case MEMORY_ADDR_PPUDATA:
        this.writePpuData(value8);
        break;
      case MEMORY_ADDR_OAMDMA:
        //ppu.writeDMA(value)
        break;
      default:
        debug('INVALID WRITE REGISTER: %d, value: %d', memoryAddress16, value8);
    }
    return 0;
  }
/*
nesjs:ppu MEM_WRITE_NOT_IMPLEMENTED { offset: 15776, subsystem: 'nametable' } +0ms
  nesjs:ppu INVALID WRITE MEMORY: 32160, value: 0 +1ms
  nesjs:ppu writeRegister: 8199, value: 108 +0ms
  nesjs:ppu MEM_WRITE_NOT_IMPLEMENTED { offset: 15808, subsystem: 'nametable' } +0ms
  nesjs:ppu INVALID WRITE MEMORY: 32192, value: 108 +0ms
  nesjs:ppu writeRegister: 8199, value: 105 +0ms
  nesjs:ppu MEM_WRITE_NOT_IMPLEMENTED { offset: 15840, subsystem: 'nametable' } +0ms
  nesjs:ppu INVALID WRITE MEMORY: 32224, value: 105 +0ms
  nesjs:ppu writeRegister: 8199, value: 116 +0ms

  nesjs:ppu INVALID WRITE MEMORY: 12288, value: 0 +0ms

  */
  readMemory(offset) {
    const address = memoryTranslate.getAddress(offset, this.mapper.mirrorType);
    switch (address.subsystem) {
      case 'mapper':
        return this.mapper.read(address.offset);
      case 'vram':
        return this.vramData.readUInt8(address.offset);
      case 'palette':
        return this.paletteData.readUInt8(address.offset);
    }
    debug('INVALID READ MEMORY: %d %o', offset, address);
  }

  writeMemory(offset, data) {
    const address = memoryTranslate.getAddress(offset, this.mapper.mirrorType);
    switch (address.subsystem) {
      case 'mapper':
        return this.mapper.write(address.offset, data);
      case 'vram':
        return this.vramData.writeUInt8(data, address.offset);
      case 'palette':
        return this.paletteData.writeUInt8(data, address.offset);
    }
    debug('INVALID WRITE MEMORY: %d, value: %d', offset, data);
  }

}

module.exports = Ppu;
