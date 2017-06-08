'use strict';

function getInt8(uint8) {
  return uint8 << 24 >> 24;
}

module.exports.getAddress = function(cpu, instruction) {
  let address;
  let offset;
  let pageCrossed = false;
  const nextPC = (cpu.registerPC + 1) & 0xffff;

  switch (instruction.mode) {
    case 'absolute':
      address = cpu.memory.read16(nextPC);
      return { address, pageCrossed };

    case 'absoluteX':
      address = cpu.memory.read16(nextPC) + cpu.registerX;
      pageCrossed = cpu.pagesDiffer(address - cpu.registerX, address);
      return { address, pageCrossed };

    case 'absoluteY':
      address = cpu.memory.read16(nextPC) + cpu.registerY;
      pageCrossed = cpu.pagesDiffer(address - cpu.registerY, address);
      return { address, pageCrossed };

    case 'accumulator':
      // These instructions have register A (the accumulator) as the target. Examples are LSR A and ROL A.
      address = 0;
      return { address, pageCrossed };

    case 'immediate':
      //These instructions have their data defined as the next byte after the opcode. ORA #$B2 will
      //perform a logical (also called bitwise) of the value B2 with the accumulator. Remember that
      //in assembly when you see a # sign, it indicates an immediate value. If $B2 was written without
      //a #, it would indicate an address or offset.
      address = nextPC;
      return { address, pageCrossed };

    case 'implied':
      //In an implied instruction, the data and/or destination is mandatory for the instruction.
      //For example, the CLC instruction is implied, it is going to clear the processor's Carry flag.
      address = 0;
      return { address, pageCrossed };

    case 'indexedIndirect':
      //This mode is only used with the X register. Consider a situation where the instruction is
      //LDA ($20,X), X contains $04, and memory at $24 contains 0024: 74 20,
      //First, X is added to $20 to get $24. The target address will be fetched from $24 resulting
      //in a target address of $2074. Register A will be loaded with the contents of memory at $2074.
      //
      //If X + the immediate byte will wrap around to a zero-page address. So you could code that
      //like targetAddress = X + opcode[1]) & 0xFF .
      //
      //Indexed Indirect instructions are 2 bytes - the second byte is the zero-page address - $20
      //in the example. Obviously the fetched address has to be stored in the zero page.
      offset = (cpu.memory.read8(nextPC) + cpu.registerX) & 0xff;
      address = cpu.memory.read16Bug(offset);
      return { address, pageCrossed };

    case 'indirect':
      //The JMP instruction is the only instruction that uses this addressing mode. It is a 3 byte instruction -
      //the 2nd and 3rd bytes are an absolute address. The set the PC to the address stored at that address.
      //So maybe this would be clearer:
      //  Memory:         1000    52 3a 04 d3   93 00 3f 93 84
      //  Instruction:    JMP ($1000)
      offset = cpu.memory.read16(nextPC);
      address = cpu.memory.read16Bug(offset);
      return { address, pageCrossed };

    case 'indirectIndexed':
      //This mode is only used with the Y register
      //Indirect Indexed instructions are 2 bytes - the second byte is the zero-page address - $20
      //in the example. (So the fetched address has to be stored in the zero page.)
      offset = cpu.memory.read8(nextPC);
      address = cpu.memory.read16Bug(offset) + cpu.registerY;
      pageCrossed = cpu.pagesDiffer(address - cpu.registerY, address);
      return { address, pageCrossed };

    case 'relative':
      //Relative addressing on the 6502 is only used for branch operations. The byte after the opcode
      //is the branch offset. If the branch is taken, the new address will the the current PC plus the
      //offset. The offset is a signed byte, so it can jump a maximum of 127 bytes forward, or 128 bytes
      //backward. (For more info about signed numbers, check here.)
      offset = cpu.memory.read8(nextPC);
      const isNegativeOffset = offset & 0x80;
      if (isNegativeOffset) {
        offset = getInt8(offset);
      }
      address = nextPC + 1 + offset;
      return { address, pageCrossed };

    case 'zeroPage':
      //Zero-Page is an addressing mode that is only capable of addressing the first 256 bytes of the
      //CPU's memory map. You can think of it as absolute addressing for the first 256 bytes. The
      //instruction LDA $35 will put the value stored in memory location $35 into A. The advantage of
      //zero-page are two - the instruction takes one less byte to specify, and it executes in less CPU
      //cycles. Most programs are written to store the most frequently used variables in the first 256
      //memory locations so they can take advantage of zero page addressing.
      address = cpu.memory.read8(nextPC);
      return { address, pageCrossed };

    case 'zeroPageX':
      address = (cpu.memory.read8(nextPC) + cpu.registerX) & 0xff;
      return { address, pageCrossed };

    case 'zeroPageY':
      address = (cpu.memory.read8(nextPC) + cpu.registerY) & 0xff;
      return { address, pageCrossed };

    default:
      throw new Error('INVALID_ADDRESS_MODE');
  }

};
