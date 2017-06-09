'use strict';

import test from 'ava';
import Cpu from '../../lib/cpu';
import Memory from '../../lib/memory';

const MAPPER_DUMMY_READ = 0x11AA;

test.beforeEach(t => {
  const mapper = {
    mapperWrite: false,
    write: function(offset) {
      this.mapperWrite = offset;
    },
    read: function() {
      return MAPPER_DUMMY_READ;
    }
  };
  const memory = new Memory();
  memory.registerMapper(mapper);
  t.context = new Cpu(memory);
  t.context.reset();
});

test('should test setFlagsCompare', t => {
  t.context.setFlagsCompare(0x10, 0x08);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, false);
  t.is(t.context.registerP.carry, true);
});

test('should test setFlagsCompare', t => {
  t.context.setFlagsCompare(0x00, 0x08);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, true);
  t.is(t.context.registerP.carry, false);
});

test('should not waste cycles when wasteCycles === 0', t => {
  t.context.wasteCycles = 0;
  t.context.executeCycle();
  t.is(t.context.wasteCycles, 0);
});

test('should decrease waste cycles', t => {
  t.context.wasteCycles = 5;
  t.context.executeCycle();
  t.context.executeCycle();
  t.is(t.context.wasteCycles, 3);
});

test('should trigger NMI interrupt', t => {
  t.context.triggerNMI();
  t.is(t.context.wasteCycles, 0);
  t.is(t.context.interruptPending, 0xfffa);
  t.context.executeCycle();
  t.is(t.context.wasteCycles, 7);
  t.is(t.context.interruptPending, undefined);
});

test('should trigger IRQ interrupt', t => {
  t.context.triggerIRQ();
  t.is(t.context.wasteCycles, 0);
  t.is(t.context.interruptPending, 0xfffe);
  t.context.executeCycle();
  t.is(t.context.wasteCycles, 7);
  t.is(t.context.interruptPending, undefined);
});

test('should push and pop 8bit data to/from the stack, 0x00', t => {
  t.plan(2);
  t.context.pushStack8(0x00);
  t.is(t.context.popStack8(), 0x00);
  t.is(t.context.registerSP, 0xFD);
});

test('should push and pop 8bit data to/from the stack, 0xfff', t => {
  t.plan(2);
  t.context.pushStack8(0xfff);
  t.is(t.context.popStack8(), 0xff);
  t.is(t.context.registerSP, 0xFD);
});

test('should push and pop 16bit data to/from the stack', t => {
  t.plan(2);
  t.context.pushStack16(0xffaa);
  t.is(t.context.popStack16(), 0xffaa);
  t.is(t.context.registerSP, 0xFD);
});

test('should wrap around stack, push', t => {
  for (let i = 0; i < 0x100; i++) {
    t.context.pushStack8(0xaa);
  }
  t.is(t.context.registerSP, 0xFD);
});

test('should wrap around stack, pop', t => {
  console.log('aaa');
  for (let i = 0; i < 0x100; i++) {
    t.context.popStack8();
  }
  t.is(t.context.registerSP, 0xFD);
});

test('should calculate the correct stack pointer address', t => {
  t.context.pushStack16(0xffaa);
  t.context.pushStack8(0);
  t.context.pushStack16(0);
  t.is(t.context.registerSP, 0xF8);
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
  t.is(t.context.registerPC, MAPPER_DUMMY_READ);
  t.is(t.context.memory.mapper.mapperWrite, 0xffff);
});

test('should read correct IRQ value when calling BRK', t => {
  t.context.memory.write16(0xfffe, 0x5010);
  t.context.BRK();
  t.is(t.context.registerPC, MAPPER_DUMMY_READ);
  t.is(t.context.memory.mapper.mapperWrite, 0xfffe);
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
    unusedBreak: false,
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
    unusedBreak: false,
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
  t.is(t.context.registerP.carry, false);
});

test('should correctly ROL, accumulator mode, overflow', t => {
  const instruction = { mode: 'accumulator' };
  t.context.registerA = 0xEE;
  t.context.ROL(instruction);
  t.is(t.context.registerA, 0xDC);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, true);
  t.is(t.context.registerP.carry, true);
});

