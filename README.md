# Leonida Trophy Guide — GTA 6 (PS5)

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/zebhyrus/gta6-trophy-guide-01-entry/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/zebhyrus/gta6-trophy-guide-01-entry/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI: every trophy with its official name, description and grade, a guide in our own words with the source cited beside it, a roadmap to the platinum, missable flags, a spoiler guard, and progress that saves in the browser and exports to a file.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. No build step, no network: every file the app loads is under `app/`.

## What it covers

- **All 55 trophies** (1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden) in `app/data/trophies.json`, each with a guide and cited sources.
- **Roadmap to the platinum**: three stages, about 200 hours, difficulty 4/10, plus what the 100% checklist actually asks for.
- **The one trophy that may be missable**: Positive Mental Attitude, with the Chapter 1 meditation warning.
- **Tracker**: checklist saved in localStorage, export to JSON and import back, filters by kind and grade, search, and a spoiler setting that hides story trophies until earned.

## Screenshots

The four screenshots in `screenshots/` are real renders of the app, taken with headless Chrome at 1280x800: the cover shows the checklist with the featured guide to the one possibly missable trophy open, the roadmap, the spoiler guard at work, and export/import with a cited guide. Each is under 256 KiB.

## Sources

- [PowerPyx — GTA 6 Trophy Guide & Roadmap](https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/)
- [Planet GTA 6 — GTA 6 Trophies](https://www.planetgta6.com/en/gta-6-trophies/) (official names, descriptions and grades via Exophase, cross-checked with PSNProfiles and TrueAchievements)

An unofficial fan guide, not affiliated with Rockstar Games.

---

<sub>Entered on [make.fun](https://make.fun/?ref=9srzvfjv&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
