'use strict';

import test from 'ava';
import Memory from '../../lib/memory';

test.beforeEach(t => {
  const mapper = {
    mapperWrite: false,
    mapperRead: false,
    write: function(offset) {
      this.mapperWrite = offset;
    },
    read: function(offset) {
      this.mapperRead = offset;
    }
  };
  const memory = new Memory();
  memory.registerMapper(mapper);
  t.context = memory;
});

test('should write and read from memory (8b, 0x00)', t => {
  const value = 0x00;
  const offset = 0x0448;
  t.context.write8(offset, value);
  const result = t.context.read8(offset);
  t.is(result, value);
});

test('should write and read from memory (8b, 0x12)', t => {
  const value = 0x12;
  const offset = 0x0448;
  t.context.write8(offset, value);
  const result = t.context.read8(offset);
  t.is(result, value);
});

test('should write and read from memory (8b, 0xff)', t => {
  const value = 0xFF;
  const offset = 0x0448;
  t.context.write8(offset, value);
  const result = t.context.read8(offset);
  t.is(result, value);
});

test('should write and read from memory (16b, 0x0000)', t => {
  const value = 0x0000;
  const offset = 0x0448;
  t.context.write16(offset, value);
  const result = t.context.read16(offset);
  t.is(result, value);
});

test('should write and read from memory (16b, 0x1234)', t => {
  const value = 0x1234;
  const offset = 0x0448;
  t.context.write16(offset, value);
  const result = t.context.read16(offset);
  t.is(result, value);
});

test('should write from mapper memory (16b, 0xffff)', t => {
  const value = 0xffff;
  const offset = 0x6448;
  t.context.write16(offset, value);
  t.is(t.context.mapper.mapperWrite, offset);
});

test('should read from mapper memory (16b, 0xffff)', t => {
  const value = 0xffff;
  const offset = 0x6448;
  t.context.read16(offset, value);
  t.is(t.context.mapper.mapperRead, offset);
});

test('should read from mapper memory, simulate cpu bug, (16b, 0xffff)', t => {
  const offset = 0x06FF;
  t.context.write8(offset, 0x34);
  t.context.write8(0x0600, 0x12);
  const result = t.context.read16Bug(offset);
  t.is(result, 0x1234);
});

test('should write / read from remapped memory', t => {
  const offset = 0x1800;
  const value = 0x0F;
  t.context.write8(offset, value);
  const result = t.context.read8(offset);
  t.is(result, value);
});
