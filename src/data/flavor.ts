import type { Flavor } from './schema'

// Small texture for the city: what exploring turns up when nothing else does,
// and the rumors survivors pass around. {zone} is the zone's name in a sentence.
export const flavor: Flavor = {
  explore: [
    'A wall is covered in handwritten warnings. Someone has crossed out half of them and written LIES across the rest.',
    'A radio in a parked car still plays music. Nobody comes to turn it off. You leave it on.',
    'Footprints in the dust lead somewhere you decide not to follow. Not yet.',
    'Someone has chalked a map on the pavement. Half of it is wrong. The wrong half is very detailed.',
    'A vending machine hums in the dark, fully stocked, every price set to zero. Nobody has touched it. You do not either.',
    'A dog sits on a doorstep, waiting. It watches you pass, decides you are not who it is waiting for, and goes back to waiting.',
  ],
  rumors: [
    'Rumor: something in {zone} has started singing at night.',
    'Rumor: a cache of supplies is buried somewhere in {zone}.',
    'Rumor: {zone} is safer than it looks. Nobody believes it.',
    "Rumor: someone saw the announcer's shadow over {zone}.",
  ],
}
