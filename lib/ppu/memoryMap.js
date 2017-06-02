'use strict';

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

module.exports = PPU_MEMORY_MAP;
