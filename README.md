# Scenario Browser Game

A single-player, menu-driven browser game. You are an ordinary survivor in an invented modern city on the morning a system takes over and starts issuing deadly scenarios. Explore the zones, fight turn by turn, trade with the other survivors, catch the eye of the constellations watching from above, and stay alive. One life per game: death ends the run and deletes the save.

## Play locally

```bash
npm install
npm run dev
```

Then open the address Vite prints (usually http://localhost:5173).

## Test and build

```bash
npm test            # every test, including the content validator
npm run typecheck   # type-check
npm run build       # production build in dist/
```

## Add a scenario

1. Copy a file in `src/data/scenarios/` (for example `s10.ts`) to a new file, give it the next `id` and `number`, and write its notice, goal, hours and rewards.
2. Add it to the list in `src/data/scenarios/index.ts`.
3. Run `npm test`. The content validator checks ids, references, numbering and borrowed names, and tells you exactly what is wrong.

Zones, enemies, items, skills, constellations and survivors are data files in `src/data/` too. Adding content never needs an engine change.

## Saves

The game saves automatically in the browser's local storage. Each browser keeps its own save, so a phone and a computer have separate games. Clearing the site's data deletes the save.

## Deploying

Every push to `main` runs the tests, builds the game and publishes it to GitHub Pages (`.github/workflows/deploy.yml`). In the repository settings, set **Pages → Source** to **GitHub Actions** once.