test('should correctly ROL, mode != accumulator', t => {
  const instruction = { mode: 'foo', address: 0x1234 };
  t.context.memory.write8(instruction.address, 0x10);
  t.context.ROL(instruction);
  t.is(t.context.memory.read8(instruction.address), 0x10 << 1);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, false);
  t.is(t.context.registerP.carry, false);
});

test('should correctly ROL, mode != accumulator, overflow', t => {
  const instruction = { mode: 'foo', address: 0x1234 };
  t.context.memory.write8(instruction.address, 0xEE);
  t.context.ROL(instruction);
  t.is(t.context.memory.read8(instruction.address), 0xDC);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, true);
  t.is(t.context.registerP.carry, true);
});

test('should correctly ROR, accumulator mode', t => {
  const instruction = { mode: 'accumulator' };
  t.context.registerA = 0x10;
  t.context.ROR(instruction);
  t.is(t.context.registerA, 0x10 >>> 1);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, false);
  t.is(t.context.registerP.carry, false);
});

test('should correctly ROR, accumulator mode, set zero flag', t => {
  const instruction = { mode: 'accumulator' };
  t.context.registerA = 0x1;
  t.context.ROR(instruction);
  t.is(t.context.registerA, 0x1 >>> 1);
  t.is(t.context.registerP.zero, true);
  t.is(t.context.registerP.negative, false);
  t.is(t.context.registerP.carry, true);
});

test('should correctly ROR, accumulator mode, set carry flag', t => {
  const instruction = { mode: 'accumulator' };
  t.context.registerA = 0x00;
  t.context.ROR(instruction);
  t.is(t.context.registerA, 0x1 >>> 1);
  t.is(t.context.registerP.zero, true);
  t.is(t.context.registerP.negative, false);
  t.is(t.context.registerP.carry, false);
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

test('should correctly load accumulator (LDA)', t => {
  const instruction = { address: 0x1234 };
  t.context.memory.write8(instruction.address, 0x17);
  t.context.LDA(instruction);
  t.is(t.context.registerA, 0x17);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, false);
});

test('should correctly load X (LDX)', t => {
  const instruction = { address: 0x1234 };
  t.context.memory.write8(instruction.address, 0x17);
  t.context.LDX(instruction);
  t.is(t.context.registerX, 0x17);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, false);
});

test('should correctly load Y (LDY)', t => {
  const instruction = { address: 0x1234 };
  t.context.memory.write8(instruction.address, 0x17);
  t.context.LDY(instruction);
  t.is(t.context.registerY, 0x17);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, false);
});

test('should correctly enter and return from interrupt (BRK/RTI)', t => {
  t.context.registerPC = 0x1234;
  t.context.BRK();
  t.context.RTI();
  t.is(t.context.registerPC, 0x1235);
});

test('should correctly push and pull processor state (PHP/PLP)', t => {
  t.context.registerP = Cpu.updateRegisterP(0xff);
  const initialRegisterP = t.context.registerP;
  initialRegisterP.unusedBreak = 0;
  t.context.PHP();
  t.context.PLP();
  const postRegisterP = t.context.registerP;
  postRegisterP.unusedBreak = 0;
  t.deepEqual(initialRegisterP, postRegisterP);
});

test('should branch when zero flag is not set (BNE)', t => {
  t.context.registerPC = 0xf00d;
  t.context.registerP.zero = false;
  const instruction = { address: 0x1234 };
  t.context.BNE(instruction);
  t.is(t.context.registerPC, 0x1234);
});

test('should not branch when zero flag is set (BNE)', t => {
  t.context.registerPC = 0xf00d;
  t.context.registerP.zero = true;
  const instruction = { address: 0x1234 };
  t.context.BNE(instruction);
  t.is(t.context.registerPC, 0xf00d);
});

test('should branch when negative flag is not set (BPL)', t => {
  t.context.registerPC = 0xf00d;
  t.context.registerP.negative = false;
  const instruction = { address: 0x1234 };
  t.context.BPL(instruction);
  t.is(t.context.registerPC, 0x1234);
});

