// The other survivors: they live, fight and die whether or not the player is watching.

import type { Content, ScenarioDef, SurvivorTemplate } from '../data/schema'
import { zoneDanger } from './actions'
import { rollAttribute } from './attributes'
import { startFight } from './combat'
import { SURVIVOR_COUNT } from './config'
import { hiddenRumor } from './hidden'
import { addItem, removeItem, sellPrice } from './inventory'
import { maxHp } from './newGame'
import type { Rng } from './rng'
import type { Combatant, GameEvent, GameState, StatKey, Step, Survivor, Tag } from './types'

export type Memory = 'helped' | 'robbed' | 'spared' | 'attacked' | 'betrayed' | 'traded'
export type TradeMode = 'buy' | 'sell' | 'overcharge' | 'rob'

/** Helping someone whose attitude is at least this counts as loyalty. */
const LOYAL_ATTITUDE = 30

const FAVORED: Record<SurvivorTemplate['personality'], StatKey[]> = {
  brave: ['strength', 'endurance'],
  cautious: ['agility', 'endurance'],
  ruthless: ['strength', 'agility'],
  kind: ['spirit', 'endurance'],
  schemer: ['agility', 'spirit'],
}

const power = (v: Survivor) => v.stats.strength + v.stats.agility + v.stats.endurance + v.stats.spirit

export function generateSurvivors(content: Content, rng: Rng): Survivor[] {
  const templates = [...content.survivorTemplates]
  for (let i = templates.length - 1; i > 0; i--) {
    const j = rng.int(0, i)
    ;[templates[i], templates[j]] = [templates[j], templates[i]]
  }
  const open = content.zones.filter((z) => !z.startsSealed).map((z) => z.id)

  return Array.from({ length: SURVIVOR_COUNT }, (_, i) => {
    const t = templates[i % templates.length]
    const round = Math.floor(i / templates.length)
    const name = round === 0 ? t.name : `${t.name} ${round + 1}`
    const stats = {} as Record<StatKey, number>
    for (const k of ['strength', 'agility', 'endurance', 'spirit'] as StatKey[]) {
      stats[k] = Math.min(9, rng.int(3, 7) + (FAVORED[t.personality].includes(k) ? 2 : 0))
    }
    return {
      id: `s-${i}`,
      name,
      personality: t.personality,
      stats,
      hp: maxHp(stats),
      alive: true,
      zoneId: rng.pick(open),
      partyId: null,
      met: false,
      attitude: 0,
      memories: [],
      points: 0,
      attributeId: rollAttribute(content, rng),
      timesMet: 0,
    }
  })
}

export function survivorsInZone(state: GameState, zoneId: string): Survivor[] {
  return state.survivors.filter((v) => v.alive && v.zoneId === zoneId)
}

export function remember(state: GameState, survivorId: string, memory: Memory, delta: number): GameState {
  return {
    ...state,
    survivors: state.survivors.map((v) =>
      v.id === survivorId
        ? { ...v, attitude: Math.max(-100, Math.min(100, v.attitude + delta)), memories: [memory, ...v.memories].slice(0, 5) }
        : v,
    ),
  }
}

/** True while the scenario at hand needs at least one met survivor to stay alive. */
function choiceAtStake(state: GameState, content: Content): boolean {
  if (state.pendingChoice?.source === 'scenario') return true
  const id = state.phase.kind === 'scenario' ? state.phase.scenarioId : state.phase.kind === 'rest' ? state.phase.nextScenarioId : null
  const def = id ? content.scenarios.find((d) => d.id === id) : undefined
  if (def?.goal.kind !== 'choice') return false
  return state.phase.kind !== 'scenario' || state.phase.progress < 1
}

function canDie(state: GameState, v: Survivor, content: Content): boolean {
  if (state.phase.kind === 'scenario' && state.phase.protectedSurvivorId === v.id) return false
  if (v.met && choiceAtStake(state, content)) {
    const livingMet = state.survivors.filter((x) => x.alive && x.met).length
    if (livingMet <= 1) return false
  }
  return true
}

