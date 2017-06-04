'use strict';

const Nes = require('./lib/nes');
const client = require('./lib/client');

const romPath = process.argv[2];

if (!romPath) {
  console.error('Parameter [ROM PATH]');
  process.exit(1);
}


Nes.loadRom(romPath)
  .then((nes) => {
    nes.start();
    setInterval(() => {
      let count = 240;
      while (count--) {
        nes.executeCycle();
      }
      client.sendMemData(nes.memory.ram);
    }, 1000/60);

  })
  .catch((error) => {
    console.log('loading rom failed', error);
  });

//setTimeout(() => {}, 2000);
