import type { ScenarioDef } from '../schema'
import { s01 } from './s01'
import { s02 } from './s02'
import { s03 } from './s03'
import { s04 } from './s04'
import { s05 } from './s05'
import { s06 } from './s06'
import { s07 } from './s07'
import { s08 } from './s08'
import { s09 } from './s09'
import { s10 } from './s10'

/** Every main scenario, in order. Add new scenario files here. */
export const scenarios: ScenarioDef[] = [s01, s02, s03, s04, s05, s06, s07, s08, s09, s10].sort((a, b) => a.number - b.number)
