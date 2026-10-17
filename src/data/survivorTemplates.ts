import type { SurvivorTemplate } from './schema'

// Forty strangers, eight per personality, from an original, mixed-origin name pool.
const group = (personality: SurvivorTemplate['personality'], names: string[]): SurvivorTemplate[] =>
  names.map((name) => ({ name, personality }))

export const survivorTemplates: SurvivorTemplate[] = [
  ...group('brave', [
    'Mara Okonkwo', 'Kofi Brandt', 'Tamsin Oyelaran', 'Bruno Castellanos',
    'Asel Nurmagan', 'Dagny Holmqvist', 'Rafael Quispe', 'Hana Kovaříková',
  ]),
  ...group('cautious', [
    'Teodor Vasquez', 'Yuki Moreau', 'Eitan Albrecht', 'Noor Haddad',
    'Wim Oosterhout', 'Lucía Ferraro', 'Anselm Iwu', 'Meiling Sørensen',
  ]),
  ...group('kind', [
    'Ines Halloran', 'Dario Nakashima', 'Amara Lindgren', 'Tobiah Mensah',
    'Sunniva Okafor', 'Ilse Marangoni', 'Jomo Varga', 'Rosalind Adebayo',
  ]),
  ...group('ruthless', [
    'Ruslan Achterberg', 'Selin Abernathy', 'Viggo Strand', 'Kasia Wróbel',
    'Dmitri Halvorsen', 'Marisol Dunne', 'Okan Barlas', 'Greta Valtonen',
  ]),
  ...group('schemer', [
    'Pia Lindqvist', 'Ottilie Ferreira', 'Lazlo Mbatha', 'Corentin Aubry',
    'Zainab Kessler', 'Fenna Pruitt', 'Ravi Okoye', 'Saoirse Delacroix',
  ]),
]
