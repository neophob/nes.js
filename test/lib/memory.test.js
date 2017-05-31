'use strict';

import test from 'ava';
import Memory from '../../lib/memory';

test.beforeEach(t => {
  t.context = new Memory();
});

test('should write and read from memory (8b, 0x00)', t => {
  const value = 0x00;
  const offset = 0x4444;
  t.context.write8(offset, value);
  const result = t.context.read8(offset);
  t.is(result, value);
});

test('should write and read from memory (8b, 0x12)', t => {
  const value = 0x12;
  const offset = 0x4444;
  t.context.write8(offset, value);
  const result = t.context.read8(offset);
  t.is(result, value);
});

test('should write and read from memory (8b, 0xff)', t => {
  const value = 0xFF;
  const offset = 0x4444;
  t.context.write8(offset, value);
  const result = t.context.read8(offset);
  t.is(result, value);
});

test('should write and read from memory (16b, 0x0000)', t => {
  const value = 0x0000;
  const offset = 0x4448;
  t.context.write16(offset, value);
  const result = t.context.read16(offset);
  t.is(result, value);
});

test('should write and read from memory (16b, 0x1234)', t => {
  const value = 0x1234;
  const offset = 0x4448;
  t.context.write16(offset, value);
  const result = t.context.read16(offset);
  t.is(result, value);
});

test('should write and read from memory (16b, 0xffff)', t => {
  const value = 0xffff;
  const offset = 0x4448;
  t.context.write16(offset, value);
  const result = t.context.read16(offset);
  t.is(result, value);
});

test('should remap memory (internal ram), 0x0800', t => {
  const offset = 0x0800;
  const result = t.context._adjustMirroredOffset(offset);
  t.is(result, 0x0000);
});

test('should remap memory (internal ram), 0x0FFF', t => {
  const offset = 0x0FFF;
  const result = t.context._adjustMirroredOffset(offset);
  t.is(result, 0x07FF);
});

test('should remap memory (internal ram), 0x1000', t => {
  const offset = 0x1000;
  const result = t.context._adjustMirroredOffset(offset);
  t.is(result, 0x0000);
});

test('should remap memory (internal ram), 0x1800', t => {
  const offset = 0x1800;
  const result = t.context._adjustMirroredOffset(offset);
  t.is(result, 0x0000);
});

test('should NOT remap memory (internal ram), 0x2007', t => {
  const offset = 0x2007;
  const result = t.context._adjustMirroredOffset(offset);
  t.is(result, 0x2007);
});

test('should remap memory (internal ram), 0x2008', t => {
  const offset = 0x2008;
  const result = t.context._adjustMirroredOffset(offset);
  t.is(result, 0x2000);
});

test('should remap memory (internal ram), 0x2088', t => {
  const offset = 0x2088;
  const result = t.context._adjustMirroredOffset(offset);
  t.is(result, 0x2000);
});

test('should write / read from remapped memory', t => {
  const offset = 0x1800;
  const value = 0x0F;
  t.context.write8(offset, value);
  const result = t.context.read8(0);
  t.is(result, value);
});
