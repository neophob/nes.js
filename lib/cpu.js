'use strict';

const debug = require('debug')('nesjs:cpu');
const memoryMap = require('./memoryMap.js');
const cpuOpcodes = require('./cpu.opcodes.js');

/*

The NES used the MOS 6502 (at 1.79 MHz) as its CPU. The 6502 is an 8-bit microprocessor that was designed in 1975. (Forty years ago!)
This chip was very popular — it was also used in the Atari 2600 & 800, Apple I & II, Commodore 64, VIC-20, BBC Micro and more.
In fact, a revision of the 6502 (the 65C02) is still in production today.

The 6502 had relatively few registers (A, X & Y) and they were special-purpose registers. However, its instructions had several
addressing modes including a “zero page” mode that could reference the first 256 words ($0000 — $00FF) in memory.
These opcodes required fewer bytes in program memory and fewer CPU cycles during execution.
One way of looking at this is that a developer can treat these 256 slots like “registers.”


The 6502 had a 16-bit address space, so it could reference up to 64 KB of memory. But, the NES had just 2 KB of RAM, at addresses $0000 to $0800.
The rest of the address space was for accessing the PPU, the APU, the game cartridge, input devices, etc.

Some address lines were unwired, so large blocks of the address space actually mirror other addresses. For example, $1000 to $1800 mirrors
the RAM at $0000 to $0800. Writing to $1000 is equivalent to writing to $0000

*/

const VECTOR_ADDR_NMI = 0xfffa;
const VECTOR_ADDR_RESET = 0xfffc;
const VECTOR_ADDDR_IRQ = 0xfffe;

class Cpu {

  //initial CPU state https://wiki.nesdev.com/w/index.php/CPU_ALL
  constructor(memory) {
    this.memory = memory;
    this.cycle = 0;
    //program counter, 16b
    this.registerPC = 0;
    //stack pointer
    this.registerSP = memoryMap.MEMORY_OFFSET_STACK.offset;
    //accumulator
    this.registerA = 0;
    //Index Register X
    this.registerX = 0;
    //Index Register Y
    this.registerY = 0;
    //Processor Status, 8b
    this.registerP = Cpu.updateRegisterP(0x34);
    this.interruptPending = false;
  }

  reset() {
    debug('reset');
    // -3 because the interrupt push 3 bytes to the stack, which else would be there for ever
    this.registerSP = memoryMap.MEMORY_OFFSET_STACK.offset - 3;
    this.interrupt(VECTOR_ADDR_RESET);
    debug('%o', this);
  }

  static updateRegisterP(flags) {
    return {
      carry: ((flags >>> 0) & 1) === 1,
      zero: ((flags >>> 1) & 1) === 1,
      interrupt: ((flags >>> 2) & 1) === 1,
      decimal: ((flags >>> 3) & 1) === 1,
      unused1: ((flags >>> 4) & 1) === 1,
      unused2: ((flags >>> 5) & 1) === 1,
      overflow: ((flags >>> 6) & 1) === 1,
      negative: ((flags >>> 7) & 1) === 1,
    };
  }

  getRegisterP() {
    let flags = 0;
  	flags |= this.registerP.carry << 0;
  	flags |= this.registerP.zero << 1;
  	flags |= this.registerP.interrupt << 2;
  	flags |= this.registerP.decimal << 3;
  	flags |= this.registerP.unused1 << 4;
  	flags |= this.registerP.unused2 << 5;
  	flags |= this.registerP.overflow << 6;
  	flags |= this.registerP.negative << 7;
  	return flags;
  }

  interrupt(vectorAddress) {
    debug('irq requested', vectorAddress);

    //Push the program counter and status register on to the stack.
    this.pushStack16(this.registerPC);
    //this.pushStack8(this.getRegisterP());
    //Push processor status
    this.PHP();

    //Load the address of the interrupt handling routine from the vector table into the program counter.
    this.registerPC = this.memory.read16(vectorAddress);
    debug('PC value', this.registerPC);

    //Set the interrupt disable flag to prevent further interrupts.
    this.registerP.interrupt = true;

    //TODO wait for 7 cycles aka burn(7);
  }

  pushStack16(value) {
    this.memory.write16(this.registerSP, value);
    this.registerSP += 2;
  }

  pushStack8(value) {
    this.memory.write8(this.registerSP, value);
    this.registerSP++;
  }

  popStack16() {
    this.registerSP -= 2;
    return this.memory.read16(this.registerSP);
  }

  popStack8() {
    this.registerSP--;
    return this.memory.read8(this.registerSP);
  }