const withSurvivor = (state: GameState, v: Survivor): GameState => ({
  ...state,
  survivors: state.survivors.map((x) => (x.id === v.id ? v : x)),
})

const RUMORS = [
  (z: string) => `Rumor: something in the ${z} has started singing at night.`,
  (z: string) => `Rumor: a cache of supplies is buried somewhere in the ${z}.`,
  (z: string) => `Rumor: the ${z} is safer than it looks. Nobody believes it.`,
  (z: string) => `Rumor: someone saw the announcer's shadow over the ${z}.`,
]

/** One real-time tick of the world. Never touches the player or the scenario clock. */
export function worldTick(state: GameState, rng: Rng, content: Content): Step {
  let s = state
  const events: GameEvent[] = []
  const count = rng.int(1, 3)

  for (let n = 0; n < count; n++) {
    const living = s.survivors.filter((v) => v.alive)
    if (living.length === 0) break
    const v = rng.pick(living)
    const zone = content.zones.find((z) => z.id === v.zoneId)

    if (rng.chance(0.2) && content.constellations.length > 0) {
      const c = rng.pick(content.constellations)
      events.push({ kind: 'constellation', text: `The constellation «${c.title}» is watching ${v.name}.` })
      continue
    }

    const roll = rng.int(0, 6)
    if (roll === 0 && !v.partyId) {
      const mates = living.filter((x) => x.id !== v.id && x.zoneId === v.zoneId && !x.partyId)
      if (mates.length > 0) {
        const mate = rng.pick(mates)
        const partyId = `p-${v.id}`
        s = withSurvivor(withSurvivor(s, { ...v, partyId }), { ...mate, partyId })
        events.push({ kind: 'survivor', text: `${v.name} and ${mate.name} form a party.` })
      }
    } else if (roll === 1 && v.partyId) {
      s = withSurvivor(s, { ...v, partyId: null })
      events.push({ kind: 'survivor', text: `${v.name} leaves their party.` })
    } else if (roll === 2 && v.partyId && (v.personality === 'ruthless' || v.personality === 'schemer')) {
      const victims = living.filter((x) => x.id !== v.id && x.partyId === v.partyId)
      if (victims.length > 0) {
        const victim = rng.pick(victims)
        const stolen = Math.min(victim.points, rng.int(1, 5))
        s = withSurvivor(s, { ...v, partyId: null, points: v.points + stolen })
        s = withSurvivor(s, { ...victim, partyId: null, points: victim.points - stolen })
        events.push({ kind: 'survivor', text: `${v.name} betrays ${victim.name} and walks off with their share.` })
      }
    } else if (roll === 3) {
      events.push({ kind: 'survivor', text: `${v.name} trades supplies with a stranger in the ${zone?.name ?? 'city'}.` })
    } else if (roll === 4 && !(s.phase.kind === 'scenario' && s.phase.protectedSurvivorId === v.id)) {
      const open = content.zones.filter((z) => z.id !== v.zoneId && !(s.zones[z.id]?.sealed ?? z.startsSealed))
      if (open.length > 0) {
        const to = rng.pick(open)
        s = withSurvivor(s, { ...v, zoneId: to.id, partyId: null })
        events.push({ kind: 'survivor', text: `${v.name} heads for the ${to.name}.` })
      }
    } else if (roll === 5 && zone) {
      events.push({ kind: 'survivor', text: rng.pick(RUMORS)(zone.name) })
    } else if (roll === 6 && zone) {
      const chance = zoneDanger(s, zone) * 0.01 * (1 - power(v) / 40)
      if (rng.chance(chance) && canDie(s, v, content)) {
        s = withSurvivor(s, { ...v, alive: false, hp: 0, partyId: null, deathNote: `Died in the ${zone.name}.` })
        events.push({ kind: 'survivor', text: `${v.name} died in the ${zone.name}.` })
      }
    }
  }
  events.push(...hiddenRumor(s, rng, content))
  return { state: s, events }
}

