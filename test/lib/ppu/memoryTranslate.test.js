'use strict';

import test from 'ava';
import MemoryTranslate from '../../../lib/ppu/memoryTranslate';

test('should read from mapper 0x00', t => {
  const result = MemoryTranslate.getAddress(0);
  t.is(result.subsystem, 'mapper');
  t.is(result.offset, 0);
});

test('should read from mapper 0x1fff', t => {
  const result = MemoryTranslate.getAddress(0x1fff);
  t.is(result.subsystem, 'mapper');
  t.is(result.offset, 0x1fff);
});

test('should read from nametable 0x2000', t => {
  const result = MemoryTranslate.getAddress(0x2000);
  t.is(result.subsystem, 'nametable');
  t.is(result.offset, 0x2000);
});

test('should read from nametable 0x3EFF', t => {
  const result = MemoryTranslate.getAddress(0x3EFF);
  t.is(result.subsystem, 'nametable');
  t.is(result.offset, 0x3EFF);
});

test('should read from palette 0x3F00', t => {
  const result = MemoryTranslate.getAddress(0x3F00);
  t.is(result.subsystem, 'palette');
  t.is(result.offset, 0x0000);
});

test('should read from palette 0x3FFF', t => {
  const result = MemoryTranslate.getAddress(0x3FFF);
  t.is(result.subsystem, 'palette');
  t.is(result.offset, 0x001F);
});

test('should wrap invalid offset', t => {
  const result = MemoryTranslate.getAddress(0x4000);
  t.is(result.subsystem, 'mapper');
  t.is(result.offset, 0x0000);
});
