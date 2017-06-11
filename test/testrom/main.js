'use strict';

const testrunner = require('./testrunner');

const cpuTests = [
  './testrom/instr_test-v4/rom_singles/01-basics.nes',
  './testrom/instr_test-v4/rom_singles/02-implied.nes',
  './testrom/instr_test-v4/rom_singles/10-branches.nes',
  './testrom/instr_test-v4/rom_singles/11-stack.nes',
  './testrom/instr_test-v4/rom_singles/12-jmp_jsr.nes',
  './testrom/instr_test-v4/rom_singles/13-rts.nes',
  './testrom/instr_test-v4/rom_singles/14-rti.nes',
  './testrom/instr_test-v4/rom_singles/15-brk.nes',
  './testrom/instr_test-v4/rom_singles/16-special.nes',

  './testrom/instr_misc/rom_singles/01-abs_x_wrap.nes',
  './testrom/instr_misc/rom_singles/02-branch_wrap.nes',
  './testrom/instr_misc/rom_singles/03-dummy_reads.nes',
  './testrom/instr_misc/rom_singles/04-dummy_reads_apu.nes',

  './testrom/cpu_interrupts_v2/rom_singles/1-cli_latency.nes',
  './testrom/cpu_interrupts_v2/rom_singles/2-nmi_and_brk.nes',
  './testrom/cpu_interrupts_v2/rom_singles/3-nmi_and_irq.nes',
  './testrom/cpu_interrupts_v2/rom_singles/4-irq_and_dma.nes',


/*
hangs,

Probably something systemic. Is your emulator generating any interrupts during the tests? That would modify the stack and cause failure. NMI and /IRQ should not be occurring during the tests.
The tests shouldn't rely on anything from the PPU. At the most, they might need $2002 to wait for VBL, but the symptom of that would be a hang, not a failure. Later versions don't require a PPU at all (I'm pretty sure I got that released).

  './testrom/instr_test-v4/rom_singles/03-immediate.nes',
  './testrom/instr_test-v4/rom_singles/04-zero_page.nes',
  './testrom/instr_test-v4/rom_singles/05-zp_xy.nes',
  './testrom/instr_test-v4/rom_singles/06-absolute.nes',
  './testrom/instr_test-v4/rom_singles/07-abs_xy.nes',
  './testrom/instr_test-v4/rom_singles/08-ind_x.nes',
  './testrom/instr_test-v4/rom_singles/09-ind_y.nes',

  './testrom/cpu_interrupts_v2/rom_singles/5-branch_delays_irq.nes',

  './testrom/cpu_exec_space/test_cpu_exec_space_ppuio.nes'

  './testrom/cpu_reset/registers.nes',
  './testrom/cpu_reset/ram_after_reset.nes',

  './testrom/oam_read/oam_read.nes',
  './testrom/oam_stress/oam_stress.nes',


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

______RUN TEST ./testrom/instr_misc/rom_singles/01-abs_x_wrap.nes __________________________________
OUTPUT RC: 0
OUTPUT TXT:
 Write wrap-around failed

01-abs_x_wrap

Failed #2


______RUN TEST ./testrom/instr_misc/rom_singles/03-dummy_reads.nes __________________________________
OUTPUT RC: 0
OUTPUT TXT:
 LDA abs,x


*/
