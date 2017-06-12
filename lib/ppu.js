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

const SCANLINE_VBLANK = 241;

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
    this.registerW = false;
    // even/odd frame flag (1 bit)
    this.registerF = 0;
    this.register = 0;

    // 0-340
    this.cycle = 0;
    // 0-261, 0-239=visible, 240=post, 241-260=vblank, 261=pre
    this.scanLine = SCANLINE_VBLANK;

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

  // $2003: OAMADDR
  writeOAMAddress(address) {
  	this.oamAddress = address & OAM_RAM_SIZE;
  }

  // $2004: OAMDATA (read)
  readOAMData() {
  	return this.oamData.readUInt8(this.oamAddress);
  }

  // $2004: OAMDATA (write)
  writeOAMData(value) {
  	this.oamData.writeUInt8(value, this.oamAddress);
  	this.oamAddress = (this.oamAddress + 1) % OAM_RAM_SIZE;
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
  	this.registerW = false;
    debug('status returns %d', result);
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

  _tick() {
    if (this.nmiDelay > 0) {
      this.nmiDelay--;
      if (this.nmiDelay === 0 && this.nmiOutput && this.nmiOccurred) {
        debug('NMI IRQ');
        this.triggerNmiFunction();
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

  renderPixel() {
  }

  fetchNameTableByte() {
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
  }

  incrementY() {
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
    this._tick();

    //TODO remove true once code is implemented
    const renderingEnabled = this.flagShowBackground || this.flagShowSprites || true;
    const preLine = this.scanLine === 261;
    const visibleLine = this.scanLine < 240;

    const renderLine = preLine || visibleLine;
    const preFetchCycle = this.cycle >= 321 && this.cycle <= 336;
    const visibleCycle = this.cycle >= 1 && this.cycle <= 256;
    const fetchCycle = preFetchCycle || visibleCycle;

    // background logic
    if (renderingEnabled) {
  		if (visibleLine && visibleCycle) {
        //TODO
  			this.renderPixel();
  		}
  		if (renderLine && fetchCycle) {
  			this.tileData <<= 4;
  			switch (this.cycle % 8) {
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
    	if (preLine && this.cycle >= 280 && this.cycle <= 304) {
    		this.copyY();
    	}

      if (renderLine) {
  			if (fetchCycle && (this.cycle % 8) === 0) {
          //TODO
  				this.incrementX();
  			}
  			if (this.cycle === 256) {
          //TODO
  				this.incrementY();
  			}
  			if (this.cycle === 257) {
  				this.copyX();
  			}
    	}

    	// sprite logic
    	if (renderingEnabled && this.cycle === 257) {
  			if (visibleLine) {
          //TODO
  				this.evaluateSprites();
  			} else {
  				this.spriteCount = 0;
  			}
    	}

    	// vblank logic
    	if (this.scanLine === SCANLINE_VBLANK && this.cycle === 1) {
    		this.setVerticalBlank();
    	}
    	if (preLine && this.cycle === 1) {
    		this.clearVerticalBlank();
    		this.flagSpriteZeroHit = 0;
    		this.flagSpriteOverflow = 0;
    	}
    }
  }

  readRegister(memoryAddress16) {
    debug('readRegister: %d', memoryAddress16);
    switch(memoryAddress16) {
      case MEMORY_ADDR_PPUSTATUS:
        //TODO
        return this.readStatus();
    	case MEMORY_ADDR_OAMDATA:
    		return this.oamData[this.oamAddress];
    	case MEMORY_ADDR_PPUDATA:
        //readData
    		return 0;
    }
    return 0;
  }

  writeScroll(value8) {
  	if (!this.registerW) {
  		// t: ........ ...HGFED = d: HGFED...
  		// x:               CBA = d: .....CBA
  		// w:                   = 1
      //TODO bses says       status.taddr = (status.taddr & 0x7fe0) | (data >> 3);
  		this.registerT = (this.registerT & 0xFFE0) | ((value8) >>> 3);
  		this.registerX = value8 & 0x07;
  		this.registerW = true;
  	} else {
  		// t: .CBA..HG FED..... = d: HGFEDCBA
  		// w:                   = 0
      //TODO bsnes says       status.taddr = (status.taddr & 0x0c1f) | ((data & 0x07) << 12) | ((data >> 3) << 5);
  		this.registerT = (this.registerT & 0x8FFF) | ((value8 & 0x07) << 12);
  		this.registerT = (this.registerT & 0xFC1F) | ((value8 & 0xF8) << 2);
  		this.registerW = false;
  	}
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
        break;
      case MEMORY_ADDR_PPUDATA:
        break;
      case MEMORY_ADDR_OAMDMA:
        break;
    }
    debug('INVALID WRITE REGISTER: %d, value: %d', memoryAddress16, value8);
    return 0;
  }

  readMemory(offset) {
    const address = memoryTranslate.getAddress(offset);
    debug('MEM_READ_NOT_IMPLEMENTED %o', address);
    switch (address.subsystem) {
      case 'mapper':
        return this.mapper.read(address);
      case 'nametable':
        return 0;
      case 'palette':
        return 0;
    }
    debug('INVALID READ MEMORY: %d', offset);
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
    debug('INVALID WRITE MEMORY: %d, value: %d', offset, data);
  }

}

module.exports = Ppu;
