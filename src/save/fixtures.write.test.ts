/// <reference types="node" />
// Records the saved game and save shape of the current save version.
// Run with `npm run save:fixtures` after bumping SCHEMA_VERSION. It never
// overwrites a version that already has its files: those are shipped saves.

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { SCHEMA_VERSION } from '../engine/config'
import { playedGame, richState } from '../test/saveFixtures'
import { saveShape } from './saveShape'

const writing = import.meta.env.MODE === 'fixtures'

test.runIf(writing)('record the current version\'s saved game and shape', () => {
  const dir = join(process.cwd(), 'src/save/fixtures')
  mkdirSync(dir, { recursive: true })
  const files: [string, unknown][] = [
    [`save-v${SCHEMA_VERSION}.json`, playedGame()],
    [`shape-v${SCHEMA_VERSION}.json`, saveShape(richState())],
  ]
  for (const [name, data] of files) {
    const path = join(dir, name)
    if (!existsSync(path)) writeFileSync(path, JSON.stringify(data, null, 1) + '\n')
  }
})
