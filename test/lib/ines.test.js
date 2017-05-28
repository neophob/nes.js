'use strict';

import test from 'ava';
import ines from '../../lib/ines';

test('should read file, read croom.nes', t => {
  return ines.loadRom('./rom/croom.nes')
    .then((result) => {
      const romMetaData = result.metaData;
      console.log(romMetaData);
      t.is(romMetaData.programRomPages, 1);
      t.is(romMetaData.programRamPages, 1);
      t.is(romMetaData.characterRomPages, 1);
      t.is(romMetaData.mapperType, 0);
      t.is(romMetaData.mirrorType, 1);
      t.is(romMetaData.batteryBackedPrgRam, false);
      t.is(romMetaData.trainerIncluded, false);
      const romData = result.data;
      t.is(romData.programRom.length, romMetaData.programRomPages * 16384);
      t.is(romData.characterRom.length, romMetaData.characterRomPages * 8192);
      const romLength = romData.programRom.length;
      t.is(romData.programRom[romLength-3], 192);
      t.is(romData.programRom[romLength-4], 218);
    });
});

test('should read file, read thwaite.nes', t => {
  return ines.loadRom('./rom/thwaite.nes')
    .then((result) => {
      const romMetaData = result.metaData;
      console.log(romMetaData);
      t.is(romMetaData.programRomPages, 1);
      t.is(romMetaData.programRamPages, 1);
      t.is(romMetaData.characterRomPages, 1);
      t.is(romMetaData.mapperType, 0);
      t.is(romMetaData.mirrorType, 1);
      t.is(romMetaData.batteryBackedPrgRam, false);
      t.is(romMetaData.trainerIncluded, false);
    });
});

test('should read file, read PwnAdventureZ-csaw-withkeys.nes', t => {
  return ines.loadRom('./rom/PwnAdventureZ-csaw-withkeys.nes')
    .then((result) => {
      const romMetaData = result.metaData;
      console.log(romMetaData);
      t.is(romMetaData.programRomPages, 16);
      t.is(romMetaData.programRamPages, 1);
      t.is(romMetaData.characterRomPages, 0);
      t.is(romMetaData.mapperType, 1);
      t.is(romMetaData.mirrorType, 0);
      t.is(romMetaData.batteryBackedPrgRam, true);
      t.is(romMetaData.trainerIncluded, false);
      const romData = result.data;
      t.is(romData.programRom.length, romMetaData.programRomPages * 16384);
      t.is(romData.characterRom, undefined);
    });
});
