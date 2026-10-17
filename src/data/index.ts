import { attributes } from './attributes'
import { backgrounds } from './backgrounds'
import { constellations } from './constellations'
import { enemies } from './enemies'
import { greetings } from './greetings'
import { hiddenScenarios } from './hiddenScenarios'
import { items } from './items'
import type { Content } from './schema'
import { scenarios } from './scenarios'
import { skills } from './skills'
import { stigmas } from './stigmas'
import { subScenarios } from './subScenarios'
import { survivorTemplates } from './survivorTemplates'
import { zones } from './zones'

export const content: Content = {
  backgrounds,
  zones,
  enemies,
  items,
  skills,
  scenarios,
  constellations,
  survivorTemplates,
  subScenarios,
  attributes,
  stigmas,
  hiddenScenarios,
  greetings,
}
