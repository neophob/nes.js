'use strict';

//https://github.com/fogleman/nes/blob/master/nes/cpu.go

/*
// interrupt types
const (
	_ = iota
	interruptNone
	interruptNMI
	interruptIRQ
)

// addressing modes
const (
	_ = iota
  modeAbsolute
	modeAbsoluteX
	modeAbsoluteY
	modeAccumulator
	modeImmediate
	modeImplied
	modeIndexedIndirect
	modeIndirect
	modeIndirectIndexed
	modeRelative
	modeZeroPage
	modeZeroPageX
	modeZeroPageY
)
*/
const addressingMode = [
  'modeAbsolute',
	'modeAbsoluteX',
	'modeAbsoluteY',
	'modeAccumulator',
	'modeImmediate',
	'modeImplied',
	'modeIndexedIndirect',
	'modeIndirect',
	'modeIndirectIndexed',
	'modeRelative',
	'modeZeroPage',
	'modeZeroPageX',
	'modeZeroPageY'
];

const instructionModes = [
	6, 7, 6, 7, 11, 11, 11, 11, 6, 5, 4, 5, 1, 1, 1, 1,
	10, 9, 6, 9, 12, 12, 12, 12, 6, 3, 6, 3, 2, 2, 2, 2,
	1, 7, 6, 7, 11, 11, 11, 11, 6, 5, 4, 5, 1, 1, 1, 1,
	10, 9, 6, 9, 12, 12, 12, 12, 6, 3, 6, 3, 2, 2, 2, 2,
	6, 7, 6, 7, 11, 11, 11, 11, 6, 5, 4, 5, 1, 1, 1, 1,
	10, 9, 6, 9, 12, 12, 12, 12, 6, 3, 6, 3, 2, 2, 2, 2,
	6, 7, 6, 7, 11, 11, 11, 11, 6, 5, 4, 5, 8, 1, 1, 1,
	10, 9, 6, 9, 12, 12, 12, 12, 6, 3, 6, 3, 2, 2, 2, 2,
	5, 7, 5, 7, 11, 11, 11, 11, 6, 5, 6, 5, 1, 1, 1, 1,
	10, 9, 6, 9, 12, 12, 13, 13, 6, 3, 6, 3, 2, 2, 3, 3,
	5, 7, 5, 7, 11, 11, 11, 11, 6, 5, 6, 5, 1, 1, 1, 1,
	10, 9, 6, 9, 12, 12, 13, 13, 6, 3, 6, 3, 2, 2, 3, 3,
	5, 7, 5, 7, 11, 11, 11, 11, 6, 5, 6, 5, 1, 1, 1, 1,
	10, 9, 6, 9, 12, 12, 12, 12, 6, 3, 6, 3, 2, 2, 2, 2,
	5, 7, 5, 7, 11, 11, 11, 11, 6, 5, 6, 5, 1, 1, 1, 1,
	10, 9, 6, 9, 12, 12, 12, 12, 6, 3, 6, 3, 2, 2, 2, 2,
];

// instructionSizes indicates the size of each instruction in bytes
const instructionSizes = [
	1, 2, 0, 0, 2, 2, 2, 0, 1, 2, 1, 0, 3, 3, 3, 0,
	2, 2, 0, 0, 2, 2, 2, 0, 1, 3, 1, 0, 3, 3, 3, 0,
	3, 2, 0, 0, 2, 2, 2, 0, 1, 2, 1, 0, 3, 3, 3, 0,
	2, 2, 0, 0, 2, 2, 2, 0, 1, 3, 1, 0, 3, 3, 3, 0,
	1, 2, 0, 0, 2, 2, 2, 0, 1, 2, 1, 0, 3, 3, 3, 0,
	2, 2, 0, 0, 2, 2, 2, 0, 1, 3, 1, 0, 3, 3, 3, 0,
	1, 2, 0, 0, 2, 2, 2, 0, 1, 2, 1, 0, 3, 3, 3, 0,
	2, 2, 0, 0, 2, 2, 2, 0, 1, 3, 1, 0, 3, 3, 3, 0,
	2, 2, 0, 0, 2, 2, 2, 0, 1, 0, 1, 0, 3, 3, 3, 0,
	2, 2, 0, 0, 2, 2, 2, 0, 1, 3, 1, 0, 0, 3, 0, 0,
	2, 2, 2, 0, 2, 2, 2, 0, 1, 2, 1, 0, 3, 3, 3, 0,
	2, 2, 0, 0, 2, 2, 2, 0, 1, 3, 1, 0, 3, 3, 3, 0,
	2, 2, 0, 0, 2, 2, 2, 0, 1, 2, 1, 0, 3, 3, 3, 0,
	2, 2, 0, 0, 2, 2, 2, 0, 1, 3, 1, 0, 3, 3, 3, 0,
	2, 2, 0, 0, 2, 2, 2, 0, 1, 2, 1, 0, 3, 3, 3, 0,
	2, 2, 0, 0, 2, 2, 2, 0, 1, 3, 1, 0, 3, 3, 3, 0,
];

