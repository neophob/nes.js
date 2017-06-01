'use strict';

/*

The 6502 that powers the Nintendo stores its memory in Little-Endian

Address range Size    Device
$0000-$07FF	  $0800	  2KB internal RAM
  Address Range                Size in bytes        Notes (Page size = 256bytes)
  ($0000 - $00FF)                256                Zero Page - Special Zero Page addressing modes give faster memory read/write access
  ($0100 - $01FF)                256                Stack memory
  ($0200 - $07FF)                1536                RAM
$0800-$0FFF	  $0800	  Mirrors of $0000-$07FF
$1000-$17FF	  $0800
$1800-$1FFF	  $0800
$2000-$2007	  $0008	  NES PPU registers
$2008-$3FFF	  $1FF8	  Mirrors of $2000-2007 (repeats every 8 bytes)
$4000-$4017	  $0018	  NES APU and I/O registers
$4018-$401F	  $0008	  APU and I/O functionality that is normally disabled. See CPU Test Mode.
$4020-$FFFF	  $BFE0	  Cartridge space: PRG ROM, PRG RAM, and mapper registers (See Note)
  | Address | Size  | Description           |
  | $4020   | $1FDF | Expansion ROM - Used with Nintendo's MMC5 to expand the capabilities of VRAM.
  | $6000   | $2000 | SRAM - Save Ram used to save data between game plays
  | $8000   | $4000 | PRG-ROM lower bank - executable code
  | $C000   | $4000 | PRG-ROM upper bank - executable code

    $FFFA - $FFFB        2 bytes                Address of Non Maskable Interrupt (NMI) handler routine
    $FFFC - $FFFD        2 bytes                Address of Power on reset handler routine
    $FFFE - $FFFF        2 bytes                Address of Break (BRK instruction) handler routine
*/

const CPU_MEMORY_MAP = {
  'MEMORY_OFFSET_ZEROPAGE':     { offset: 0x0000, length: 0x00ff },
  'MEMORY_OFFSET_STACK':        { offset: 0x0100, length: 0x00ff },
  'MEMORY_OFFSET_RAM':          { offset: 0x0200, length: 0x0600 },

  'MEMORY_ADDR_PPU':            { offset: 0x4014, length: 1 },
  'MEMORY_ADDR_APU':            { offset: 0x4015, length: 1 },
  'MEMORY_ADDR_CONTROLLER1':    { offset: 0x4016, length: 1 },
  'MEMORY_ADDR_CONTROLLER2':    { offset: 0x4017, length: 1 },

  'MEMORY_OFFSET_PRGROM_LOW':   { offset: 0x8000, length: 0x4000 },
  'MEMORY_OFFSET_PRGROM_HIGH':  { offset: 0xC000, length: 0x4000 },
};

module.exports = CPU_MEMORY_MAP;
