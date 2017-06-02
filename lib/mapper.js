'use strict';

const debug = require('debug')('nesjs:mapper');

/*

The address space reserved for the cartridge restricted games to 32KB of program memory and 8KB of character memory (pattern tables).
This was pretty limiting, so people got creative and implemented mappers.

A mapper is hardware on the cartridge itself that can perform bank switching to swap new program or character memory into the addressable memory space.
The program could control this bank switching by writing to specific addresses that pointed to the mapper hardware.

Different game cartridges implemented this bank switching in different ways, so there are dozens of different mappers.
Just as an emulator must emulate the NES hardware, it must also emulate the cartridge mappers. However, about 90% of all NES games use one of the six most common mappers.

*/
class Mapper {
  constructor(rom) {
    this.mapperType = rom.mapperType;
  }

  read(offset) {
    debug('read at %d', offset);
  }

  write(offset, data) {
    debug('wrote %d at %d', offset, data);
  }
}

module.exports = Mapper;
