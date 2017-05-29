'use strict';

import test from 'ava';
import Cpu from '../../lib/cpu';
import Memory from '../../lib/memory';

test.beforeEach(t => {
  const memory = new Memory();
  t.context = new Cpu(memory);
});

test('should push and pop 8bit data to/from the stack, 0x00', t => {
  t.plan(2);
  t.context.pushStack8(0x00);
  t.is(t.context.popStack8(), 0x00);
  t.is(t.context.registerSP, 0x100);
});

test('should push and pop 8bit data to/from the stack, 0xfff', t => {
  t.plan(2);
  t.context.pushStack8(0xfff);
  t.is(t.context.popStack8(), 0xff);
  t.is(t.context.registerSP, 0x100);
});

test('should push and pop 16bit data to/from the stack', t => {
  t.plan(2);
  t.context.pushStack16(0xffaa);
  t.is(t.context.popStack16(), 0xffaa);
  t.is(t.context.registerSP, 0x100);
});

test('should calculate the correct stack pointer address', t => {
  t.context.pushStack16(0xffaa);
  t.context.pushStack8(0);
  t.context.pushStack16(0);
  t.is(t.context.registerSP | 0x100, 0x200 - 5);
});

test('should transform register P, 0x00', t => {
  t.plan(9);
  const flags = Cpu.updateRegisterP(0);
  t.is(flags.carry, false);
  t.is(flags.zero, false);
  t.is(flags.interruptDisable, false);
  t.is(flags.decimal, false);
  t.is(flags.unusedBreak, false);
  t.is(flags.unused2, false);
  t.is(flags.overflow, false);
  t.is(flags.negative, false);
  t.context.registerP = flags;
  t.is(t.context.getRegisterP(), 0);
});

test('should transform register P, 0xff', t => {
  t.plan(9);
  const flags = Cpu.updateRegisterP(0xff);
  t.is(flags.carry, true);
  t.is(flags.zero, true);
  t.is(flags.interruptDisable, true);
  t.is(flags.decimal, true);
  t.is(flags.unusedBreak, true);
  t.is(flags.unused2, true);
  t.is(flags.overflow, true);
  t.is(flags.negative, true);
  t.context.registerP = flags;
  t.is(t.context.getRegisterP(), 0xff);
});

test('should set zero and negative flags, 0x00', t => {
  t.context.setZeroAndNegativeFlag(0);
  const flags = t.context.registerP;
  t.is(flags.zero, true);
  t.is(flags.negative, false);
});

test('should set zero and negative flags, 0x01', t => {
  t.context.setZeroAndNegativeFlag(0x01);
  const flags = t.context.registerP;
  t.is(flags.zero, false);
  t.is(flags.negative, false);
});

test('should set zero and negative flags, 0xff', t => {
  t.context.setZeroAndNegativeFlag(0xff);
  const flags = t.context.registerP;
  t.is(flags.zero, false);
  t.is(flags.negative, true);
});

test('should not pageDiffer, 0x0000/0x0000', t => {
  const result = t.context.pagesDiffer(0x0000, 0x0000);
  t.is(result, false);
});

test('should not pageDiffer, 0x00ff/0x00ff', t => {
  const result = t.context.pagesDiffer(0x00ff, 0x00ff);
  t.is(result, false);
});

test('should not pageDiffer, 0x01ff/0x00ff', t => {
  const result = t.context.pagesDiffer(0x00ff, 0x01ff);
  t.is(result, true);
});

test('should not pageDiffer, 0x01ff/0x01ff', t => {
  const result = t.context.pagesDiffer(0x01ff, 0x01ff);
  t.is(result, false);
});

test('should read correct IRQ value when calling BRK', t => {
  t.context.memory.write8(0xfffe, 0x10);
  t.context.memory.write8(0xffff, 0x50);
  t.context.BRK();
  t.is(t.context.registerPC, 0x5010);
});

test('should read correct IRQ value when calling BRK', t => {
  t.context.memory.write16(0xfffe, 0x5010);
  t.context.BRK();
  t.is(t.context.registerPC, 0x5010);
});

