'use strict';

const debug = require('debug')('nesjs:mapper:type0');

/*

The generic designation NROM refers to the Nintendo cartridge boards NES-NROM-128, NES-NROM-256, their HVC counterparts,
and clone boards. The iNES format assigns mapper 0 to NROM.

PRG ROM size: 16 KiB for NROM-128, 32 KiB for NROM-256 (DIP-28 standard pinout)
PRG ROM bank size: Not bankswitched
PRG RAM: 2 or 4 KiB, not bankswitched, only in Family Basic (but most emulators provide 8)
CHR capacity: 8 KiB ROM (DIP-28 standard pinout) but most emulators support RAM
CHR bank size: Not bankswitched, see CNROM
Nametable mirroring: Solder pads select vertical or horizontal mirroring
Subject to bus conflicts: Yes, but irrelevant

All Banks are fixed,
CPU $6000-$7FFF: Family Basic only: PRG RAM, mirrored as necessary to fill entire 8 KiB window, write protectable
                 with an external switch
CPU $8000-$BFFF: First 16 KB of ROM.
CPU $C000-$FFFF: Last 16 KB of ROM (NROM-256) or mirror of $8000-$BFFF (NROM-128).

Registers:
None. This has normally no mapping capability whatsoever! Nevertheless, tile animation can be done by swapping between
pattern tables $0000 and $1000, using PPUCTRL bits 4-3 as a "poor man's CNROM".

*/

class Mapper0 {
  constructor(rom) {
    this.mapperType = rom.mapperType;
    const nrom128 = (rom.characterRomPages === 1);
    if (nrom128) {
			this.loadPRGBank( 0x8000, 0, 0x4000 );
			this.loadPRGBank( 0xc000, 0, 0x4000 );
		} else {
			this.loadPRGBank( 0x8000, 0, 0x8000 );
		}
  }

  read(offset) {
    debug('read at %d', offset);
  }

  write(offset, data) {
    debug('wrote %d at %d', offset, data);
  }
}

module.exports = Mapper0;