test('should not branch when negative flag is set (BPL)', t => {
  t.context.registerPC = 0xf00d;
  t.context.registerP.negative = true;
  const instruction = { address: 0x1234 };
  t.context.BPL(instruction);
  t.is(t.context.registerPC, 0xf00d);
});

test('should branch when zero flag is set (BEQ)', t => {
  t.context.registerPC = 0xf00d;
  t.context.registerP.zero = true;
  const instruction = { address: 0x1234 };
  t.context.BEQ(instruction);
  t.is(t.context.registerPC, 0x1234);
});

test('should not branch when zero flag is not set (BEQ)', t => {
  t.context.registerPC = 0xf00d;
  t.context.registerP.zero = false;
  const instruction = { address: 0x1234 };
  t.context.BEQ(instruction);
  t.is(t.context.registerPC, 0xf00d);
});

test('should branch when negative flag is set (BMI)', t => {
  t.context.registerPC = 0xf00d;
  t.context.registerP.negative = true;
  const instruction = { address: 0x1234 };
  t.context.BMI(instruction);
  t.is(t.context.registerPC, 0x1234);
});

test('should not branch when negative flag is not set (BMI)', t => {
  t.context.registerPC = 0xf00d;
  t.context.registerP.negative = false;
  const instruction = { address: 0x1234 };
  t.context.BMI(instruction);
  t.is(t.context.registerPC, 0xf00d);
});

test('should branch when carry flag is set (BCS)', t => {
  t.context.registerPC = 0xf00d;
  t.context.registerP.carry = true;
  const instruction = { address: 0x1234 };
  t.context.BCS(instruction);
  t.is(t.context.registerPC, 0x1234);
});

test('should not branch when carry flag is not set (BCS)', t => {
  t.context.registerPC = 0xf00d;
  t.context.registerP.carry = false;
  const instruction = { address: 0x1234 };
  t.context.BCS(instruction);
  t.is(t.context.registerPC, 0xf00d);
});

test('should branch when carry flag is NOT set (BCC)', t => {
  t.context.registerPC = 0xf00d;
  t.context.registerP.carry = false;
  const instruction = { address: 0x1234 };
  t.context.BCC(instruction);
  t.is(t.context.registerPC, 0x1234);
});

test('should not branch when carry flag is set (BCC)', t => {
  t.context.registerPC = 0xf00d;
  t.context.registerP.carry = true;
  const instruction = { address: 0x1234 };
  t.context.BCC(instruction);
  t.is(t.context.registerPC, 0xf00d);
});

test('should branch when overflow flag is NOT set (BVC)', t => {
  t.context.registerPC = 0xf00d;
  t.context.registerP.overflow = false;
  const instruction = { address: 0x1234 };
  t.context.BVC(instruction);
  t.is(t.context.registerPC, 0x1234);
});

test('should not branch when overflow flag is set (BVC)', t => {
  t.context.registerPC = 0xf00d;
  t.context.registerP.overflow = true;
  const instruction = { address: 0x1234 };
  t.context.BVC(instruction);
  t.is(t.context.registerPC, 0xf00d);
});

test('should branch when overflow flag is set (BVS)', t => {
  t.context.registerPC = 0xf00d;
  t.context.registerP.overflow = true;
  const instruction = { address: 0x1234 };
  t.context.BVS(instruction);
  t.is(t.context.registerPC, 0x1234);
});

test('should not branch when overflow flag is NOT set (BVS)', t => {
  t.context.registerPC = 0xf00d;
  t.context.registerP.overflow = false;
  const instruction = { address: 0x1234 };
  t.context.BVS(instruction);
  t.is(t.context.registerPC, 0xf00d);
});

test('should add with carry (ADC)', t => {
  const instruction = { address: 0x1234 };
  t.context.memory.write8(instruction.address, 0x17);
  t.context.registerA = 0x88;
  t.context.registerP.carry = true;
  t.context.ADC(instruction);
  t.is(t.context.registerA, 0xa0);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, true);
  t.is(t.context.registerP.carry, false);
  t.is(t.context.registerP.overflow, false);
});

