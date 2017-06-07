'use strict';

const testrunner = require('./testrunner');

//TODO: what the difference between instr_test-v3 and nes_instr_test?
const cpuTests = [
//  './testrom/instr_misc/rom_singles/01-abs_x_wrap.nes',
//  './testrom/instr_misc/rom_singles/02-branch_wrap.nes',
  './testrom/instr_misc/rom_singles/03-dummy_reads.nes',
  './testrom/instr_misc/rom_singles/04-dummy_reads_apu.nes',

  './testrom/nes_instr_test/rom_singles/01-implied.nes',
  './testrom/nes_instr_test/rom_singles/09-branches.nes',
  './testrom/nes_instr_test/rom_singles/10-stack.nes',
  './testrom/nes_instr_test/rom_singles/11-special.nes',

  './testrom/cpu_interrupts_v2/rom_singles/1-cli_latency.nes',
  './testrom/cpu_interrupts_v2/rom_singles/2-nmi_and_brk.nes',
  './testrom/cpu_interrupts_v2/rom_singles/3-nmi_and_irq.nes',
  './testrom/cpu_interrupts_v2/rom_singles/4-irq_and_dma.nes',


/*
hangs,

The tests shouldn't rely on anything from the PPU. At the most, they might need $2002 to wait for VBL, but the symptom of that would be a hang, not a failure. Later versions don't require a PPU at all (I'm pretty sure I got that released).

  './testrom/nes_instr_test/rom_singles/02-immediate.nes',
  './testrom/nes_instr_test/rom_singles/03-zero_page.nes',
  './testrom/nes_instr_test/rom_singles/04-zp_xy.nes',
  './testrom/nes_instr_test/rom_singles/05-absolute.nes',
  './testrom/nes_instr_test/rom_singles/06-abs_xy.nes',
  './testrom/nes_instr_test/rom_singles/07-ind_x.nes',
  './testrom/nes_instr_test/rom_singles/08-ind_y.nes',

  './testrom/cpu_interrupts_v2/rom_singles/5-branch_delays_irq.nes',

  './testrom/cpu_exec_space/test_cpu_exec_space_ppuio.nes'

  './testrom/cpu_reset/registers.nes',
  './testrom/cpu_reset/ram_after_reset.nes',

  './testrom/oam_stress/oam_stress.nes',
  './testrom/oam_read/oam_read.nes',


  */
];


/*

mapper type 1 tests
'./testrom/instr_timing/instr_timing.nes',

*/

cpuTests.reduce((cur, test) => {
  return cur.then(() => {
    console.log('______RUN TEST', test, '__________________________________');
    return testrunner(test);
  });
}, Promise.resolve()).then(() => {
  console.log('ALL DONE!');
});



/*

RUN TEST ./testrom/nes_instr_test/rom_singles/03-zero_page.nes
65 ADC z
E5 SBC z


04-zp_xy.nes

75 ADC z,X
F5 SBC z,X


RUN TEST ./testrom/nes_instr_test/rom_singles/06-abs_xy.nes

7D ADC a,X
79 ADC a,Y
FD SBC a,X
F9 SBC a,Y

______RUN TEST ./testrom/nes_instr_test/rom_singles/10-stack.nes __________________________________
OUTPUT RC: 0
OUTPUT TXT: 48 PHA
OUTPUT RC: 0
OUTPUT TXT: 48 PHA
08 PHP
OUTPUT RC: 0
OUTPUT TXT: 48 PHA
08 PHP

10-stack

Failed
TEST FAILED ./testrom/nes_instr_test/rom_singles/10-stack.nes
______RUN TEST ./testrom/nes_instr_test/rom_singles/11-special.nes __________________________________
OUTPUT RC: 0
OUTPUT TXT: JMP ($6FF) should get high byte from $600

11-special

Failed #3

______RUN TEST ./testrom/instr_misc/rom_singles/03-dummy_reads.nes __________________________________
OUTPUT RC: 0
OUTPUT TXT: LDA abs,x

03-dummy_reads

Failed #3

*/
