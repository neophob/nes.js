'use strict';

import test from 'ava';
import ines from '../../lib/ines';

test('should read file, read croom.nes', t => {
  return ines.loadRom('./rom/croom.nes')
    .then((result) => {
      console.log(result);
      t.is(result.programRomPages, 1);
      t.is(result.characterRomPages, 1);
    });
});

test('should read file, read thwaite.nes', t => {
  return ines.loadRom('./rom/thwaite.nes')
    .then((result) => {
      console.log(result);
      t.is(result.programRomPages, 1);
      t.is(result.characterRomPages, 1);
    });
});

test('should read file, read PwnAdventureZ-csaw-withkeys.nes', t => {
  return ines.loadRom('./rom/PwnAdventureZ-csaw-withkeys.nes')
    .then((result) => {
      console.log(result);
      t.is(result.programRomPages, 16);
      t.is(result.characterRomPages, 0);
    });
});
