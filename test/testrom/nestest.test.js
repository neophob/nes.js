'use strict';

import test from 'ava';
const Nes = require('../../lib/nes');
const fs = require('fs');

/*
Emulator authors:

This test program, when run on "automation", (i.e. set your program counter
to 0c000h) will perform all tests in sequence and shove the results of
the tests into locations 02h and 03h.

C000  4C F5 C5  JMP $C5F5                       A:00 X:00 Y:00 P:24 SP:FD CYC:  0 SL:241
C5F5  A2 00     LDX #$00                        A:00 X:00 Y:00 P:24 SP:FD CYC:  9 SL:241
C5F7  86 00     STX $00 = 00                    A:00 X:00 Y:00 P:26 SP:FD CYC: 15 SL:241

*/

function runNesMainloop(nes, resultSet) {
  let ofs = 0;

  function getTrace() {
    function fixedSizeString(size, string) {
      const missingChars = size - string.length;
      if (missingChars < 0) {
        return string;
      }
      return string.toUpperCase() + ' '.repeat(missingChars);
    }
    function fixedSizeHexNumber(number) {
      const string = number.toString(16);
      if (string.length === 1) {
        return '0'+string;
      }
      return string;
    }
    //print more or less in the nestest.nes format
    const nextInstruction = nes.cpu.getNextInstruction();
    const instructionSize = nextInstruction.instruction.size;
    let opcodes = fixedSizeHexNumber(nextInstruction.opcode);
    const lastPC = nes.cpu.registerPC;
    for (let i=1; i < instructionSize; i++) {
      opcodes += ' ' + fixedSizeHexNumber(nes.memory.read8(lastPC + i));
    }
    const flags = fixedSizeString(5, 'A:' + fixedSizeHexNumber(nes.cpu.registerA)) +
                  fixedSizeString(5, 'X:' + fixedSizeHexNumber(nes.cpu.registerX)) +
                  fixedSizeString(5, 'Y:' + fixedSizeHexNumber(nes.cpu.registerY)) +
                  fixedSizeString(5, 'P:' + fixedSizeHexNumber(nes.cpu.getRegisterP())) +
                  fixedSizeString(6, 'SP:' + fixedSizeHexNumber(nes.cpu.registerSP));

    let pc = lastPC.toString(16).toUpperCase();
    while (pc.length < 4) {
      pc = '0' + pc;
    }
    return {
      pc,
      opcodes: opcodes.toUpperCase(),
      instruction: nextInstruction.instruction.name,
      flags
    };
  }

  function compare(expected, actual, value) {
    if (expected.trim() !== actual.trim()) {
      console.log('NESTEST DIFF Line '+ofs, 'Value:', value);
      console.log(' expected:', expected);
      console.log(' actual  :', actual);
      throw new Error('ERR');
    }
  }

  return new Promise((resolve, reject) => {
    const intervalId = setInterval(() => {

      const expectedResult = resultSet[ofs++];
      const actualResult = getTrace();

      compare(expectedResult.pc, actualResult.pc, 'PC');
      compare(expectedResult.opcodes, actualResult.opcodes, 'opcodes');
      compare(expectedResult.flags, actualResult.flags, 'flags');
      //TODO compare instruction - but will fail due the illegal nes op codes
      //TODO compare ppu

      nes.cpu.executeCycle();
      nes.ppu.executeCycle();
      nes.ppu.executeCycle();
      nes.ppu.executeCycle();

       if (nes.cpu.registerPC === 0x0C66E) {
        const finalResult = nes.memory.read16(0x02);
        console.log('RC:', finalResult.toString(16));
        if (finalResult === 0) {
          clearInterval(intervalId);
          resolve(finalResult.toString(16));
        } else {
          clearInterval(intervalId);
          reject(finalResult.toString(16));
        }
      }
    }, 0);
  });
}

function loadNestestTraceFile() {
  const RESULT_REGEX = /(.{6})(.{9})(.{33})(.{25})(.*)/;
  const tempArray = fs.readFileSync('./testrom/other/nestest.log').toString().split('\n');
  return tempArray.map((line) => {
    const resultGroups = line.match(RESULT_REGEX);
    if (!resultGroups) {
      return;
    }
    return {
      pc: resultGroups[1].trim(),
      opcodes: resultGroups[2].trim(),
      detail: resultGroups[3].trim(),
      flags: resultGroups[4].trim(),
      ppu: resultGroups[5].trim()
    };
  });
}

test('should run NESTEST.NES', t => {
  const romPath = './testrom/other/nestest.nes';
  const resultSet = loadNestestTraceFile();
  return Nes.loadRom(romPath)
    .then((nes) => {
      nes.start();
      nes.cpu.registerPC = 0x0c000;
      return runNesMainloop(nes, resultSet);
    })
    .then((rc) => {
      t.is(rc, 0x00);
    });
});
