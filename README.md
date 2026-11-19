# Leonida Trophy Guide — GTA VI (PS5)

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/notanzaalthofa-alt/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/notanzaalthofa-alt/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all 55 Grand Theft Auto VI trophies on PlayStation 5, built for the make.fun bounty **gta6-trophy-guide-01**.

## What it is

- **A tracker** over every official trophy — name, description and grade as PlayStation publishes them — with a checklist saved in the browser, export and import of your progress, filters by kind (story, missable, collectibles, activities) and grade, and a **spoiler guard** that hides story trophies until you earn them.
- **A guide to each trophy in plain words**, with its sources named beside it: what to do, where, and when it can be missed.
- **A roadmap to the platinum** in eight stages, in the order that wastes the least time — story first, strands while they are open, then the long grinds last. Eleven trophies are flagged **missable**, with the reason given in their guide.

The app is plain static files under `app/` and works fully offline: serve the folder with any static server and open `app/index.html`. It makes no network request.

## Layout

- `app/index.html` — the page shell
- `app/style.css` — the Vice City neon-sunset look
- `app/app.js` — tracker logic: checklist, filters, spoiler guard, roadmap, export/import
- `app/data/trophies.json` — the 55 official trophies with guides, kinds, missable flags and roadmap stages
- `app/data/roadmap.json` — the eight roadmap stages
- `main.ts` — the entry program: copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library
- `screenshots/` — 3–4 renders of the app in a browser (the first by name is the cover)

The four screenshots show: the checklist with a trophy's guide and sources open beside it; the roadmap to the platinum; the missable filter with spoiler guard on; and the checklist with progress saved and export/import at hand.

## Run it

```sh
# Serve the app and open it in a desktop browser:
python3 -m http.server 8080 --directory app
# then open http://localhost:8080

# Build the entry output (dossier + copies of app/ and screenshots/):
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Sources

Trophy names, descriptions and grades are shown as PlayStation publishes them (via the Exophase / PSNProfiles trophy list, 18 Nov 2026). Every guide is written for this page, in its own words, and names its sources beside it. No Rockstar Games logo, official artwork or game footage is used. Not affiliated with Rockstar Games or Sony Interactive Entertainment.

## License

MIT — see `LICENSE`.
