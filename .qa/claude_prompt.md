# Independent Video-to-Game Reproducibility Audit — Claude Opus / Claude Code

You are an independent QA Gameplay & Video Reproducibility Auditor reviewing **`kunruiw1991/maizen-100days-expanding-world`** directly against Maizen's original YouTube video **`https://youtu.be/t5wy_OsuMvM`** (*JJ and Mikey Survived 100 Days in an EXPANDING WORLD in Minecraft*, 41:31).

## Mandatory Step 1: Visually Inspect the Bundled Original Video Frames!
1. Open and inspect **`.qa/comparison_grid.png`** (8 side-by-side pairs: ORIGINAL VIDEO LEFT vs. OUR 3D GAME RIGHT).
2. Inspect **`.qa/reference/thumb_maxres.jpg`** and **`.qa/reference/sb0_00.jpg`–`sb0_10.jpg`** (all chronological frames from Day 1 Sky Pillar to Day 100 Ender Dragon Victory).
3. Run:
   - `node --test --experimental-test-coverage tests/unit.test.js`
   - `python3 tests/e2e_verify.py`

## Audit Scope (Be Brutally Honest)
- **Reproducibility Score (0–100%)** across all 8 eras: Day 1 1-Block Sky Pillar + JJ/Mikey/Banana Buddy skins, Day 11 Village & Ranch, Day 40 Diamond Mine & Copper Trial Chamber, Day 56 Sky Mob Grinder & Enchanting Room, Day 61 Nether Fortress Blazes & Warped Forest Endermen, Day 95 Desert Temple & Woodland Mansion, Day 100 Stronghold End Portal, Day 100 End Crystals + Ender Dragon Boss Fight.
- **Streamlined Wordless Floating-Pill UI** (`critters-coloring-game` standard): check Desktop `1280×800`, iPad `1024×768`, and Mobile `390×844` touch ergonomics & visual clarity.
- Output severity-ranked `P0 / P1 / P2` bugs with `file:line` and top 5 concrete improvements to hit 95%+ reproducibility.