test('should add with carry (ADC), zero flag', t => {
  const instruction = { address: 0x1234 };
  t.context.memory.write8(instruction.address, 0x00);
  t.context.registerA = 0x00;
  t.context.registerP.carry = false;
  t.context.ADC(instruction);
  t.is(t.context.registerA, 0x00);
  t.is(t.context.registerP.zero, true);
  t.is(t.context.registerP.negative, false);
  t.is(t.context.registerP.carry, false);
  t.is(t.context.registerP.overflow, false);
});

test('should add with carry (ADC), overflow (carry flag)', t => {
  const instruction = { address: 0x1234 };
  t.context.memory.write8(instruction.address, 0xaa);
  t.context.registerA = 0xcc;
  t.context.registerP.carry = true;
  t.context.ADC(instruction);
  t.is(t.context.registerA, 119);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, false);
  t.is(t.context.registerP.carry, true);
  t.is(t.context.registerP.overflow, true);
});

test('should add with carry (ADC), overflow', t => {
  const instruction = { address: 0x1234 };
  t.context.memory.write8(instruction.address, 0x64);
  t.context.registerA = 0x64;
  t.context.registerP.carry = true;
  t.context.ADC(instruction);
  t.is(t.context.registerA, 0xC9);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, true);
  t.is(t.context.registerP.carry, false);
  t.is(t.context.registerP.overflow, true);
});

test('should subtract with carry (SBC)', t => {
  const instruction = { address: 0x1234 };
  t.context.memory.write8(instruction.address, 0x17);
  t.context.registerA = 0x18;
  t.context.registerP.carry = false;
  t.context.SBC(instruction);
  t.is(t.context.registerA, 0x01);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, false);
  t.is(t.context.registerP.carry, false);
  t.is(t.context.registerP.overflow, false);
});

test('should subtract with carry (SBC), overflow', t => {
  const instruction = { address: 0x1234 };
  t.context.memory.write8(instruction.address, 0xff);
  t.context.registerA = 0x18;
  t.context.registerP.carry = false;
  t.context.SBC(instruction);
  t.is(t.context.registerA, 0x19);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, false);
  t.is(t.context.registerP.carry, false);
  t.is(t.context.registerP.overflow, false);
});

test('should run BIT test, 0x00', t => {
  const instruction = { address: 0x1234 };
  t.context.registerA = 0x00;
  t.context.memory.write8(instruction.address, 0x00);
  t.context.BIT(instruction);
  t.is(t.context.registerP.zero, true);
  t.is(t.context.registerP.negative, false);
  t.is(t.context.registerP.overflow, false);
});

test('should run BIT test, a=0, 0xff', t => {
  const instruction = { address: 0x1234 };
  t.context.registerA = 0x00;
  t.context.memory.write8(instruction.address, 0xff);
  t.context.BIT(instruction);
  t.is(t.context.registerP.zero, true);
  t.is(t.context.registerP.negative, true);
  t.is(t.context.registerP.overflow, true);
});

test('should run STA', t => {
  const instruction = { address: 0x1234 };
  t.context.registerA = 0x01;
  t.context.STA(instruction);
  t.is(t.context.memory.read8(instruction.address), 0x01);
});

test('should run STX', t => {
  const instruction = { address: 0x1234 };
  t.context.registerX = 0x01;
  t.context.STX(instruction);
  t.is(t.context.memory.read8(instruction.address), 0x01);
});

test('should run STY', t => {
  const instruction = { address: 0x1234 };
  t.context.registerY = 0x01;
  t.context.STY(instruction);
  t.is(t.context.memory.read8(instruction.address), 0x01);
});

test('should run TAX, zero flag', t => {
  t.context.registerA = 0x00;
  t.context.TAX();
  t.is(t.context.registerX, 0x00);
  t.is(t.context.registerP.zero, true);
  t.is(t.context.registerP.negative, false);
});

test('should run TAX, negative flag', t => {
  t.context.registerA = 0xff;
  t.context.TAX();
  t.is(t.context.registerX, 0xff);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, true);
});

test('should run TAY, zero flag', t => {
  t.context.registerA = 0x00;
  t.context.TAY();
  t.is(t.context.registerY, 0x00);
  t.is(t.context.registerP.zero, true);
  t.is(t.context.registerP.negative, false);
});

