'use strict';

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
class Cpu {
  // TODO implements all needed instructions
  constructor() {
  }

  foo() {
  }
}

module.exports = Cpu;
