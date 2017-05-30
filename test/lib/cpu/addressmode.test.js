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
  const instruction = { mode: MODE_INDEXEDINDIRECT };
  const result = CpuAddressMode.getAddress(t.context, instruction);
  t.is(result.address, 0);
  t.is(result.pageCrossed, false);
});
