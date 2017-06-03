'use strict';

const debug = require('debug')('nesjs:mapper:type0');
const memoryTranslate = require('./memoryTranslate');

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
    this.cartridge = rom.metaData;
    this.characterRom = rom.data.characterRom;
    this.programRom = rom.data.programRom;
    this.ram = Buffer.from(new Uint8Array(this.cartridge.ramSize));

/*    const nrom128 = (this.cartridge.characterRomPages === 1);
    if (nrom128) {
			this.loadPRGBank( 0x8000, 0, 0x4000 );
			this.loadPRGBank( 0xc000, 0, 0x4000 );
		} else {
			this.loadPRGBank( 0x8000, 0, 0x8000 );
		}*/
  }

// from memory, reads are allways > 0x6000
// reads from ppu have an offset < $2000 and targets the CHR ROM

  read(offset) {
    debug('read at %d', offset);
    const address = memoryTranslate.getAddress(offset);
    switch (address.subsystem) {
      case 'chr':
        return this.characterRom[address.offset];
      case 'prg':
        return this.programRom[address.offset];
      case 'ram':
        return this.ram[address.offset];
    }
  }

  write(offset, data) {
    debug('write %d at %d', offset, data);
    const address = memoryTranslate.getAddress(offset);
    switch (address.subsystem) {
      case 'chr':
        this.characterRom[address.offset] = data & 0xff;
        break;
      case 'prg':
        this.programRom[address.offset] = data & 0xff;
        break;
      case 'ram':
        this.ram[address.offset] = data & 0xff;
        break;
    }
  }
}

module.exports = Mapper0;
