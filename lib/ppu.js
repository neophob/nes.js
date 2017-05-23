'use strict';

// Picture Processing Unit

/*

The PPU generated the video output for the NES. Unlike the CPU, the PPU chip was specially-built for the NES.
The PPU ran at 3x the frequency of the CPU. Each cycle of the PPU output one pixel while rendering.

The PPU could render a background layer and up to 64 sprites. Sprites could be 8x8 or 8x16 pixels.
The background could be scrolled in both the X and Y axis. It supported “fine” scrolling (one pixel at a time). This was kind of a big deal back then.

*/

class Ppu {
  constructor() {
  }

  foo() {
  }
}

module.exports = Ppu;
