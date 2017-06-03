'use strict';

import test from 'ava';
import MemoryTranslate from '../../../lib/memory/translate';

test('should read RAM 0x00', t => {
  const result = MemoryTranslate.getAddress(0);
  t.is(result.subsystem, 'cpu');
  t.is(result.offset, 0);
});

test('should read RAM 0x07ff', t => {
  const result = MemoryTranslate.getAddress(0x07ff);
  t.is(result.subsystem, 'cpu');
  t.is(result.offset, 0x07ff);
});

test('should read RAM 0x0800, translate to 0x0000', t => {
  const result = MemoryTranslate.getAddress(0x0800);
  t.is(result.subsystem, 'cpu');
  t.is(result.offset, 0);
});

test('should read RAM 0x1000, translate to 0x0000', t => {
  const result = MemoryTranslate.getAddress(0x1000);
  t.is(result.subsystem, 'cpu');
  t.is(result.offset, 0);
});

test('should read PPU memory at 0x2006', t => {
  const result = MemoryTranslate.getAddress(0x2006);
  t.is(result.subsystem, 'ppu');
  t.is(result.offset, 0x2006);
});

test('should read PPU memory at 0x2007', t => {
  const result = MemoryTranslate.getAddress(0x2007);
  t.is(result.subsystem, 'ppu');
  t.is(result.offset, 0x2007);
});

test('should read PPU 0x2008, remap to 0x2000', t => {
  const result = MemoryTranslate.getAddress(0x2008);
  t.is(result.subsystem, 'ppu');
  t.is(result.offset, 0x2000);
});

test('should read PPU 0x3FFF, remap to 0x2007', t => {
  const result = MemoryTranslate.getAddress(0x3FFF);
  t.is(result.subsystem, 'ppu');
  t.is(result.offset, 0x2007);
});

test('should read PPU 0x4014', t => {
  const result = MemoryTranslate.getAddress(0x4014);
  t.is(result.subsystem, 'ppu');
  t.is(result.offset, 0x4014);
});

test('should read APU 0x4015', t => {
  const result = MemoryTranslate.getAddress(0x4015);
  t.is(result.subsystem, 'apu');
  t.is(result.offset, 0x4015);
});

test('should read CONTROLLER1 0x4016', t => {
  const result = MemoryTranslate.getAddress(0x4016);
  t.is(result.subsystem, 'controller');
  t.is(result.offset, 0x4016);
});

test('should read CONTROLLER2 0x4017', t => {
  const result = MemoryTranslate.getAddress(0x4017);
  t.is(result.subsystem, 'controller');
  t.is(result.offset, 0x4017);
});

test('should read APU 0x4000', t => {
  const result = MemoryTranslate.getAddress(0x4000);
  t.is(result.subsystem, 'apu');
  t.is(result.offset, 0x4000);
});

test('should read APU 0x4019', t => {
  const result = MemoryTranslate.getAddress(0x4019);
  t.is(result.subsystem, 'apu');
  t.is(result.offset, 0x4019);
});

test('should not read memory at 0x4020', t => {
  const result = MemoryTranslate.getAddress(0x4020);
  t.is(result.subsystem, 'invalid');
  t.is(result.offset, -1);
});

test('should not read memory at 0x5FFF', t => {
  const result = MemoryTranslate.getAddress(0x5FFF);
  t.is(result.subsystem, 'invalid');
  t.is(result.offset, -1);
});

test('should not read memory at 0x6000', t => {
  const result = MemoryTranslate.getAddress(0x6000);
  t.is(result.subsystem, 'mapper');
  t.is(result.offset, 0x6000);
});

test('should not read memory at 0xFFFF', t => {
  const result = MemoryTranslate.getAddress(0xFFFF);
  t.is(result.subsystem, 'mapper');
  t.is(result.offset, 0xFFFF);
});
