'use strict';

const fileread = require('./file/read');
const debug = require('debug')('nesjs:ines');

const PRG_SIZE = 16384;
const HEADER_SIZE = 16;
const MINIMAL_FILESIZE = PRG_SIZE + HEADER_SIZE;
const MAGIC_HEADER = [0x4e, 0x45, 0x53, 0x1a];

module.exports.parseNesRom = function(data) {
  const romData = Buffer.from(data);

  if (!romData || romData.length < MINIMAL_FILESIZE) {
    throw new Error('INVALID_DATA');
  }

  const headerBuffer = Buffer.from(MAGIC_HEADER);
  if (headerBuffer.compare(romData, 0, 4, 0, 4)) {
    throw new Error('INVALID_HEADER');
  }

  // PRG (connected to the CPU). There is always at least one PRG ROM, 16KB each
  const programRomPages = romData.readUInt8(4);
  // CHR (connected to the PPU), 8KB each
  const characterRomPages = romData.readUInt8(5);
  const flags6 = romData.readUInt8(6);
  const flags7 = romData.readUInt8(7);

  return {
    programRomPages,
    characterRomPages,
    flags6,
    flags7
  };
};

module.exports.loadRom = function(fileName) {
  debug('loadRom:', fileName);
  return fileread.readFileAsBuffer(fileName)
    .then((data) => {
      return module.exports.parseNesRom(data);
    });
};