export function resolveScenarioForSurvivors(state: GameState, def: ScenarioDef, rng: Rng): Step {
  const protectedId = state.phase.kind === 'scenario' ? state.phase.protectedSurvivorId : undefined
  const died: Survivor[] = []
  const survivors = state.survivors.map((v) => {
    if (!v.alive) return v
    const chance = def.survivorDeathRate * Math.max(0.4, Math.min(1.4, 1.4 - power(v) / 30))
    if (v.id !== protectedId && rng.chance(chance)) {
      died.push(v)
      return { ...v, alive: false, hp: 0, partyId: null, deathNote: `Did not survive "${def.title}".` }
    }
    return { ...v, points: v.points + rng.int(3, 12) }
  })
  const remaining = survivors.filter((v) => v.alive).length
  const events: GameEvent[] = [{ kind: 'survivor', text: `${remaining} survivors remain.` }]
  for (const v of died.slice(0, 3)) events.push({ kind: 'survivor', text: `${v.name} did not make it.` })
  return { state: { ...state, survivors }, events }
}

export function survivorCombatant(v: Survivor): Combatant {
  return { name: v.name, stats: v.stats, hp: v.hp, maxHp: maxHp(v.stats), behavior: 'survivor', weaponPower: 2, armorPower: 1 }
}

function greeting(v: Survivor): string {
  if (v.attitude <= -50) return `${v.name} sees you and their hand goes to their weapon.`
  if (v.attitude < 0) return `${v.name} keeps their distance. "I remember you."`
  if (v.attitude >= 50) return `${v.name} grins. "There you are! Still alive, then."`
  switch (v.personality) {
    case 'brave':
      return `${v.name} nods. "Stick close if things get loud."`
    case 'cautious':
      return `${v.name} watches you for a long moment before speaking.`
    case 'ruthless':
      return `${v.name} sizes you up like a price tag.`
    case 'kind':
      return `${v.name} offers you half a sandwich. "You look like you need it."`
    case 'schemer':
      return `${v.name} smiles a little too quickly. "Friends, yes?"`
  }
}

export function meetSurvivor(state: GameState, zoneId: string, rng: Rng): Step {
  const here = survivorsInZone(state, zoneId)
  if (here.length === 0) return { state, events: [{ kind: 'survivor', text: 'Nobody here wants to be found.' }] }
  const strangers = here.filter((v) => !v.met)
  const v = rng.pick(strangers.length > 0 ? strangers : here)
  const s = withSurvivor(state, { ...v, met: true, timesMet: v.timesMet + 1 })
  const events: GameEvent[] = [{ kind: 'survivor', text: greeting(v) }]
  if (v.attitude <= -50 && rng.chance(0.5)) {
    const fight = startFight(s, survivorCombatant(v), 'survivor', { survivorId: v.id })
    return { state: fight.state, events: [...events, ...fight.events] }
  }
  return { state: s, events }
}

/** The price a survivor asks for an item: friends sell cheaper, enemies dearer. */
export function tradePrice(price: number, attitude: number): number {
  return Math.round(price * (1 - attitude / 200))
}

