'use strict';

const debug = require('debug')('nesjs:memory:translate.js');
const memoryMap = require('../cpu/memoryMap.js');
const MEMORY_ADDR_RAM = 0x2000;
const MEMORY_ADDR_PPU_REMAPPED = 0x4000;
const MEMORY_ADDR_APU_REMAPPED = 0x4020;
const MEMORY_ADDR_MAPPER = 0x6000;

function buildReturnModel(offset, subsystem) {
  return { offset, subsystem };
}

module.exports.getAddress = function(offset) {
  if (offset < MEMORY_ADDR_RAM) {
    return buildReturnModel(offset % 0x0800, 'cpu');
  }
  if (offset < MEMORY_ADDR_PPU_REMAPPED) {
    return buildReturnModel(0x2000 + offset % 8, 'ppu');
  }
  switch (offset) {
    case memoryMap.MEMORY_ADDR_PPU.offset:
      return buildReturnModel(offset, 'ppu');
    case memoryMap.MEMORY_ADDR_APU.offset:
      return buildReturnModel(offset, 'apu');
    case memoryMap.MEMORY_ADDR_CONTROLLER1.offset:
      return buildReturnModel(offset, 'controller');
    case memoryMap.MEMORY_ADDR_CONTROLLER2.offset:
      return buildReturnModel(offset, 'controller');
  }
  if (offset < MEMORY_ADDR_APU_REMAPPED) {
    return buildReturnModel(offset, 'apu');
  }
  if (offset >= MEMORY_ADDR_MAPPER) {
    // TODO use mapper here
    return buildReturnModel(offset, 'cpu');
  }
  debug('INVALID_OFFSET: %d', offset);
  return buildReturnModel(-1, 'invalid');
};
