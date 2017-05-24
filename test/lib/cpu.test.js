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
  const result = t.context.popStack8();
  t.is(result, 0x00);
  t.is(t.context.registerSP, 0x100);
});

test('should push and pop 8bit data to/from the stack, 0xfff', t => {
  t.plan(2);
  t.context.pushStack8(0xfff);
  const result = t.context.popStack8();
  t.is(result, 0xff);
  t.is(t.context.registerSP, 0x100);
});

test('should push and pop 16bit data to/from the stack', t => {
  t.plan(2);
  t.context.pushStack16(0xffaa);
  const result = t.context.popStack16();
  t.is(result, 0xffaa);
  t.is(t.context.registerSP, 0x100);
});

test('should calculate the correct stack pointer address', t => {
  t.plan(1);
  t.context.pushStack16(0xffaa);
  t.context.pushStack8(0);
  t.context.pushStack16(0);
  t.is(t.context.registerSP, 0x100 + 5);
});
