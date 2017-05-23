'use strict';

class Nes {
  constructor() {
    this.cpu = undefined;
    this.apu = undefined;
    this.ppu = undefined;
    this.rom = undefined;
    this.input = undefined;
    this.mapper = undefined;
    this.ram = [];
  }

  speak() {
  }
}

export default Nes;