  setZeroAndNegativeFlag(value) {
    const value8 = value & 0xff;
    if (value8 === 0) {
      this.registerP.zero = true;
    } else {
      this.registerP.zero = false;
    }

    if ((value8 & 0x80) !== 0) {
      this.registerP.negative = true;
    } else {
      this.registerP.negative = false;
    }
  }

  // pagesDiffer returns true if the two addresses reference different pages
  static pagesDiffer(a, b) {
  	return (a&0xFF00) !== (b&0xFF00);
  }

  executeCycle() {

    //check for irq
    if (this.interruptPending) {
      this.interrupt(interruptPending);
      return;
    }

    const opcode = this.memory.read8(this.registerPC);
    const instruction = cpuOpcodes.getInstruction(opcode);
    debug('instruction %o %o', opcode, instruction);

    // ---
    let address;
    let offset;
    let pageCrossed = false;
    switch (instruction.mode) {
    	case 'modeAbsolute':
    		address = this.memory.read16(this.registerPC + 1);
        break;
    	case 'modeAbsoluteX':
    		address = this.memory.read16(this.registerPC + 1) + this.registerX;
    		pageCrossed = this.pagesDiffer(address - this.registerX, address);
        break;
    	case 'modeAbsoluteY':
    		address = this.memory.read16(this.registerPC + 1) + this.registerY;
    		pageCrossed = this.pagesDiffer(address - this.registerY, address);
        break;
    	case 'modeAccumulator':
    		address = 0;
        break;
    	case 'modeImmediate':
    		address = this.registerPC + 1;
        break;
    	case 'modeImplied':
    		address = 0;
        break;
    	case 'modeIndexedIndirect':
//    		address = cpu.read16bug(uint16(cpu.Read(cpu.PC+1) + cpu.X))
        offset = this.registerPC + 1;
        //TODO
        address = this.memory.read16Bug(offset + this.registerX);
        break;
    	case 'modeIndirect':
        address = this.memory.read16Bug(this.registerPC + 1);
        break;
    	case 'modeIndirectIndexed':
    		//address = cpu.read16bug(uint16(cpu.Read(cpu.PC+1))) + uint16(cpu.Y)
        // TODO
        offset = this.registerPC + 1;
        address = this.memory.read16Bug(offset + this.registerY);
    		pageCrossed = this.pagesDiffer(address - this.registerY, address);
        break;
    	case 'modeRelative':
    		offset = this.memory.read16(this.registerPC + 1);
    		if (offset < 0x80) {
    			address = this.registerPC + 2 + offset;
    		} else {
    			address = this.registerPC + 2 + offset - 0x100;
    		}
        break;
    	case 'modeZeroPage':
    		address = this.memory.read16(this.registerPC + 1);
        break;
    	case 'modeZeroPageX':
    		address = this.memory.read16(this.registerPC + 1) + this.registerX;
        break;
    	case 'modeZeroPageY':
    		address = this.memory.read16(this.registerPC + 1) + this.registerY;
        break;
    }

    // ---

    this.registerPC += instruction.size;
    debug('this.registerPC %o', this.registerPC);

    this.cycle += instruction.cycles;
    if (pageCrossed) {
      this.cycle += instruction.pageCycles;
    }
    this[instruction.name]({ address, mode: instruction.mode });
  }

  BRK() {
    this.pushStack16(this.registerPC);
  	this.PHP();
  	this.SEI();
    this.registerPC = this.memory.read16(VECTOR_ADDDR_IRQ);
  }

  PHP() {
    //cpu.push(cpu.Flags() | 0x10)
    this.pushStack8(this.getRegisterP() | 0x10);
  }

  SEI() {
    // SEI - Set Interrupt Disable
    this.registerP.interrupt = true;
  }

  NOP() {}

  ORA(instruction) {
    //ORA - Logical Inclusive OR
    this.registerA = this.registerA | this.memory.read8(instruction.address);
	  this.setZeroAndNegativeFlag(this.registerA);
  }

  PHA() {
    this.pushStack8(this.getRegisterA());
  }

  JMP(instruction) {
    this.registerPC = instruction.address;
  }

  // illegal opcodes
  AHX() {}
  ALR() {}
  ANC() {}
  ARR() {}
  AXS() {}
  DCP() {}
  ISC() {}
  KIL() {}
  LAS() {}
  LAX() {}
  RLA() {}
  RRA() {}
  SAX() {}
  SHX() {}
  SHY() {}
  SLO() {}
  SRE() {}
  TAS() {}
  XAA() {}

}




module.exports = Cpu;
