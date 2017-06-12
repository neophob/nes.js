'use strict';

const Nes = require('../../../lib/nes');

const NTSC_REFRESHRATE = 60;
const NTSC_INTERVAL = 1000 / NTSC_REFRESHRATE;

/*
Text output
-----------
Tests generally print information on screen. They also output the same
text as a zero-terminted string beginning at $6004, allowing examination
of output in an NSF player, or a NES emulator without a working PPU. The
tests also work properly if the PPU doesn't set the VBL flag properly or
doesn't implement it at all.

The final result is displayed and also written to $6000. Before the test
starts, $80 is written there so you can tell when it's done. If a test
needs the NES to be reset, it writes $81 there. In addition, $DE $B0 $G1
is written to $6001-$6003 to allow an emulator to detect when a test is
being run, as opposed to some other NES program. In NSF builds, the
final result is also reported via a series of beeps (see below).

See the source code for more information about a particular test and why
it might be failing. Each test has comments and correct output at the
top.
*/

let cycle = 0;
let lastDebugOutput = '';
function runNesMainloop(nes, romPath) {
  return new Promise((resolve, reject) => {
    const intervalId = setInterval(() => {
      nes.executeCycle();

      if ((cycle++) % 20 === 1) {
        let ofs = 0;
        let testoutput = '';
        while (ofs < 0xff) {
          const c = nes.memory._read(0x6004 + ofs, 8);
          if (c !== 0) {
            testoutput += String.fromCharCode(c);
          }
          ofs++;
        }
        testoutput = testoutput.trim();
        const finalResult = nes.memory._read(0x80, 8);
        if (testoutput && lastDebugOutput !== testoutput) {
          console.log('OUTPUT RC:', finalResult);
          console.log('OUTPUT TXT:\n', testoutput);
          lastDebugOutput = testoutput;
        }
        if (finalResult === 0x81) {
          console.log('NES RESET NEEDED', romPath);
          clearInterval(intervalId);
          reject(new Error('NES RESET NEEDED'));
        }
        if (finalResult === 0x80 || testoutput.includes('Passed')) {
          console.log('TEST SUCCEEDED', romPath);
          clearInterval(intervalId);
          resolve();
        }
        //console.log(nes.cpu.cycles, duration, '0x80:', nes.memory._read(0x80, 8), '0x6000', nes.memory._read(0x6000, 8), nes.memory._read(0x6001, 8), testoutput);
        if (testoutput.includes('Failed')) {
          console.log('TEST FAILED', romPath);
          clearInterval(intervalId);
          reject(new Error(testoutput));
        }
      }
    }, NTSC_INTERVAL);
  });
}

module.exports = function(romPath) {
  return Nes.loadRom(romPath)
    .then((nes) => {
      nes.start();
      return runNesMainloop(nes, romPath);
    })
    .catch(() => {});
};
