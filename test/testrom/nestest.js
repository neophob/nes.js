'use strict';

import test from 'ava';
const Nes = require('../../lib/nes');

/*
Emulator authors:

This test program, when run on "automation", (i.e. set your program counter
to 0c000h) will perform all tests in sequence and shove the results of
the tests into locations 02h and 03h.

while (cpu.PC != 0xC66E) {
                cpu.step()
            }

            for (unsigned int i = 1; i < 8992; ++i) {
               try {
                 cpu.fetch_execute();
               } catch (std::runtime_error &e) {
                 std::cerr << e.what() << std::endl;
               }
             }
             if (memory.read(0x0002) == 0 && memory.read(0x0003) == 0) {
                 std::cout << "All test passed!" << std::endl;
               } else {
                 std::cout << "Some tests failed. Please check nestest.log" << std::endl;
               }

*/

function runNesMainloop(nes, romPath) {
  return new Promise((resolve, reject) => {
    const intervalId = setInterval(() => {

      nes.cpu.executeCycle();
        /*console.log(
          'PC',nes.cpu.registerPC.toString(16),
          'A:',nes.cpu.registerA.toString(16),
          'X:',nes.cpu.registerX.toString(16),
          'Y:',nes.cpu.registerY.toString(16),
          'SP:',nes.cpu.registerSP.toString(16),
          'OP:', nes.cpu.lastInstruction.instruction.name
        );*/

       if (nes.cpu.registerPC === 0x0C66E) {
        const finalResult = nes.memory.read16(0x02);
        console.log('RC:', finalResult.toString(16));
        if (finalResult === 0) {
          console.log('TEST SUCCEEDED', romPath);
          clearInterval(intervalId);
          resolve(finalResult.toString(16));
        } else {
          console.log('TEST FAILED', romPath);
          clearInterval(intervalId);
          reject(finalResult.toString(16));
        }
      }
    }, 0);
  });
}

test('should run NESTEST.NES', t => {
  const romPath = './testrom/other/nestest.nes';
  return Nes.loadRom(romPath)
    .then((nes) => {
      nes.start();
      nes.cpu.registerPC = 0x0c000;
      console.log(
        'PC',nes.cpu.registerPC.toString(16),
        'A:',nes.cpu.registerA.toString(16),
        'X:',nes.cpu.registerX.toString(16),
        'Y:',nes.cpu.registerY.toString(16),
        'SP:',nes.cpu.registerSP.toString(16)
      );
      return runNesMainloop(nes, romPath);
    })
    .then((rc) => {
      t.is(rc, 0x00);
    });
});
