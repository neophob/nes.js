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

Links:
- 6502 bugs: http://nesdev.com/6502bugs.txt

*/

const VECTOR_ADDR_NMI = 0xfffa;
const VECTOR_ADDR_RESET = 0xfffc;
const VECTOR_ADDDR_IRQ = 0xfffe;

//TODO rename to Cpu6502
class Cpu {

  //initial CPU state https://wiki.nesdev.com/w/index.php/CPU_ALL
  constructor(memory) {
    this.memory = memory;
    this.cycles = 0;
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
      interruptDisable: ((flags >>> 2) & 1) === 1,
      decimal: ((flags >>> 3) & 1) === 1,
      unusedBreak: ((flags >>> 4) & 1) === 1,
      unused2: ((flags >>> 5) & 1) === 1,
      overflow: ((flags >>> 6) & 1) === 1,
      negative: ((flags >>> 7) & 1) === 1,
    };
  }

  getRegisterP() {
    let flags = 0;
  	flags |= this.registerP.carry << 0;
  	flags |= this.registerP.zero << 1;
  	flags |= this.registerP.interruptDisable << 2;
  	flags |= this.registerP.decimal << 3;
  	flags |= this.registerP.unusedBreak << 4;
  	flags |= this.registerP.unused2 << 5;
  	flags |= this.registerP.overflow << 6;
  	flags |= this.registerP.negative << 7;
  	return flags;
  }

  interrupt(vectorAddress) {
    debug('irq requested', vectorAddress);

    //Push the program counter and status register on to the stack.
    this.pushStack16(this.registerPC);
    this.PHP();

    //Load the address of the interrupt handling routine from the vector table into the program counter.
    this.registerPC = this.memory.read16(vectorAddress);
    debug('Vector: %d, PC: %d', vectorAddress, this.registerPC);

    this.registerP.interruptDisable = true;
    //TODO wait for 7 cycles aka burn(7);
  }

  pushStack8(value) {
    const stackPointer = (this.registerSP & 0xffff) | memoryMap.MEMORY_OFFSET_STACK.offset;
    //debug('push stack at pos', stackPointer);
    this.memory.write8(stackPointer, value);
    this.registerSP--;
  }

  pushStack16(value) {
    const hi = (value >>> 8) & 0xff;
    const low = value & 0xff;
    this.pushStack8(hi);
    this.pushStack8(low);
  }

  popStack8() {
    this.registerSP++;
    const stackPointer = (this.registerSP & 0xffff) | memoryMap.MEMORY_OFFSET_STACK.offset;
    return this.memory.read8(stackPointer);
  }

  popStack16() {
    const low = this.popStack8();
    const hi = this.popStack8();
    return (hi<<8) | low;
  }

  setZeroAndNegativeFlag(value) {
    const value8 = value & 0xff;
    this.registerP.zero = value8 === 0;
    this.registerP.negative = ((value8 & 0x80) !== 0);
  }

  setFlagsCompare(valueA, valueB) {
    this.setZeroAndNegativeFlag(valueA - valueB);
    this.registerP.carry = valueA >= valueB;
  }

  // pagesDiffer returns true if the two addresses reference different pages
  pagesDiffer(a, b) {
  	return (a&0xFF00) !== (b&0xFF00);
  }

  // addBranchCycles adds a cycle for taking a branch and adds another cycle
  // if the branch jumps to a new page
  addBranchCycles(instruction) {
    this.cycles++;
    if (this.pagesDiffer(instruction.address, this.pc)) {
      this.cycles++;
    }
  }

  executeCycle() {
    //check for irq
    if (this.interruptPending) {
      debug('IRQ pending');
      this.interrupt(this.interruptPending);
      return;
    }

    const opcode = this.memory.read8(this.registerPC);
    const instruction = cpuOpcodes.getInstruction(opcode);
    debug('instruction %o %o %o', opcode, instruction, this.cycles);

    // ---
    let address;
    let offset;
    let pageCrossed = false;
    switch (instruction.mode) {
    	case 'absolute':
    		address = this.memory.read16(this.registerPC + 1);
        break;
    	case 'absoluteX':
    		address = this.memory.read16(this.registerPC + 1) + this.registerX;
    		pageCrossed = this.pagesDiffer(address - this.registerX, address);
        break;
    	case 'absoluteY':
    		address = this.memory.read16(this.registerPC + 1) + this.registerY;
    		pageCrossed = this.pagesDiffer(address - this.registerY, address);
        break;
    	case 'accumulator':
        // These instructions have register A (the accumulator) as the target. Examples are LSR A and ROL A.
    		address = 0;
        break;
    	case 'immediate':
        //These instructions have their data defined as the next byte after the opcode. ORA #$B2 will
        //perform a logical (also called bitwise) of the value B2 with the accumulator. Remember that
        //in assembly when you see a # sign, it indicates an immediate value. If $B2 was written without
        //a #, it would indicate an address or offset.
    		address = this.registerPC + 1;
        break;
    	case 'implied':
        //In an implied instruction, the data and/or destination is mandatory for the instruction.
        //For example, the CLC instruction is implied, it is going to clear the processor's Carry flag.
    		address = 0;
        break;
    	case 'indexedIndirect':
        //This mode is only used with the X register.
        //Indexed Indirect instructions are 2 bytes - the second byte is the zero-page address - $20
        //in the example. Obviously the fetched address has to be stored in the zero page.
        offset = this.memory.read16(this.registerPC + 1);
        address = this.memory.read16Bug(offset + this.registerX);
        break;
    	case 'indirect':
        address = this.memory.read16Bug(this.registerPC + 1);
        break;
    	case 'indirectIndexed':
        //This mode is only used with the Y register
        //Indirect Indexed instructions are 2 bytes - the second byte is the zero-page address - $20
        //in the example. (So the fetched address has to be stored in the zero page.)
        offset = this.memory.read16(this.registerPC + 1);
        address = this.memory.read16Bug(offset) + this.registerY;
    		pageCrossed = this.pagesDiffer(address - this.registerY, address);
        break;
    	case 'relative':
        //Relative addressing on the 6502 is only used for branch operations. The byte after the opcode
        //is the branch offset. If the branch is taken, the new address will the the current PC plus the
        //offset. The offset is a signed byte, so it can jump a maximum of 127 bytes forward, or 128 bytes
        //backward. (For more info about signed numbers, check here.)
        //TODO needs some work here
        offset = this.memory.read8(this.registerPC + 1);
    		address = this.registerPC + offset;
        /*        offset = this.memory.read16(this.registerPC + 1);
        debug('modeRelative, offset: %d, pc', offset, this.registerPC);
    		if (offset < 0x80) {
    			address = this.registerPC + 2 + offset;
    		} else {
    			address = this.registerPC + 2 + offset - 0x100;
    		}*/
        break;
    	case 'zeroPage':
        //Zero-Page is an addressing mode that is only capable of addressing the first 256 bytes of the
        //CPU's memory map. You can think of it as absolute addressing for the first 256 bytes. The
        //instruction LDA $35 will put the value stored in memory location $35 into A. The advantage of
        //zero-page are two - the instruction takes one less byte to specify, and it executes in less CPU
        //cycles. Most programs are written to store the most frequently used variables in the first 256
        //memory locations so they can take advantage of zero page addressing.
    		address = this.memory.read16(this.registerPC + 1);
        break;
    	case 'zeroPageX':
    		address = this.memory.read16(this.registerPC + 1) + this.registerX;
        break;
    	case 'zeroPageY':
    		address = this.memory.read16(this.registerPC + 1) + this.registerY;
        break;
    }

    // ---

    this.registerPC += instruction.size;
    debug('this.registerPC %o', this.registerPC);

    this.cycles += instruction.cycles;
    if (pageCrossed) {
      this.cycles += instruction.pageCycles;
    }
    this[instruction.name]({ address, mode: instruction.mode });
  }

  ADC(instruction) {
    // ADC - Add with Carry
    // 6502BUG: The ADC and SBC instructions don't set N,V, and Z status bits if decimal
    // mode is on. C status is set correctly.

    const addValue = this.memory.read8(instruction.address);
    const product = addValue + this.registerA + this.registerP.carry;
    this.registerA = product & 0xff;
    this.setZeroAndNegativeFlag(this.registerA);
    this.registerP.carry = product > 0xff;
    this.registerP.overflow = !!((this.registerA ^ product) & (addValue ^ product) & 0x80) && 1;
  }

  AND(instruction) {
    // AND - Logical AND
    this.registerA = this.registerA & this.memory.read8(instruction.address);
    this.setZeroAndNegativeFlag(this.registerA);
  }

