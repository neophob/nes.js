'use strict';

/*

The generic designation UxROM refers to the Nintendo cartridge boards NES-UNROM, NES-UOROM, HVC-UN1ROM their HVC counterparts,
and clone boards.

Example games:
  Mega Man
  Castlevania
  Contra
  Duck Tales
  Metal Gear

Banks:
  CPU $8000-$BFFF: 16 KB switchable PRG ROM bank
  CPU $C000-$FFFF: 16 KB PRG ROM bank, fixed to the last bank

Registers:
  Bank select ($8000-$FFFF)

  7  bit  0
  ---- ----
  xxxx pPPP
       ||||
       ++++- Select 16 KB PRG ROM bank for CPU $8000-$BFFF
            (UNROM uses bits 2-0; UOROM uses bits 3-0)

Emulator implementations of iNES mapper 2 treat this as a full 8-bit bank select register, without bus conflicts. This allows the
mapper to be used for similar boards that are compatible. To make use of all 8-bits for a 4 MB PRG ROM, an NES 2.0 header must be
used (iNES can only effectively go to 2 MB). The original UxROM boards used by Nintendo were subject to bus conflicts, and the
relevant games all work around this in software. Some emulators (notably FCEUX) will have bus conflicts by default,
but others have none. NES 2.0 submappers were assigned to accurately specify whether the game should be emulated with bus conflicts.

*/
