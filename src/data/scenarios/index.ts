import type { ScenarioDef } from '../schema'
import { s01 } from './s01'

/** Every main scenario, in order. Add new scenario files here. */
export const scenarios: ScenarioDef[] = [s01].sort((a, b) => a.number - b.number)