//TODO ASL

  BCC(instruction) {
    // BCC - Branch if Carry Clear
    if (!this.registerP.carry) {
      this.registerPC = instruction.address;
      this.addBranchCycles(instruction);
    }
  }

  BCS(instruction) {
    // BCS - Branch if Carry Set
    if (this.registerP.carry) {
      this.registerPC = instruction.address;
      this.addBranchCycles(instruction);
    }
  }

  BEQ(instruction) {
    // BEQ - Branch if Equal
    if (this.registerP.zero) {
      this.registerPC = instruction.address;
      this.addBranchCycles(instruction);
    }
  }

  BIT(instruction) {
    // BIT - Bit Test
    const value = this.memory.read8(instruction.address);
    this.registerP.overflow = ((value >>> 6) & 1) === 1;
    this.setZeroAndNegativeFlag(value);
    this.registerP.zero = (value & this.registerA) === 0;

  }

  BMI(instruction) {
    // BMI - Branch if Minus
    if (this.registerP.negative) {
      this.registerPC = instruction.address;
      this.addBranchCycles(instruction);
    }
  }

  BNE(instruction) {
    if (!this.registerP.zero) {
      debug('branch to %d', instruction.address);
      this.registerPC = instruction.address;
      this.addBranchCycles(instruction);
    }
  }

  BPL(instruction) {
    // BPL - Branch if Positive
    if (!this.registerP.negative) {
      this.registerPC = instruction.address;
      this.addBranchCycles(instruction);
    }
  }

  BRK() {
    // BRK - Force Interrupt
    this.pushStack16(this.registerPC);
  	this.PHP();
  	this.SEI();
    this.registerPC = this.memory.read16(VECTOR_ADDDR_IRQ);
  }

  BVC(instruction) {
    // BVC - Branch if Overflow Clear
    if (!this.registerP.overflow) {
      this.registerPC = instruction.address;
      this.addBranchCycles(instruction);
    }
  }

  BVS(instruction) {
    // BVS - Branch if Overflow Set
    if (this.registerP.overflow) {
      this.registerPC = instruction.address;
      this.addBranchCycles(instruction);
    }
  }

  CLC() {
    // CLC - Clear Carry Flag
    this.registerP.carry = false;
  }

  CLD() {
    // CLD - Clear Decimal Mode
    this.registerP.decimal = false;
  }

  CLI() {
    // CLI - Clear Interrupt Disable
    this.registerP.interruptDisable = false;
  }

  CLV() {
    // CLV - Clear Overflow Flag
    this.registerP.overflow = false;
  }

  CMP(instruction) {
    // CMP - Compare
    //TODO 8 bit or 16b? or handled in the instruction mode?
    const value = this.memory.read8(instruction.address);
    this.setFlagsCompare(this.registerA, value);
  }

  CPX(instruction) {
    // CPX - Compare X Register
    const value = this.memory.read8(instruction.address);
    this.setFlagsCompare(this.registerX, value);
  }

  CPY(instruction) {
    // CPY - Compare Y Register
    const value = this.memory.read8(instruction.address);
    this.setFlagsCompare(this.registerY, value);
  }

  DEC(instruction) {
    // DEC - Decrement Memory
    const value = (this.memory.read8(instruction.address) - 1) & 0xff;
    this.memory.write8(instruction.address, value);
    this.setZeroAndNegativeFlag(value);
  }

  DEX() {
    // DEX - Decrement X Register
    this.registerX = (this.registerX -1) & 0xff;
    this.setZeroAndNegativeFlag(this.registerX);
  }

  DEY() {
    // DEY - Decrement Y Register
    this.registerY = (this.registerY -1) & 0xff;
    this.setZeroAndNegativeFlag(this.registerY);
  }

  //TODO EOR

  INC(instruction) {
    // INC - Increment Memory
    const value = (this.memory.read8(instruction.address) + 1) & 0xff;
    this.memory.write8(instruction.address, value);
    this.setZeroAndNegativeFlag(value);
  }

  INX() {
    // INX - Increment X Register
    this.registerX = (this.registerX + 1) & 0xff;
    this.setZeroAndNegativeFlag(this.registerX);
  }

  INY() {
    // INY - Increment Y Register
    this.registerY = (this.registerY + 1) & 0xff;
    this.setZeroAndNegativeFlag(this.registerY);
  }

  JMP(instruction) {
    // JMP - Jump
    // TODO
    // 6502BUG: An indirect JMP (xxFF) will fail because the MSB will be fetched from
    // address xx00 instead of page xx+1.
    this.registerPC = instruction.address;
  }

  JSR(instruction) {
    // JSR - Jump to Subroutine
    // 6502BUG: Return address pushed on the stack by JSR is one less than actual next
    // instruction.
    this.pushStack16(this.registerPC - 1);
    this.JMP(instruction);
  }

  LDA(instruction) {
    // LDA - Load Accumulator
    this.registerA = this.memory.read8(instruction.address);
    this.setZeroAndNegativeFlag(this.registerA);
  }

  LDX(instruction) {
    // LDX - Load X Register
    this.registerX = this.memory.read8(instruction.address);
    this.setZeroAndNegativeFlag(this.registerX);
  }

  LDY(instruction) {
    // LDY - Load Y Register
    this.registerY = this.memory.read8(instruction.address);
    this.setZeroAndNegativeFlag(this.registerY);
  }

  //TODO LSR

  NOP() {}

  ORA(instruction) {
    //ORA - Logical Inclusive OR
    this.registerA = this.registerA | this.memory.read8(instruction.address);
	  this.setZeroAndNegativeFlag(this.registerA);
  }

  PHA() {
    //PHA - Push Accumulator
    this.pushStack8(this.registerA);
  }

  PHP() {
    // PHP - Push Processor Status
    // 6502BUG: The status bits pushed on the stack by PHP have the breakpoint bit set.
    this.pushStack8(this.getRegisterP() | 0x10);
  }

  PLA() {
    // PLA - Pull Accumulator
    this.registerA = this.popStack8();
    this.setZeroAndNegativeFlag(this.registerA);
  }

  PLP() {
    // PLP - Pull Processor Status
    this.registerP = Cpu.updateRegisterP(
      //TODO unclear
      (this.popStack8() & 0xef) | 0x20
    );
  }

  ROL(instruction) {
    // ROL - Rotate Left
    const oldCarry = this.registerP.carry;
    if (instruction.mode === 'accumulator') {
      this.registerP.carry = ((this.registerA >>> 7) & 1) === 1;
      this.registerA = (this.registerA << 1) | oldCarry;
      this.setZeroAndNegativeFlag(this.registerA);
    } else {
      let value = this.memory.read8(instruction.address);
      this.registerP.carry = ((value >>> 7) & 1) === 1;
      value = (value << 1) | oldCarry;
      this.memory.write8(instruction.address, value);
      this.setZeroAndNegativeFlag(value);
    }
  }

  ROR(instruction) {
    // ROR - Rotate Right
    const oldCarry = this.registerP.carry;
    if (instruction.mode === 'accumulator') {
      this.registerP.carry = (this.registerA & 1) === 1;
      this.registerA = (this.registerA >>> 1) | (oldCarry << 7);
      this.setZeroAndNegativeFlag(this.registerA);
    } else {
      let value = this.memory.read8(instruction.address);
      this.registerP.carry = (value & 1) === 1;
      value = (value >>> 1) | (oldCarry << 7);
      this.memory.write8(instruction.address, value);
      this.setZeroAndNegativeFlag(value);
    }
  }

  RTI() {
    // RTI - Return from Interrupt
    this.PLP();
    this.registerPC = this.popStack16();
  }

  RTS() {
    // RTS - Return from Subroutine
    // 6502BUG: RTS increments PC after popping. RTI doesn't.
    this.registerPC = (this.popStack16() + 1) & 0xffff;
  }

  SBC(instruction) {
    // SBC - Subtract with Carry
    // 6502BUG: The ADC and SBC instructions don't set N,V, and Z status bits if decimal
    // mode is on.  C status is set correctly.
    const subtractValue = this.memory.read8(instruction.address);
    const temp = this.registerA - subtractValue - (1 - this.registerP.carry);
    this.registerA = temp & 0xff;
    this.setZeroAndNegativeFlag(this.registerA);
    this.registerP.carry = (temp >= 0);
    this.registerP.overflow = !!((this.registerA ^ temp) & (subtractValue ^ temp) & 0x80) && 1;
  }

  SEC() {
    // SEC - Set Carry Flag
    this.registerP.carry = true;
  }

  SED() {
    // SED - Set Decimal Flag
    this.registerP.decimal = true;
  }

  SEI() {
    // SEI - Set Interrupt Disable
    this.registerP.interruptDisable = true;
  }

  STA(instruction) {
    // STA - Store Accumulator
    this.memory.write8(instruction.address, this.registerA);
  }

  STX(instruction) {
    // STX - Store X Register
    this.memory.write8(instruction.address, this.registerX);
  }

  STY(instruction) {
    // STY - Store Y Register
    this.memory.write8(instruction.address, this.registerY);
  }

  TAX() {
    // TAX - Transfer Accumulator to X
    this.registerX = this.registerA;
    this.setZeroAndNegativeFlag(this.registerX);
  }

  TAY() {
    // TAY - Transfer Accumulator to Y
    this.registerY = this.registerA;
    this.setZeroAndNegativeFlag(this.registerY);
  }

  TSX() {
    // TSX - Transfer Stack Pointer to X
    this.registerX = this.registerSP;
    this.setZeroAndNegativeFlag(this.registerX);
  }

  TXA() {
    // TXA - Transfer X to Accumulator
    this.registerA = this.registerX;
    this.setZeroAndNegativeFlag(this.registerA);
  }

  TXS() {
    // TXS - Transfer X to Stack Pointer
    this.registerSP = this.registerX;
  }

  TYA() {
    // TYA - Transfer Y to Accumulator
    this.registerA = this.registerY;
    this.setZeroAndNegativeFlag(this.registerA);
  }

  // illegal opcodes
  AHX() {
    debug('invalid opcode AHX');
  }
  ALR() {
    debug('invalid opcode ALR');
  }
  ANC() {
    debug('invalid opcode ANC');
  }
  ARR() {
    debug('invalid opcode ARR');
  }
  AXS() {
    debug('invalid opcode AXS');
  }
  DCP() {
    debug('invalid opcode DCP');
  }
  ISC() {
    debug('invalid opcode ISC');
  }
  KIL() {
    debug('invalid opcode KIL');
  }
  LAS() {
    debug('invalid opcode LAS');
  }
  LAX() {
    debug('invalid opcode LAX');
  }
  RLA() {
    debug('invalid opcode RLA');
  }
  RRA() {
    debug('invalid opcode RRA');
  }
  SAX() {
    debug('invalid opcode SAX');
  }
  SHX() {
    debug('invalid opcode SHX');
  }
  SHY() {
    debug('invalid opcode SHY');
  }
  SLO() {
    debug('invalid opcode SLO');
  }
  SRE() {
    debug('invalid opcode SRE');
  }
  TAS() {
    debug('invalid opcode TAS');
  }
  XAA() {
    debug('invalid opcode XAA');
  }

}

module.exports = Cpu;
