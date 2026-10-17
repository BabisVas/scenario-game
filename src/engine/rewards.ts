// How the record lists a reward: "50 coins. Bandage ×2. Skill: Second Wind".

import type { Content } from '../data/schema'

export function rewardList(content: Content, coins: number, itemIds: string[] = [], skillId?: string): string {
  const counts = new Map<string, number>()
  for (const id of itemIds) counts.set(id, (counts.get(id) ?? 0) + 1)
  const items = [...counts].map(([id, n]) => {
    const name = content.items.find((i) => i.id === id)?.name ?? id
    return n > 1 ? `${name} ×${n}` : name
  })
  const skill = skillId ? [`Skill: ${content.skills.find((k) => k.id === skillId)?.name ?? skillId}`] : []
  return [`${coins} coins`, ...items, ...skill].join('. ')
}
