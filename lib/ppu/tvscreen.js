'use strict';

const debug = require('debug')('nesjs:ppu:tvscreen');

const SCANLINE_VBLANK = 241;
const MAXIMAL_CYCLE_COUNT = 340;
const MAXIMAL_SCANLINE_COUNT = 261;

class TvScreen {
  constructor() {
    // 0-340
    this.cycle = 0;
    // NTSC VERSION: 0-261, 0-239=visible, 240=post, 241-260=vblank, 261=pre (PAL has 312 scanlines)
    this.scanLine = 0;
    this.frame = 0;
    // even/odd frame flag (1 bit)
    this.registerF = 0;
  }

  reset() {
    this.cycle = MAXIMAL_CYCLE_COUNT;
    this.scanLine = SCANLINE_VBLANK;
    this.frame = 0;
    this.registerF = 0;
  }

  nextFrame() {
    this.cycle = 0;
    this.scanLine = 0;
    this.frame++;
  }

  shouldTriggerVerticalBlank() {
    return this.scanLine === SCANLINE_VBLANK && this.cycle === 1;
  }

  getRenderingHints() {
    const preLine = this.scanLine === MAXIMAL_SCANLINE_COUNT;
    const visibleLine = this.scanLine < SCANLINE_VBLANK;

    const renderLine = preLine || visibleLine;
    const preFetchCycle = this.cycle >= 321 && this.cycle <= 336;
    const visibleCycle = this.cycle >= 1 && this.cycle <= 256;
    const fetchCycle = preFetchCycle || visibleCycle;
    return {
      shouldRenderCurrentPixel: visibleLine && visibleCycle,
      cycleMod8: this.cycle % 8,
      shouldCopyX: this.cycle === 257,
      shouldCopyY: preLine && this.cycle >= 280 && this.cycle <= 304,
      shouldIncrementX: fetchCycle && (this.cycle % 8) === 0,
      shouldIncrementY: this.cycle === 256,
      shouldClearVerticalBlank: preLine && this.cycle === 1,
      visibleLine,
      renderLine,
      fetchCycle
    };
  }

  executeCycle() {
    this.cycle++;
    if (this.cycle > MAXIMAL_CYCLE_COUNT) {
      this.cycle = 0;
      this.scanLine++;
      if (this.scanLine > MAXIMAL_SCANLINE_COUNT) {
      	this.scanLine = 0;
      	this.frame++;
        debug('frame %d', this.frame);
      	this.registerF ^= 1;
      }
    }
  }

}

module.exports = TvScreen;
