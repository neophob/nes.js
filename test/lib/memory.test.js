'use strict';

import test from 'ava';
import Memory from '../../lib/memory';

test.beforeEach(t => {
  t.context = new Memory();
});

test('should write and read from memory (8b, 0x00)', t => {
  const value = 0x00;
  const offset = 0x6448;
  t.context.write8(offset, value);
  const result = t.context.read8(offset);
  t.is(result, value);
});

test('should write and read from memory (8b, 0x12)', t => {
  const value = 0x12;
  const offset = 0x6448;
  t.context.write8(offset, value);
  const result = t.context.read8(offset);
  t.is(result, value);
});

test('should write and read from memory (8b, 0xff)', t => {
  const value = 0xFF;
  const offset = 0x6448;
  t.context.write8(offset, value);
  const result = t.context.read8(offset);
  t.is(result, value);
});

test('should write and read from memory (16b, 0x0000)', t => {
  const value = 0x0000;
  const offset = 0x6448;
  t.context.write16(offset, value);
  const result = t.context.read16(offset);
  t.is(result, value);
});

test('should write and read from memory (16b, 0x1234)', t => {
  const value = 0x1234;
  const offset = 0x6448;
  t.context.write16(offset, value);
  const result = t.context.read16(offset);
  t.is(result, value);
});

test('should write and read from memory (16b, 0xffff)', t => {
  const value = 0xffff;
  const offset = 0x6448;
  t.context.write16(offset, value);
  const result = t.context.read16(offset);
  t.is(result, value);
});

test('should write / read from remapped memory', t => {
  const offset = 0x1800;
  const value = 0x0F;
  t.context.write8(offset, value);
  const result = t.context.read8(offset);
  t.is(result, value);
});