test('should run TAY, negative flag', t => {
  t.context.registerA = 0xff;
  t.context.TAY();
  t.is(t.context.registerY, 0xff);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, true);
});

test('should run TSX, zero flag', t => {
  t.context.registerSP = 0x00;
  t.context.TSX();
  t.is(t.context.registerX, 0x00);
  t.is(t.context.registerP.zero, true);
  t.is(t.context.registerP.negative, false);
});

test('should run TSX, negative flag', t => {
  t.context.registerSP = 0xff;
  t.context.TSX();
  t.is(t.context.registerX, 0xff);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, true);
});

test('should run TXA, zero flag', t => {
  t.context.registerX = 0x00;
  t.context.TXA();
  t.is(t.context.registerA, 0x00);
  t.is(t.context.registerP.zero, true);
  t.is(t.context.registerP.negative, false);
});

test('should run TXA, negative flag', t => {
  t.context.registerX = 0xff;
  t.context.TXA();
  t.is(t.context.registerA, 0xff);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, true);
});

test('should run TXS', t => {
  t.context.registerX = 0x42;
  t.context.TXS();
  t.is(t.context.registerSP, 0x42);
});

test('should run TYA, zero flag', t => {
  t.context.registerY = 0x00;
  t.context.TYA();
  t.is(t.context.registerA, 0x00);
  t.is(t.context.registerP.zero, true);
  t.is(t.context.registerP.negative, false);
});

test('should run TYA, negative flag', t => {
  t.context.registerY = 0xff;
  t.context.TYA();
  t.is(t.context.registerA, 0xff);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, true);
});

test('should run AND, zero flag', t => {
  const instruction = { address: 0x1234 };
  t.context.memory.write8(instruction.address, 0x00);
  t.context.registerA = 0xff;
  t.context.AND(instruction);
  t.is(t.context.registerA, 0x00);
  t.is(t.context.registerP.zero, true);
  t.is(t.context.registerP.negative, false);
});

test('should run AND', t => {
  const instruction = { address: 0x1234 };
  t.context.memory.write8(instruction.address, 0xff);
  t.context.registerA = 0xff;
  t.context.AND(instruction);
  t.is(t.context.registerA, 0xff);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, true);
});

test('should run EOR 0xff/0xff', t => {
  const instruction = { address: 0x1234 };
  t.context.memory.write8(instruction.address, 0xff);
  t.context.registerA = 0xff;
  t.context.EOR(instruction);
  t.is(t.context.registerA, 0x00);
  t.is(t.context.registerP.zero, true);
  t.is(t.context.registerP.negative, false);
});

test('should run EOR 0xff/0x00', t => {
  const instruction = { address: 0x1234 };
  t.context.memory.write8(instruction.address, 0xff);
  t.context.registerA = 0x00;
  t.context.EOR(instruction);
  t.is(t.context.registerA, 0xff);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, true);
});

test('should run LSR, accumulator mode', t => {
  const instruction = { mode: 'accumulator' };
  t.context.registerA = 0xff;
  t.context.LSR(instruction);
  t.is(t.context.registerA, 0x7f);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, false);
  t.is(t.context.registerP.carry, true);
});

test('should run LSR, memory mode', t => {
  const instruction = { address: 0x1234, mode: 'foo' };
  t.context.memory.write8(instruction.address, 0xff);
  t.context.LSR(instruction);
  t.is(t.context.memory.read8(instruction.address), 0x7f);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, false);
  t.is(t.context.registerP.carry, true);
});

test('should run ASL, accumulator mode', t => {
  const instruction = { mode: 'accumulator' };
  t.context.registerA = 0xff;
  t.context.ASL(instruction);
  t.is(t.context.registerA, 0xfe);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, true);
  t.is(t.context.registerP.carry, true);
});

test('should run ASL, memory mode', t => {
  const instruction = { address: 0x1234, mode: 'foo' };
  t.context.memory.write8(instruction.address, 0xff);
  t.context.ASL(instruction);
  t.is(t.context.memory.read8(instruction.address), 0xfe);
  t.is(t.context.registerP.zero, false);
  t.is(t.context.registerP.negative, true);
  t.is(t.context.registerP.carry, true);
});
