'use strict';

const debug = require('debug')('nesjs:ppu');

// Picture Processing Unit

/*

The PPU generated the video output for the NES. Unlike the CPU, the PPU chip was specially-built for the NES.
The PPU ran at 3x the frequency of the CPU. Each cycle of the PPU output one pixel while rendering.

The PPU could render a background layer and up to 64 sprites. Sprites could be 8x8 or 8x16 pixels.
The background could be scrolled in both the X and Y axis. It supported “fine” scrolling (one pixel at a time). This was kind of a big deal back then.

*/
const MEMORY_SIZE = 16384;

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
    this.ram = Buffer.from(new Uint8Array(MEMORY_SIZE));
  }

  reset() {
    debug('reset');
    this.cycle = 340;
    this.frame = 0;
    this.scanLine = 240;
    debug('%o', this);
  }

  readRegister(memoryAddress, busSize) {
    debug('readRegister: %d, busSize: %d', memoryAddress, busSize);
    return 0;
  }

  writeRegister(memoryAddress, busSize) {
    debug('writeRegister: %d, busSize: %d', memoryAddress, busSize);
    return 0;
  }
}

module.exports = Ppu;
