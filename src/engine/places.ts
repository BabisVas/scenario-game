// Zone names inside sentences: "the Old Market", but "Riverside Park".

import type { Content } from '../data/schema'

/** A zone as a sentence names it. Names starting with "The" become "the …"; proper names stand alone. */
export function zoneRef(content: Content, zoneId: string): string {
  const z = content.zones.find((x) => x.id === zoneId)
  if (!z) return zoneId
  if (z.name.startsWith('The ')) return 'the ' + z.name.slice(4)
  return z.proper ? z.name : 'the ' + z.name
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
