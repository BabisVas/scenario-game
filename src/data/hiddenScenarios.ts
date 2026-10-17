import type { HiddenScenarioDef } from './schema'

// Never listed before they are found. When one is found, the system's voice slips:
// each announcement ends with one lowercase line, as if something else is speaking.
const notice = (...lines: string[]) => lines.join('\n')

export const hiddenScenarios: HiddenScenarioDef[] = [
  {
    id: 'the-regular',
    title: 'The Regular',
    announcement: notice(
      '[Objective: Kill 3 of the things living under your stall.]',
      '[Time limit: 10 hours.]',
      '[Reward: 150 coins. Riot Vest.]',
      '[Failure: The reward is withdrawn. Nothing else is withdrawn.]',
      '[you sleep so soundly here. we have been listening.]',
    ),
    trigger: { kind: 'repeat-action', zoneId: 'old-market', action: 'rest', count: 5 },
    goal: { kind: 'kill', count: 3 },
    hours: 10,
    rewards: { coins: 150, itemIds: ['riot-vest'] },
    rumor: 'They say if you sleep in the same market stall too often, the stall starts to keep you.',
  },
  {
    id: 'mirror-mirror',
    title: 'Mirror, Mirror',
    announcement: notice(
      '[Objective: Kill 2 spirits.]',
      '[Time limit: 8 hours.]',
      '[Reward: 220 coins. Ink-Stained Crown.]',
      '[Failure: The reward is withdrawn.]',
      '[the towers have been missing a piece of themselves. now they can see you through it.]',
    ),
    trigger: { kind: 'carry-item', itemId: 'mirror-shard', zoneId: 'glass-towers' },
    goal: { kind: 'kill', count: 2, enemyTag: 'spirit' },
    hours: 8,
    rewards: { coins: 220, itemIds: ['ink-stained-crown'] },
    rumor: 'Somebody swears the tower windows hum back when you bring them a piece of glass.',
  },
  {
    id: 'an-old-friend',
    title: 'An Old Friend',
    announcement: notice(
      '[Objective: Reach Clocktower Square.]',
      '[Time limit: 8 hours.]',
      '[Reward: 200 coins. Bell Fragment.]',
      '[Failure: The reward is withdrawn.]',
      '[four visits. they trust you now. they want to show you the door by the clock.]',
    ),
    trigger: { kind: 'meet-survivor', count: 4 },
    goal: { kind: 'reach', zoneId: 'clocktower-square' },
    hours: 8,
    rewards: { coins: 200, itemIds: ['bell-fragment'] },
    rumor: 'They say if you keep coming back to the same stranger, sooner or later they stop pretending.',
  },
  {
    id: 'the-last-train',
    title: 'The Last Train',
    announcement: notice(
      '[Objective: Be in the Subway Tunnels when the train arrives.]',
      '[Time limit: 10 hours.]',
      '[Reward: 300 coins. Salt Pearl.]',
      '[Failure: The reward is withdrawn.]',
      '[all aboard. the fare is already paid. we never said by whom.]',
    ),
    trigger: { kind: 'zone-during-scenario', zoneId: 'subway-tunnels', scenarioNumber: 5 },
    goal: { kind: 'survive', zoneId: 'subway-tunnels' },
    hours: 10,
    rewards: { coins: 300, itemIds: ['salt-pearl'] },
    rumor: 'When the lights go out, they say one train still runs under the city. It always has a seat free.',
  },
  {
    id: 'overdue',
    title: 'Overdue',
    announcement: notice(
      '[Objective: Kill 3 spirits.]',
      '[Time limit: 10 hours.]',
      '[Reward: 180 coins. Skill: Steady Breath.]',
      '[Failure: The reward is withdrawn.]',
      '[returns accepted at all hours. the librarians never left. they are very behind on their shelving.]',
    ),
    trigger: { kind: 'zone-during-scenario', zoneId: 'university-hill', scenarioNumber: 2 },
    goal: { kind: 'kill', count: 3, enemyTag: 'spirit' },
    hours: 10,
    rewards: { coins: 180, skillId: 'steady-breath' },
    rumor: 'A sign on the university gate says the library is accepting returns. Nobody alive put it there.',
  },
  {
    id: 'the-honest-toll',
    title: 'The Honest Toll',
    announcement: notice(
      '[Objective: Reach the Harbor Cranes.]',
      '[Time limit: 12 hours.]',
      '[Reward: 250 coins. Harbor Hook. Golden Tooth.]',
      '[Failure: The reward is withdrawn.]',
      '[nobody pays. you paid. the bridge would like to give something back, before it forgets your face.]',
    ),
    trigger: { kind: 'choose-option', scenarioId: 's04', optionId: 'pay-toll' },
    goal: { kind: 'reach', zoneId: 'harbor-cranes' },
    hours: 12,
    rewards: { coins: 250, itemIds: ['harbor-hook', 'golden-tooth'] },
    rumor: "They say there's a bridge that remembers who paid it honestly. Most people don't.",
  },
]