export function tradeWithSurvivor(
  state: GameState,
  survivorId: string,
  itemId: string,
  mode: TradeMode,
  content: Content,
): Step {
  const v = state.survivors.find((x) => x.id === survivorId)
  const def = content.items.find((i) => i.id === itemId)
  const refuse = (text: string): Step => ({ state, events: [{ kind: 'system', text }] })
  if (!v || !v.alive || !v.met) return refuse('There is nobody like that to trade with.')
  if (v.attitude <= -50) return refuse(`${v.name} will not trade with you.`)
  if (!def) return refuse('Nobody has heard of that.')

  if (mode === 'rob') {
    if (def.kind === 'rare') return refuse(`${v.name} does not have that.`)
    return {
      state: remember(addItem(state, itemId), v.id, 'robbed', -40),
      events: [{ kind: 'player', text: `You take the ${def.name} from ${v.name} and do not pay.`, tags: ['greed', 'cruelty'] }],
    }
  }
  if (mode === 'buy') {
    if (def.kind === 'rare') return refuse(`${v.name} is not selling that.`)
    const price = tradePrice(def.price, v.attitude)
    if (state.player.coins < price) return refuse(`Not enough coins: ${v.name} wants ${price}.`)
    const paid = addItem({ ...state, player: { ...state.player, coins: state.player.coins - price } }, itemId)
    return {
      state: remember(paid, v.id, 'traded', 3),
      events: [{ kind: 'survivor', text: `You buy a ${def.name} from ${v.name} for ${price} coins.` }],
    }
  }
  const removed = removeItem(state, itemId)
  if (!removed) return refuse('You have nothing like that to sell.')
  if (mode === 'overcharge') {
    const sold = { ...removed, player: { ...removed.player, coins: removed.player.coins + def.price } }
    return {
      state: remember(sold, v.id, 'robbed', -15),
      events: [{ kind: 'player', text: `You talk ${v.name} into paying ${def.price} coins for a ${def.name}. They will figure it out later.`, tags: ['greed'] }],
    }
  }
  const price = sellPrice(def)
  const sold = { ...removed, player: { ...removed.player, coins: removed.player.coins + price } }
  return {
    state: remember(sold, v.id, 'traded', 3),
    events: [{ kind: 'survivor', text: `You sell a ${def.name} to ${v.name} for ${price} coins.` }],
  }
}

/** Helping someone: a gift. Always merciful; loyal when they already like you (30+). */
export function giveToSurvivor(state: GameState, survivorId: string, itemId: string, content: Content): Step {
  const v = state.survivors.find((x) => x.id === survivorId)
  const def = content.items.find((i) => i.id === itemId)
  const removed = removeItem(state, itemId)
  if (!v || !v.alive || !v.met || !def || !removed) return { state, events: [{ kind: 'system', text: 'You cannot give that.' }] }
  const tags: Tag[] = v.attitude >= LOYAL_ATTITUDE ? ['mercy', 'loyalty'] : ['mercy']
  return {
    state: remember(removed, v.id, 'helped', 15),
    events: [{ kind: 'player', text: `You give ${v.name} your ${def.name}.`, tags }],
  }
}

export function attackSurvivor(state: GameState, survivorId: string): Step {
  const v = state.survivors.find((x) => x.id === survivorId)
  if (!v || !v.alive || state.fight) return { state, events: [] }
  let s = state
  for (const w of survivorsInZone(state, v.zoneId)) if (w.id !== v.id) s = remember(s, w.id, 'attacked', -20)
  s = remember(s, v.id, 'attacked', -50)
  const fight = startFight(s, survivorCombatant(v), 'survivor', { survivorId: v.id })
  return {
    state: fight.state,
    events: [{ kind: 'player', text: `You attack ${v.name}.`, tags: ['cruelty'] }, ...fight.events],
  }
}

/** The zone's trade action: find someone willing to deal. Each trade after that is free. */
export function findTrader(state: GameState, zoneId: string, rng: Rng): Step {
  const here = survivorsInZone(state, zoneId).filter((v) => v.attitude > -50)
  if (here.length === 0) return { state, events: [{ kind: 'survivor', text: 'Nobody here is willing to trade.' }] }
  const met = here.filter((v) => v.met)
  const v = rng.pick(met.length > 0 ? met : here)
  return {
    state: withSurvivor(state, { ...v, met: true }),
    events: [{ kind: 'survivor', text: `${v.name} is open to a trade.` }],
  }
}
