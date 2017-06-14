'use strict';

const debug = require('debug')('nesjs:ppu:memoryTranslate.js');

/*

The PPU addresses a 16kB space, $0000-3FFF, completely separate from the CPU's address bus. It is either directly
accessed by the PPU itself, or via the CPU with memory mapped registers at $2006 and $2007.

$0000-1FFF is normally mapped by the cartridge to a CHR-ROM or CHR-RAM, often with a bank switching mechanism.
  $0000-$0FFF	$1000	Pattern table 0 / Tile Set #0
  $1000-$1FFF	$1000	Pattern Table 1 / Tile Set #1
$2000-2FFF is normally mapped to the 2kB NES internal VRAM, providing 2 nametables with a mirroring configuration
           controlled by the cartridge, but it can be partly or fully remapped to RAM on the cartridge, allowing up
           to 4 simultaneous nametables.
  $2000-$23FF	$0400	Nametable 0
  $2400-$27FF	$0400	Nametable 1
  $2800-$2BFF	$0400	Nametable 2
  $2C00-$2FFF	$0400	Nametable 3
$3000-3EFF is usually a mirror of the 2kB region from $2000-2EFF. The PPU does not render from this address range,
           so this space has negligible utility.
$3F00-3FFF is not configurable, always mapped to the internal palette control.
  $3F00-$3F1F	$0020	Palette RAM indexes
  $3F20-$3FFF	$00E0	Mirrors of $3F00-$3F1F

*/

const PPU_MEMORY_MAP = {
  'MEMORY_OFFSET_CHR_REROUTE_MAPPER': { offset: 0x0000, length: 0x1fff },
  'MEMORY_OFFSET_VRAM':               { offset: 0x2000, length: 0x0fff },
  'MEMORY_OFFSET_VRAM_MIRROR':        { offset: 0x3000, length: 0x0eff },
  'MEMORY_OFFSET_PALETTE':            { offset: 0x3f00, length: 0x00ff },
  'MEMORY_OFFSET_END':                { offset: 0x4000, length: 0x0000 },
};

const MirrorLookup = [
	0, 0, 1, 1,
	0, 1, 0, 1,
	0, 0, 0, 0,
	1, 1, 1, 1,
	0, 1, 2, 3,
];

function getMirrorAddress(mode, _address) {
	const address = (_address - 0x2000) % 0x1000;
	const table = parseInt(address / 0x0400);
	const offset = address % 0x0400;
	return MirrorLookup[mode * 4 + table] * 0x0400 + offset;
}

function buildReturnModel(offset, subsystem) {
  return { offset, subsystem };
}

module.exports.getAddress = function(offset, mirrorType) {
  const address = offset % 0x4000;
  if (address < PPU_MEMORY_MAP.MEMORY_OFFSET_VRAM.offset) {
    return buildReturnModel(address, 'mapper');
  }
  if (address < PPU_MEMORY_MAP.MEMORY_OFFSET_PALETTE.offset) {
    // remap vram access, depending on the mapper
    const mirrorAddress = getMirrorAddress(mirrorType, address);
    debug('mirror read from %d to %d', address, mirrorAddress);
    return buildReturnModel(mirrorAddress, 'vram');
  }
  if (address < PPU_MEMORY_MAP.MEMORY_OFFSET_END.offset) {
    return buildReturnModel(address % 32, 'palette');
  }
  debug('INVALID_OFFSET: %d', offset);
  return buildReturnModel(-1, 'invalid');
};
