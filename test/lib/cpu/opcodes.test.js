'use strict';

import test from 'ava';
import CpuOpcodes from '../../../lib/cpu/opcodes';

test('build cpu instructions, check names', t => {
  for (let i = 0; i < 0xff; i++) {
    const result = CpuOpcodes.getInstruction(i);
    t.is(result.name.length, 3);
  }
});

test('build cpu instructions, check mode', t => {
  for (let i = 0; i < 0xff; i++) {
    const result = CpuOpcodes.getInstruction(i);
    t.is(typeof result.mode, 'string');
  }
});

test('build cpu instructions, check cycles', t => {
  for (let i = 0; i < 0xff; i++) {
    const result = CpuOpcodes.getInstruction(i);
    t.is(result.cycles >= 0, true);
  }
});

test('build cpu instructions, check size', t => {
  for (let i = 0; i < 0xff; i++) {
    const result = CpuOpcodes.getInstruction(i);
    t.is(result.size >= 0, true);
  }
});

test('build cpu instructions, check pageCycles', t => {
  for (let i = 0; i < 0xff; i++) {
    const result = CpuOpcodes.getInstruction(i);
    t.is(result.pageCycles >= 0, true);
  }
});

test('should wrap opcodes > 0xff', t => {
  const a = CpuOpcodes.getInstruction(0x00);
  const b = CpuOpcodes.getInstruction(0x100);
  t.deepEqual(a, b);
});