test('should branch when zero flag is NOT set (BNE)', t => {
  t.context.registerPC = 0;
  t.context.registerP.zero = false;
  const instruction = { address: 0x1234 };
  t.context.BNE(instruction);
  t.is(t.context.registerPC, 0x1234);
});

test('should NOT branch when zero flag is set (BNE)', t => {
  t.context.registerPC = 0;
  t.context.registerP.zero = true;
  const instruction = { address: 0x1234 };
  t.context.BNE(instruction);
  t.is(t.context.registerPC, 0);
});

test('should increase X register (INX)', t => {
  t.context.registerX = 0;
  t.context.INX();
  t.is(t.context.registerX, 1);
});

test('should increase X register (INX) - overflow', t => {
  t.context.registerX = 255;
  t.context.INX();
  t.is(t.context.registerX, 0);
  t.is(t.context.registerP.zero, true);
  t.is(t.context.registerP.negative, false);
});

test('should increase Y register (INY)', t => {
  t.context.registerY = 0;
  t.context.INY();
  t.is(t.context.registerY, 1);
});

test('should increase Y register (INY) - overflow', t => {
  t.context.registerY = 255;
  t.context.INY();
  t.is(t.context.registerY, 0);
  t.is(t.context.registerP.zero, true);
  t.is(t.context.registerP.negative, false);
});

test('should decrease memory position (DEC)', t => {
  const instruction = { address: 0x1234 };
  t.context.memory.write8(instruction.address, 1);
  t.context.DEC(instruction);
  t.is(t.context.memory.read8(instruction.address), 0);
  t.is(t.context.registerP.zero, true);
  t.is(t.context.registerP.negative, false);
});

test('should increase memory position (INC)', t => {
  const instruction = { address: 0x1234 };
  t.context.memory.write8(instruction.address, 1);
  t.context.INC(instruction);
  t.is(t.context.memory.read8(instruction.address), 2);
  t.is(t.context.registerP.zero,false);
  t.is(t.context.registerP.negative, false);
});

test('should decrease X register (DEX)', t => {
  t.context.registerX = 1;
  t.context.DEX();
  t.is(t.context.registerX, 0);
  t.is(t.context.registerP.zero, true);
  t.is(t.context.registerP.negative, false);
});

test('should decrease X register (DEX) - overflow', t => {
  t.context.registerX = 0;
  t.context.DEX();
  t.is(t.context.registerX, 255);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, true);
});

test('should decrease Y register (DEY)', t => {
  t.context.registerY = 1;
  t.context.DEY();
  t.is(t.context.registerY, 0);
  t.is(t.context.registerP.zero, true);
  t.is(t.context.registerP.negative, false);
});

test('should decrease Y register (DEY) - overflow', t => {
  t.context.registerY = 0;
  t.context.DEY();
  t.is(t.context.registerY, 255);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, true);
});

test('should pull register A (PLA), 0xff', t => {
  t.context.pushStack8(0xff);
  t.context.PLA();
  t.is(t.context.registerA, 0xff);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, true);
});

test('should pull register A (PLA), 0x00', t => {
  t.context.pushStack8(0x00);
  t.context.PLA();
  t.is(t.context.registerA, 0x00);
  t.is(t.context.registerP.zero, true);
  t.is(t.context.registerP.negative, false);
});

test('should correctly return from routine (RTS)', t => {
  t.context.pushStack16(0x1000);
  t.context.RTS();
  t.is(t.context.registerPC, 0x1001);
});

test('should correctly return from routine (RTS), overflow', t => {
  t.context.pushStack16(0xffff);
  t.context.RTS();
  t.is(t.context.registerPC, 0x0000);
});

test('should correctly jump to new address (JMP)', t => {
  const instruction = { address: 0x1234 };
  t.context.JMP(instruction);
  t.is(t.context.registerPC, instruction.address);
});

test('should correctly jump to new subroutine address (JSR)', t => {
  const instruction = { address: 0x1234 };
  t.context.JSR(instruction);
  t.is(t.context.registerPC, instruction.address);
});

test('should correctly jump to new subroutine address (JSR/RTS)', t => {
  t.context.registerPC = 0x1000;
  const instruction = { address: 0x1234 };
  t.context.JSR(instruction);
  t.context.RTS(instruction);
  t.is(t.context.registerPC, 0x1000);
});

