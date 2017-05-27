'use strict';

const Nes = require('./lib/nes');

const romPath = process.argv[2];

if (!romPath) {
  console.error('Parameter [ROM PATH]');
  process.exit(1);
}

Nes.loadRom(romPath)
  .then((nes) => {
    nes.start();
  })
  .catch((error) => {
    console.log('loading rom failed', error);
  });

setTimeout(() => {}, 2000);
