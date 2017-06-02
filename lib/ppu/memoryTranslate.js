'use strict';

const debug = require('debug')('nesjs:ppu:memoryTranslate.js');
const memoryMap = require('./memoryMap.js');

function buildReturnModel(offset, subsystem) {
  return { offset, subsystem };
}

module.exports.getAddress = function(offset) {
  const address = offset % 0x4000;
  if (address < memoryMap.MEMORY_OFFSET_VRAM.offset) {
    return buildReturnModel(address, 'mapper');
  }
  if (address < memoryMap.MEMORY_OFFSET_PALETTE.offset) {
    //TODO respect mirror mode
    return buildReturnModel(address, 'nametable');
  }
  if (address < memoryMap.MEMORY_OFFSET_END.offset) {
    return buildReturnModel(address % 32, 'palette');
  }
  debug('INVALID_OFFSET: %d', offset);
  return buildReturnModel(-1, 'invalid');
};

/*
// Mirroring Modes

const (
	MirrorHorizontal = 0
	MirrorVertical   = 1
	MirrorSingle0    = 2
	MirrorSingle1    = 3
	MirrorFour       = 4
)

var MirrorLookup = [...][4]uint16{
	{0, 0, 1, 1},
	{0, 1, 0, 1},
	{0, 0, 0, 0},
	{1, 1, 1, 1},
	{0, 1, 2, 3},
}

func MirrorAddress(mode byte, address uint16) uint16 {
	address = (address - 0x2000) % 0x1000
	table := address / 0x0400
	offset := address % 0x0400
	return 0x2000 + MirrorLookup[mode][table]*0x0400 + offset
}
*/