test('should pull processor register (PLP), 0xff', t => {
  t.context.pushStack8(0xff);
  t.context.PLA();
  t.deepEqual(t.context.registerP, {
    carry: false,
    decimal: false,
    interruptDisable: true,
    negative: true,
    overflow: false,
    unusedBreak: true,
    unused2: true,
    zero: false,
  });
});

test('should pull processor register (PLP), 0x00', t => {
  t.context.pushStack8(0x00);
  t.context.PLA();
  t.deepEqual(t.context.registerP, {
    carry: false,
    decimal: false,
    interruptDisable: true,
    negative: false,
    overflow: false,
    unusedBreak: true,
    unused2: true,
    zero: true,
  });
});

test('should correctly push register A to stack (PHA)', t => {
  t.context.registerA = 0xCC;
  t.context.PHA();
  t.is(t.context.popStack8(), 0xCC);
});

test('should correctly pop register A from stack (PLA)', t => {
  t.context.pushStack8(0xCC);
  t.context.PLA();
  t.is(t.context.registerA, 0xCC);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, true);
});

test('should correctly pop register A from stack (PLA), zero flag', t => {
  t.context.pushStack8(0x00);
  t.context.PLA();
  t.is(t.context.registerA, 0x00);
  t.is(t.context.registerP.zero, true);
  t.is(t.context.registerP.negative, false);
});

test('should correctly calculate logical OR (ORA)', t => {
  t.context.registerPC = 0x1000;
  const instruction = { address: 0x1234 };
  t.context.memory.write8(instruction.address, 0xAA);
  t.context.registerA = 0xCC;
  t.context.ORA(instruction);
  t.is(t.context.registerA, 0xCC | 0xAA);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, true);
});

test('should correctly calculate logical OR (ORA), zero flag', t => {
  t.context.registerPC = 0x1000;
  const instruction = { address: 0x1234 };
  t.context.memory.write8(instruction.address, 0x00);
  t.context.registerA = 0x00;
  t.context.ORA(instruction);
  t.is(t.context.registerA, 0x00 | 0x00);
  t.is(t.context.registerP.zero, true);
  t.is(t.context.registerP.negative, false);
});

test('should correctly ROL, accumulator mode', t => {
  const instruction = { mode: 'accumulator' };
  t.context.registerA = 0x10;
  t.context.ROL(instruction);
  t.is(t.context.registerA, 0x10 << 1);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, false);
});

test('should correctly ROL, mode != accumulator', t => {
  const instruction = { mode: 'foo', address: 0x1234 };
  t.context.memory.write8(instruction.address, 0x10);
  t.context.ROL(instruction);
  t.is(t.context.memory.read8(instruction.address), 0x10 << 1);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, false);
});

test('should correctly ROR, accumulator mode', t => {
  const instruction = { mode: 'accumulator' };
  t.context.registerA = 0x10;
  t.context.ROR(instruction);
  t.is(t.context.registerA, 0x10 >>> 1);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, false);
});

test('should correctly ROR, accumulator mode, set zero flag', t => {
  const instruction = { mode: 'accumulator' };
  t.context.registerA = 0x1;
  t.context.ROR(instruction);
  t.is(t.context.registerA, 0x1 >>> 1);
  t.is(t.context.registerP.zero, true);
  t.is(t.context.registerP.negative, false);
});

test('should correctly ROR, mode != accumulator', t => {
  const instruction = { mode: 'foo', address: 0x1234 };
  t.context.memory.write8(instruction.address, 0x10);
  t.context.ROR(instruction);
  t.is(t.context.memory.read8(instruction.address), 0x10 >>> 1);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, false);
});

test('should correctly ROR, mode != accumulator, zero', t => {
  const instruction = { mode: 'foo', address: 0x1234 };
  t.context.memory.write8(instruction.address, 0x1);
  t.context.ROR(instruction);
  t.is(t.context.memory.read8(instruction.address), 0x1 >>> 1);
  t.is(t.context.registerP.zero, true);
  t.is(t.context.registerP.negative, false);
});
