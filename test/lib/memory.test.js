'use strict';

import test from 'ava';
import Memory from '../../lib/memory';

test.beforeEach(t => {
  t.context = new Memory();
});

test('should write and read from memory (8b, 0x00)', t => {
  t.plan(1);
  const value = 0x00;
  const offset = 0x4444;
  t.context.write8(offset, value);
  const result = t.context.read8(offset);
  t.is(result, value);
});

test('should write and read from memory (8b, 0x12)', t => {
  t.plan(1);
  const value = 0x12;
  const offset = 0x4444;
  t.context.write8(offset, value);
  const result = t.context.read8(offset);
  t.is(result, value);
});

test('should write and read from memory (8b, 0xff)', t => {
  t.plan(1);
  const value = 0xFF;
  const offset = 0x4444;
  t.context.write8(offset, value);
  const result = t.context.read8(offset);
  t.is(result, value);
});

test('should write and read from memory (16b, 0x0000)', t => {
  t.plan(1);
  const value = 0x0000;
  const offset = 0x4448;
  t.context.write16(offset, value);
  const result = t.context.read16(offset);
  t.is(result, value);
});

test('should write and read from memory (16b, 0x1234)', t => {
  t.plan(1);
  const value = 0x1234;
  const offset = 0x4448;
  t.context.write16(offset, value);
  const result = t.context.read16(offset);
  t.is(result, value);
});

test('should write and read from memory (16b, 0xffff)', t => {
  t.plan(1);
  const value = 0xffff;
  const offset = 0x4448;
  t.context.write16(offset, value);
  const result = t.context.read16(offset);
  t.is(result, value);
});