// instructionCycles indicates the number of cycles used by each instruction,
// not including conditional cycles
const instructionCycles = [
	7, 6, 2, 8, 3, 3, 5, 5, 3, 2, 2, 2, 4, 4, 6, 6,
	2, 5, 2, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7,
	6, 6, 2, 8, 3, 3, 5, 5, 4, 2, 2, 2, 4, 4, 6, 6,
	2, 5, 2, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7,
	6, 6, 2, 8, 3, 3, 5, 5, 3, 2, 2, 2, 3, 4, 6, 6,
	2, 5, 2, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7,
	6, 6, 2, 8, 3, 3, 5, 5, 4, 2, 2, 2, 5, 4, 6, 6,
	2, 5, 2, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7,
	2, 6, 2, 6, 3, 3, 3, 3, 2, 2, 2, 2, 4, 4, 4, 4,
	2, 6, 2, 6, 4, 4, 4, 4, 2, 5, 2, 5, 5, 5, 5, 5,
	2, 6, 2, 6, 3, 3, 3, 3, 2, 2, 2, 2, 4, 4, 4, 4,
	2, 5, 2, 5, 4, 4, 4, 4, 2, 4, 2, 4, 4, 4, 4, 4,
	2, 6, 2, 8, 3, 3, 5, 5, 2, 2, 2, 2, 4, 4, 6, 6,
	2, 5, 2, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7,
	2, 6, 2, 8, 3, 3, 5, 5, 2, 2, 2, 2, 4, 4, 6, 6,
	2, 5, 2, 8, 4, 4, 6, 6, 2, 4, 2, 7, 4, 4, 7, 7,
];

// instructionPageCycles indicates the number of cycles used by each
// instruction when a page is crossed
const instructionPageCycles = [
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0,
];

// instructionNames indicates the name of each instruction
const instructionNames = [
	'BRK', 'ORA', 'KIL', 'SLO', 'NOP', 'ORA', 'ASL', 'SLO',
	'PHP', 'ORA', 'ASL', 'ANC', 'NOP', 'ORA', 'ASL', 'SLO',
	'BPL', 'ORA', 'KIL', 'SLO', 'NOP', 'ORA', 'ASL', 'SLO',
	'CLC', 'ORA', 'NOP', 'SLO', 'NOP', 'ORA', 'ASL', 'SLO',
	'JSR', 'AND', 'KIL', 'RLA', 'BIT', 'AND', 'ROL', 'RLA',
	'PLP', 'AND', 'ROL', 'ANC', 'BIT', 'AND', 'ROL', 'RLA',
	'BMI', 'AND', 'KIL', 'RLA', 'NOP', 'AND', 'ROL', 'RLA',
	'SEC', 'AND', 'NOP', 'RLA', 'NOP', 'AND', 'ROL', 'RLA',
	'RTI', 'EOR', 'KIL', 'SRE', 'NOP', 'EOR', 'LSR', 'SRE',
	'PHA', 'EOR', 'LSR', 'ALR', 'JMP', 'EOR', 'LSR', 'SRE',
	'BVC', 'EOR', 'KIL', 'SRE', 'NOP', 'EOR', 'LSR', 'SRE',
	'CLI', 'EOR', 'NOP', 'SRE', 'NOP', 'EOR', 'LSR', 'SRE',
	'RTS', 'ADC', 'KIL', 'RRA', 'NOP', 'ADC', 'ROR', 'RRA',
	'PLA', 'ADC', 'ROR', 'ARR', 'JMP', 'ADC', 'ROR', 'RRA',
	'BVS', 'ADC', 'KIL', 'RRA', 'NOP', 'ADC', 'ROR', 'RRA',
	'SEI', 'ADC', 'NOP', 'RRA', 'NOP', 'ADC', 'ROR', 'RRA',
	'NOP', 'STA', 'NOP', 'SAX', 'STY', 'STA', 'STX', 'SAX',
	'DEY', 'NOP', 'TXA', 'XAA', 'STY', 'STA', 'STX', 'SAX',
	'BCC', 'STA', 'KIL', 'AHX', 'STY', 'STA', 'STX', 'SAX',
	'TYA', 'STA', 'TXS', 'TAS', 'SHY', 'STA', 'SHX', 'AHX',
	'LDY', 'LDA', 'LDX', 'LAX', 'LDY', 'LDA', 'LDX', 'LAX',
	'TAY', 'LDA', 'TAX', 'LAX', 'LDY', 'LDA', 'LDX', 'LAX',
	'BCS', 'LDA', 'KIL', 'LAX', 'LDY', 'LDA', 'LDX', 'LAX',
	'CLV', 'LDA', 'TSX', 'LAS', 'LDY', 'LDA', 'LDX', 'LAX',
	'CPY', 'CMP', 'NOP', 'DCP', 'CPY', 'CMP', 'DEC', 'DCP',
	'INY', 'CMP', 'DEX', 'AXS', 'CPY', 'CMP', 'DEC', 'DCP',
	'BNE', 'CMP', 'KIL', 'DCP', 'NOP', 'CMP', 'DEC', 'DCP',
	'CLD', 'CMP', 'NOP', 'DCP', 'NOP', 'CMP', 'DEC', 'DCP',
	'CPX', 'SBC', 'NOP', 'ISC', 'CPX', 'SBC', 'INC', 'ISC',
	'INX', 'SBC', 'NOP', 'SBC', 'CPX', 'SBC', 'INC', 'ISC',
	'BEQ', 'SBC', 'KIL', 'ISC', 'NOP', 'SBC', 'INC', 'ISC',
	'SED', 'SBC', 'NOP', 'ISC', 'NOP', 'SBC', 'INC', 'ISC',
];

module.exports.getInstruction = function(_opcode) {
  const opcode = _opcode & 0xff;
  const instructionMode = instructionModes[opcode];
  return {
    name: instructionNames[opcode],
    mode: addressingMode[instructionMode],
    size: instructionSizes[opcode],
    cycles: instructionCycles[opcode],
    pageCycles: instructionPageCycles[opcode]
  };
};
