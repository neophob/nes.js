'use strict';

import test from 'ava';
import CpuAddressMode from '../../../lib/cpu/addressmode';
import Memory from '../../../lib/memory';

const MODE_ABSOLUTE = 'absolute';
const MODE_ABSOLUTEX = 'absoluteX';
const MODE_ABSOLUTEY = 'absoluteY';
const MODE_ACCUMULATOR = 'accumulator';
const MODE_IMMEDIATE = 'immediate';
const MODE_IMPLIED = 'implied';
const MODE_INDEXEDINDIRECT = 'indexedIndirect';
const MODE_INDIRECT = 'indirect';
const MODE_INDIRECTINDEXED = 'indirectIndexed';
const MODE_RELATIVE = 'relative';
const MODE_ZEROPAGE = 'zeroPage';
const MODE_ZEROPAGEX = 'zeroPageX';
const MODE_ZEROPAGEY = 'zeroPageY';

const DEFAULT_REGISTERPC = 0x1234;
const DEFAULT_REGISTER_X_VALUE = 0x10;
const DEFAULT_REGISTER_Y_VALUE = 0x00;

test.beforeEach(t => {
  const mockCpu = {
    registerPC: DEFAULT_REGISTERPC,
    memory: new Memory(),
    pagesDiffer: function() { return false; },
    registerX: DEFAULT_REGISTER_X_VALUE,
    registerY: 0
  };
  t.context = mockCpu;
});

test('should read MODE_ABSOLUTE address', t => {
  t.context.memory.write16(DEFAULT_REGISTERPC + 1, 0x3322);
  const instruction = { mode: MODE_ABSOLUTE };
  const result = CpuAddressMode.getAddress(t.context, instruction);
  t.is(result.address, 0x3322);
  t.is(result.pageCrossed, false);
});

test('should read MODE_ABSOLUTEX address', t => {
  t.context.memory.write16(DEFAULT_REGISTERPC + 1, 0x3322);
  const instruction = { mode: MODE_ABSOLUTEX };
  const result = CpuAddressMode.getAddress(t.context, instruction);
  t.is(result.address, DEFAULT_REGISTER_X_VALUE + 0x3322);
  t.is(result.pageCrossed, false);
});

test('should read MODE_ABSOLUTEY address', t => {
  t.context.memory.write16(DEFAULT_REGISTERPC + 1, 0x3322);
  const instruction = { mode: MODE_ABSOLUTEY };
  const result = CpuAddressMode.getAddress(t.context, instruction);
  t.is(result.address, DEFAULT_REGISTER_Y_VALUE + 0x3322);
  t.is(result.pageCrossed, false);
});

test('should read MODE_ACCUMULATOR address', t => {
  const instruction = { mode: MODE_ACCUMULATOR };
  const result = CpuAddressMode.getAddress(t.context, instruction);
  t.is(result.address, 0);
  t.is(result.pageCrossed, false);
});

test('should read MODE_IMMEDIATE address', t => {
  const instruction = { mode: MODE_IMMEDIATE };
  const result = CpuAddressMode.getAddress(t.context, instruction);
  t.is(result.address, DEFAULT_REGISTERPC + 1);
  t.is(result.pageCrossed, false);
});

test('should read MODE_IMPLIED address', t => {
  const instruction = { mode: MODE_IMPLIED };
  const result = CpuAddressMode.getAddress(t.context, instruction);
  t.is(result.address, 0);
  t.is(result.pageCrossed, false);
});

test('should read MODE_INDEXEDINDIRECT address', t => {
  t.context.memory.write8(DEFAULT_REGISTERPC + 1, 0x99);
  t.context.memory.write16(0x99 + DEFAULT_REGISTER_X_VALUE, 0x1155);
  const instruction = { mode: MODE_INDEXEDINDIRECT };
  const result = CpuAddressMode.getAddress(t.context, instruction);
  t.is(result.address, 0x1155);
  t.is(result.pageCrossed, false);
});

test('should read MODE_INDEXEDINDIRECT address, wrap around', t => {
  t.context.registerX = 0xff;
  t.context.memory.write8(DEFAULT_REGISTERPC + 1, 0xff);
  t.context.memory.write16(0xFE, 0x1155);
  const instruction = { mode: MODE_INDEXEDINDIRECT };
  const result = CpuAddressMode.getAddress(t.context, instruction);
  t.is(result.address, 0x1155);
  t.is(result.pageCrossed, false);
});

