'use strict';

const debug = require('debug')('nesjs:ines');
const fileread = require('./file/read');

// PRG is connected to the CPU
const PRG_ROM_SIZE = 16384;
const PRG_RAM_SIZE = 8192;
// CHR is connected to the PPU
const CHR_ROM_SIZE = PRG_RAM_SIZE;
const HEADER_SIZE = 16;
const TRAINER_SIZE = 512;
const MINIMAL_FILESIZE = PRG_ROM_SIZE + HEADER_SIZE;
const MAGIC_HEADER = 0x4e45531a;

function getMapperType(flag6, flag7) {
  const mapperLow = flag6 >>> 4;
  const mapperHigh = flag7 >>> 4;
  return mapperLow | (mapperHigh << 4);
}

function getMirrorType(flag6) {
  const mirror = flag6 & 1;
  const ignoreMirrorControl = (flag6 >>> 3) & 1;
  return mirror | (ignoreMirrorControl << 2);
}

function getRomMetaData(romData){
  debug('getRomMetaData');
  // PRG (connected to the CPU). There is always at least one PRG ROM, 16KB each
  const programRomPages = romData.readUInt8(4);
  // CHR (connected to the PPU), 8KB each
  const characterRomPages = romData.readUInt8(5);
  const flag6 = romData.readUInt8(6);
  const flag7 = romData.readUInt8(7);
  // PRG ROM, 8KB each, Value 0 infers 8 KB for compatibility
  const programRamPages = romData.readUInt8(8) || 1;
  const ramSize = programRamPages * PRG_RAM_SIZE;
  // flag 9 and 10 seems to be obsolete

  const mapperType = getMapperType(flag6, flag7);
  const mirrorType = getMirrorType(flag6);
  const batteryBackedPrgRam = ((flag6 >>> 1) & 1) === 1;
  const trainerIncluded = ((flag6 >>> 2) & 1) === 1;

  return {
    programRomPages,
    programRomSize: PRG_ROM_SIZE * programRomPages,
    characterRomPages,
    characterRomSize: CHR_ROM_SIZE * characterRomPages,
    programRamPages,
    ramSize,
    mapperType,
    mirrorType,
    batteryBackedPrgRam,
    trainerIncluded
  };
}

function getRomData(romData, metaData) {
  debug('getRomData %d', metaData.programRomSize);
  const programRom = new Uint8Array(metaData.programRomSize);
  let sourceOffset = HEADER_SIZE + (TRAINER_SIZE * metaData.trainerIncluded);
  debug('PRG ROM Offset: %d, length: %d', sourceOffset, programRom.length);
  romData.copy(programRom, 0, sourceOffset, sourceOffset + programRom.length);

  let characterRom;
  if (metaData.characterRomSize) {
    characterRom = new Uint8Array(metaData.characterRomSize);
    sourceOffset += metaData.programRomSize;
    debug('CHR ROM Offset', sourceOffset);
    romData.copy(characterRom, 0, sourceOffset, sourceOffset + characterRom.length);
    characterRom = Buffer.from(characterRom);
  }

  return {
    programRom: Buffer.from(programRom),
    characterRom
  };
}

module.exports.parseNesRom = function(rawData) {
  debug('parseNesRom');

  const romData = Buffer.from(rawData);
  if (!romData || romData.length < MINIMAL_FILESIZE) {
    throw new Error('INVALID_DATA');
  }

  const headerFromRom = romData.readUInt32BE(0);
  if (headerFromRom !== MAGIC_HEADER) {
    throw new Error('INVALID_HEADER');
  }

  const metaData = getRomMetaData(romData);
  return {
    metaData,
    data: getRomData(romData, metaData)
  };
};

module.exports.loadRom = function(fileName) {
  debug('loadRom:', fileName);
  return fileread.readFileAsArrayBuffer(fileName)
    .then((data) => {
      return module.exports.parseNesRom(data);
    });
};
