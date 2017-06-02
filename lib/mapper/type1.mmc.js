'use strict';

/*

The Nintendo MMC1 is a mapper ASIC used in Nintendo's SxROM and NES-EVENT Game Pak boards. Most common SxROM boards are
assigned to iNES Mapper 1. This chip first appeared in the April of 1987.

PRG ROM capacity	512K
PRG ROM window	16K + 16K fixed or 32K
PRG RAM capacity	32K
PRG RAM window	8K
CHR capacity	128K
CHR window	4K + 4K or 8K


Banks:
  CPU $6000-$7FFF: 8 KB PRG RAM bank, fixed on all boards but SOROM and SXROM
  CPU $8000-$BFFF: 16 KB PRG ROM bank, either switchable or fixed to the first bank
  CPU $C000-$FFFF: 16 KB PRG ROM bank, either fixed to the last bank or switchable
  PPU $0000-$0FFF: 4 KB switchable CHR bank
  PPU $1000-$1FFF: 4 KB switchable CHR bank


*/
