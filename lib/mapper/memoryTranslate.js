'use strict';

const debug = require('debug')('nesjs:mapper:memoryTranslate');

const MEMORY_OFFSET_CHR = 0x2000;
const MEMORY_OFFSET_RAM = 0x6000;
const MEMORY_OFFSET_PRG = 0x8000;

function buildReturnModel(offset, subsystem) {
  return { offset, subsystem };
}

/*
All Banks are fixed,
CPU $6000-$7FFF: Family Basic only: PRG RAM, mirrored as necessary to fill entire 8 KiB window, write protectable
                 with an external switch
CPU $8000-$BFFF: First 16 KB of ROM.
CPU $C000-$FFFF: Last 16 KB of ROM (NROM-256) or mirror of $8000-$BFFF (NROM-128).
*/
module.exports.getAddress = function(offset) {
  if (offset < MEMORY_OFFSET_CHR) {
    return buildReturnModel(offset, 'chr');
  }
  if (offset >= MEMORY_OFFSET_PRG) {
    //TODO OFFSET IS WRONG
    return buildReturnModel(offset, 'prg');
  }
  if (offset >= MEMORY_OFFSET_RAM) {
    return buildReturnModel(offset - MEMORY_OFFSET_RAM, 'ram');
  }
  debug('INVALID_OFFSET: %d', offset);
  return buildReturnModel(-1, 'invalid');
};
