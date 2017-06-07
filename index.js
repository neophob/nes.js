'use strict';

const Nes = require('./lib/nes');
//const client = require('./lib/client');

const romPath = process.argv[2];

if (!romPath) {
  console.error('Parameter [ROM PATH]');
  process.exit(1);
}

const NTSC_REFRESHRATE = 60;
const NTSC_INTERVAL = 1000 / NTSC_REFRESHRATE;

function runNesMainloop(nes) {
  setInterval(() => {
    const t1 = Date.now();
    nes.executeCycle();

    //client.sendMemData(nes.memory.ram);
    const duration = Date.now() - t1;
    console.log(duration);
  }, NTSC_INTERVAL);
}

Nes.loadRom(romPath)
  .then((nes) => {
    nes.start();
    runNesMainloop(nes);
  })
  .catch((error) => {
    console.log('loading rom failed', error);
  });
