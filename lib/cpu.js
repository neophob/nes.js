'use strict';

const debug = require('debug')('nesjs:cpu');
const memoryMap = require('./memoryMap.js');

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

  constructor(memory) {
    this.memory = memory;
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
    this.registerP = 0;
    this.interruptDisable = false;
  }

  reset() {
    debug('reset');
    this.interrupt(VECTOR_ADDR_RESET);
  }

  interrupt(vectorAddress) {
    debug('irq requested', vectorAddress);

    //TODO check if interrupt disable is set

    //Push the program counter and status register on to the stack.
    this.memory.pushStack16(this.registerPC);
    this.memory.pushStack8(this.registerP);

    //Set the interrupt disable flag to prevent further interrupts.
    this.interruptDisable = true;

    //Load the address of the interrupt handling routine from the vector table into the program counter.
    this.registerPC = this.memory.read16(vectorAddress);
    debug('PC now contains', this.registerPC);
    //Execute the interrupt handling routine.

    //After executing a RTI (Return From Interrupt) instruction, pull the program counter and status register values from the stack.

    //Resume execution of the program.
  }
}

module.exports = Cpu;
