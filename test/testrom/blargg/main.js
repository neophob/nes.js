'use strict';

const testrunner = require('./testrunner');

const cpuTests = [

//  './testrom/ppu_vbl_nmi/rom_singles/01-vbl_basics.nes',
//  './testrom/ppu_vbl_nmi/rom_singles/02-vbl_set_time.nes',
//  './testrom/ppu_vbl_nmi/rom_singles/03-vbl_clear_time.nes',
  './testrom/ppu_vbl_nmi/rom_singles/04-nmi_control.nes',
  //'./testrom/ppu_vbl_nmi/rom_singles/05-nmi_timing.nes',
  './testrom/ppu_vbl_nmi/rom_singles/06-suppression.nes',
  './testrom/ppu_vbl_nmi/rom_singles/07-nmi_on_timing.nes',
  './testrom/ppu_vbl_nmi/rom_singles/08-nmi_off_timing.nes',
  './testrom/ppu_vbl_nmi/rom_singles/09-even_odd_frames.nes',
  './testrom/ppu_vbl_nmi/rom_singles/10-even_odd_timing.nes',
  './testrom/ppu_open_bus/ppu_open_bus.nes',

  './testrom/instr_test-v5/rom_singles/01-basics.nes',
  './testrom/instr_test-v5/rom_singles/02-implied.nes',
  './testrom/instr_test-v5/rom_singles/10-branches.nes',
  './testrom/instr_test-v5/rom_singles/11-stack.nes',
  './testrom/instr_test-v5/rom_singles/12-jmp_jsr.nes',
  './testrom/instr_test-v5/rom_singles/13-rts.nes',
  './testrom/instr_test-v5/rom_singles/14-rti.nes',
  './testrom/instr_test-v5/rom_singles/15-brk.nes',
  './testrom/instr_test-v5/rom_singles/16-special.nes',

  './testrom/instr_misc/rom_singles/01-abs_x_wrap.nes',
  './testrom/instr_misc/rom_singles/02-branch_wrap.nes',
  './testrom/instr_misc/rom_singles/03-dummy_reads.nes',

  './testrom/cpu_interrupts_v2/rom_singles/2-nmi_and_brk.nes',
  './testrom/cpu_interrupts_v2/rom_singles/3-nmi_and_irq.nes',
  './testrom/cpu_interrupts_v2/rom_singles/4-irq_and_dma.nes',


/*

Illegal NES Opcodes:
'./testrom/instr_test-v5/rom_singles/03-immediate.nes',
'./testrom/instr_test-v5/rom_singles/04-zero_page.nes',
'./testrom/instr_test-v5/rom_singles/05-zp_xy.nes',
'./testrom/instr_test-v5/rom_singles/06-absolute.nes',
'./testrom/instr_test-v5/rom_singles/07-abs_xy.nes',
'./testrom/instr_test-v5/rom_singles/08-ind_x.nes',
'./testrom/instr_test-v5/rom_singles/09-ind_y.nes',

APU:
'./testrom/instr_misc/rom_singles/04-dummy_reads_apu.nes',
'./testrom/cpu_interrupts_v2/rom_singles/1-cli_latency.nes',

  './testrom/cpu_interrupts_v2/rom_singles/5-branch_delays_irq.nes',

  './testrom/cpu_exec_space/test_cpu_exec_space_ppuio.nes'

  './testrom/cpu_reset/registers.nes',
  './testrom/cpu_reset/ram_after_reset.nes',

  './testrom/oam_read/oam_read.nes',
  './testrom/oam_stress/oam_stress.nes',

  mapper type 1 tests
  './testrom/instr_timing/instr_timing.nes',

  */
];

cpuTests.reduce((cur, test) => {
  return cur.then(() => {
    console.log('______RUN TEST', test, '__________________________________');
    return testrunner(test);
  });
}, Promise.resolve()).then(() => {
  console.log('ALL DONE!');
});
