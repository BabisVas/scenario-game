// Tuning values. Every number the engine balances against lives here.

export const ENERGY_MAX = 100
/** Real milliseconds per energy point: a full refill takes 8 hours. */
export const ENERGY_REGEN_MS_PER_POINT = 288_000
/** Real time away is counted up to 7 days and no further. */
export const CATCHUP_CAP_MS = 7 * 24 * 60 * 60 * 1000
export const WORLD_TICK_MS = 20 * 60 * 1000
export const WORLD_TICKS_MAX_PER_CATCHUP = 72
export const DIGEST_MAX_ENTRIES = 12
export const LOG_MAX_ENTRIES = 300
export const REST_PERIOD_HOURS = 24
export const SURVIVOR_COUNT = 40
export const STAT_START = 5
export const BACKGROUND_STAT_BONUS = 2
export const CONTRACT_INTEREST = 60
export const HOSTILE_INTEREST = -40
export const SAVE_KEY = 'scenario-game/save/v1'
/** Protect scenarios: wounds the ward can take, and the chance per action away from them. */
export const WARD_WOUNDS = 3
export const WARD_ATTACK_CHANCE = 0.2
/** Danger can climb past 5 as scenarios stack it; ambushes stop getting likelier here. */
export const AMBUSH_CHANCE_MAX = 0.5
/** Spirit: skill and stigma damage and all healing grow by this much per point above STAT_START. */
export const SPIRIT_PER_POINT = 0.04
export const SCHEMA_VERSION = 3