test('should read MODE_INDIRECT address', t => {
  t.context.memory.write16(DEFAULT_REGISTERPC + 1, 0xBEEF);
  t.context.memory.write16(0xBEEF, 0xF00D);
  const instruction = { mode: MODE_INDIRECT };
  const result = CpuAddressMode.getAddress(t.context, instruction);
  t.is(result.address, 0xF00D);
  t.is(result.pageCrossed, false);
});

test('should read MODE_INDIRECTINDEXED address', t => {
  t.context.memory.write8(DEFAULT_REGISTERPC + 1, 0x42);
  t.context.memory.write16(0x42 + DEFAULT_REGISTER_Y_VALUE, 0xF00D);
  const instruction = { mode: MODE_INDIRECTINDEXED };
  const result = CpuAddressMode.getAddress(t.context, instruction);
  t.is(result.address, 0xF00D);
  t.is(result.pageCrossed, false);
});

test('should read MODE_RELATIVE address, positive 0x00', t => {
  t.context.memory.write8(DEFAULT_REGISTERPC + 1, 0x00);
  const instruction = { mode: MODE_RELATIVE };
  const result = CpuAddressMode.getAddress(t.context, instruction);
  t.is(result.address, DEFAULT_REGISTERPC + 2);
  t.is(result.pageCrossed, false);
});

test('should read MODE_RELATIVE address, positive 0x7f', t => {
  t.context.memory.write8(DEFAULT_REGISTERPC + 1, 0x7f);
  const instruction = { mode: MODE_RELATIVE };
  const result = CpuAddressMode.getAddress(t.context, instruction);
  t.is(result.address, DEFAULT_REGISTERPC + 2 + 0x7f);
  t.is(result.pageCrossed, false);
});

test('should read MODE_RELATIVE address, negative -1', t => {
  t.context.memory.write8(DEFAULT_REGISTERPC + 1, 0xff);
  const instruction = { mode: MODE_RELATIVE };
  const result = CpuAddressMode.getAddress(t.context, instruction);
  t.is(result.address, DEFAULT_REGISTERPC + 2 - 1);
  t.is(result.pageCrossed, false);
});

test('should read MODE_RELATIVE address, negative -128', t => {
  t.context.memory.write8(DEFAULT_REGISTERPC + 1, 0x80);
  const instruction = { mode: MODE_RELATIVE };
  const result = CpuAddressMode.getAddress(t.context, instruction);
  t.is(result.address, DEFAULT_REGISTERPC + 2 - 0x80);
  t.is(result.pageCrossed, false);
});

test('should read MODE_ZEROPAGE address', t => {
  t.context.memory.write8(DEFAULT_REGISTERPC + 1, 0xff);
  const instruction = { mode: MODE_ZEROPAGE };
  const result = CpuAddressMode.getAddress(t.context, instruction);
  t.is(result.address, 0xff);
  t.is(result.pageCrossed, false);
});

test('should read MODE_ZEROPAGEX address', t => {
  t.context.memory.write8(DEFAULT_REGISTERPC + 1, 0x00);
  const instruction = { mode: MODE_ZEROPAGEX };
  const result = CpuAddressMode.getAddress(t.context, instruction);
  t.is(result.address, DEFAULT_REGISTER_X_VALUE);
  t.is(result.pageCrossed, false);
});

test('should read MODE_ZEROPAGEX address, wrap around', t => {
  t.context.memory.write8(DEFAULT_REGISTERPC + 1, 0xff);
  const instruction = { mode: MODE_ZEROPAGEX };
  const result = CpuAddressMode.getAddress(t.context, instruction);
  t.is(result.address, 15);
  t.is(result.pageCrossed, false);
});

test('should read MODE_ZEROPAGEY address', t => {
  t.context.memory.write8(DEFAULT_REGISTERPC + 1, 0x00);
  const instruction = { mode: MODE_ZEROPAGEY };
  const result = CpuAddressMode.getAddress(t.context, instruction);
  t.is(result.address, DEFAULT_REGISTER_Y_VALUE);
  t.is(result.pageCrossed, false);
});

test('should read MODE_ZEROPAGEY address, wrap around', t => {
  t.context.registerY = 0xff;
  t.context.memory.write8(DEFAULT_REGISTERPC + 1, 0xff);
  const instruction = { mode: MODE_ZEROPAGEY };
  const result = CpuAddressMode.getAddress(t.context, instruction);
  t.is(result.address, 0xfe);
  t.is(result.pageCrossed, false);
});

test('should fail to read file, invalid file', t => {
  t.throws(() => { CpuAddressMode.getAddress(t.context, {}) }, /INVALID_ADDRESS_MODE/);
});
