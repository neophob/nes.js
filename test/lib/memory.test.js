'use strict';

import test from 'ava';
import Memory from '../../lib/memory';

test.beforeEach(t => {
  t.context = new Memory();
});

test('should push and pop 8bit data to/from the stack', t => {
  t.plan(2);
  t.context.pushStack8(0xfff);
  const result = t.context.popStack8();
  t.is(result, 0xff);
  t.is(t.context.stackPointer,0);
});

test('should push and pop 16bit data to/from the stack', t => {
  t.plan(2);
  t.context.pushStack16(0xffaa);
  const result = t.context.popStack16();
  t.is(result, 0xffaa);
  t.is(t.context.stackPointer,0);
});

test('should calculate the correct stack pointer address', t => {
  t.plan(1);
  t.context.pushStack16(0xffaa);
  t.context.pushStack8(0);
  t.context.pushStack16(0);
  t.is(t.context.stackPointer,5);
});

test('should read from memory (after push data to stack)', t => {
  t.plan(1);
  const value = 0x1234;
  t.context.pushStack16(value);
  const result = t.context.read16(0x0100);
  t.is(result, value);
});
