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

const MEMORY_OFFSET_CHR = 0x2000;
const MEMORY_OFFSET_RAM = 0x6000;
const MEMORY_OFFSET_PRG = 0x8000;

class Mapper0 {

  constructor(rom) {
    this.cartridge = rom.metaData;
    this.characterRom = rom.data.characterRom;
    this.programRom = rom.data.programRom;
    this.ram = Buffer.from(new Uint8Array(this.cartridge.ramSize));
    this.oneProgramRomBuffer = rom.metaData.programRomPages === 1 ;
  }

  _buildReturnModel(offset, subsystem) {
    return { offset, subsystem };
  }

  _getAddress(offset) {
    if (offset < MEMORY_OFFSET_CHR) {
      return this._buildReturnModel(offset, 'chr');
    }
    if (offset >= MEMORY_OFFSET_PRG) {
      if (this.oneProgramRomBuffer) {
        const cappedOffset = (offset - MEMORY_OFFSET_PRG) % 0x4000;
        return this._buildReturnModel(cappedOffset, 'prg');
      }
      return this._buildReturnModel(offset - MEMORY_OFFSET_PRG, 'prg');
    }
    if (offset >= MEMORY_OFFSET_RAM) {
      return this._buildReturnModel(offset - MEMORY_OFFSET_RAM, 'ram');
    }
    debug('INVALID_OFFSET: %d', offset);
    return this._buildReturnModel(-1, 'invalid');
  }

  _readPrg(offset, busSize) {
    debug('PRG read, offset %d, length %d', offset, this.programRom.length);
    if (busSize === 8) {
      return this.programRom.readUInt8(offset);
    }
    return this.programRom.readUInt16LE(offset);
  }

  _readRam(offset, busSize) {
    debug('MEM read, offset %d, length %d', offset, this.programRom.length);
    if (busSize === 8) {
      return this.ram.readUInt8(offset);
    }
    return this.ram.readUInt16LE(offset);
  }

  read(offset, busSize) {
    const address = this._getAddress(offset);
    debug('read at %d, %o, size: %d', offset, address, busSize);
    switch (address.subsystem) {
      case 'chr':
        return this.characterRom[address.offset];
      case 'prg':
        return this._readPrg(address.offset, busSize);
      case 'ram':
        return this._readRam(address.offset, busSize);
    }
  }

  _writePrg(offset, value, busSize) {
    debug('PRG write, offset %d, length %d', offset, this.programRom.length);
    if (busSize === 8) {
      return this.programRom.writeUInt8(value, offset);
    }
    return this.programRom.writeUInt16LE(value, offset);
  }

  _writeRam(offset, value, busSize) {
    debug('MEM write, offset %d, length %d', offset, this.programRom.length);
    if (busSize === 8) {
      return this.ram.writeUInt8(value, offset);
    }
    return this.ram.writeUInt16LE(value, offset);
  }

  write(offset, value, busSize) {
    debug('write %d at %d, size: %d', offset, value, busSize);
    const address = this._getAddress(offset);
    switch (address.subsystem) {
      case 'chr':
        this.characterRom[address.offset] = value & 0xff;
        break;
      case 'prg':
        this._writePrg(address.offset, value, busSize);
        break;
      case 'ram':
        this._writeRam(address.offset, value, busSize);
        break;
    }
  }
}

module.exports = Mapper0;
