# Sunday Morning — a playable adaptation

An interactive adaptation of Xi Xi's poem **"Sunday Morning"** (translated by Howard Goldblatt).
One room, one summer Sunday, and a set of brackets waiting to be filled.

Plain static site: no framework, no build step, no external images. Open `index.html` and it runs.

---

## The idea

The poem is built out of brackets — nearly every line offers a set of options in parentheses, and none of them is more correct than the others. So the adaptation keeps the brackets and lets the player fill them: every choice in the game is a line from the poem, quoted as written.

What the game adds is **consequence that can be seen**. The room has a clock, a window, a fridge, a mirror and a door. Four numbers — time, weather, energy, coins — are always on screen, and the room itself reacts to them.

---

## Design direction

| Item | Decision |
|---|---|
| **Purpose** | Let a reader walk through the poem instead of reading past it |
| **Tone** | Warm paper picture-book × screen print — flat colour, grain, hand-drawn line |
| **Memorable detail** | The weather rewrites the light in the whole room, not just outside the window; the wall clock keeps the real time |
| **Display type** | Fraunces (optical-size serif) + Noto Serif TC as fallback |
| **Body** | Noto Serif TC; UI labels in Noto Sans TC |
| **Palette** | paper `#f4ead6` 60% / warm ink `#2e2820` 30% / brick `#b04f33` 10% |

Deliberately avoided: purple gradients on white, stacks of identical rounded cards, uniform 300 ms fade-ins.

---

## Files

```
sunday-morning/
├── index.html            structure, status bar, stage, panel, title screen
├── styles/
│   ├── tokens.css        colour, type scale, spacing, motion, light-by-hour
│   ├── base.css          reset, paper grain, focus ring, reduced motion
│   └── game.css          layout, HUD, choices, weather effects, scene animation
├── scripts/
│   ├── scenes.js         every scene, drawn as SVG in code
│   └── game.js           state machine, narration, endings
├── INTRODUCTION.md       the 500-word introduction for the assignment
├── netlify.toml
└── README.md
```

---

## How it plays

**State** — `time / weather / energy / coins / mood`, all derived from one object `S`; the status bar is a pure function of it.

**Time** — `07:00 → 09:00 → 10:00 → 10:30 → 11:00 → 15:00 → 15:30`. The light shifts from cool morning to white noon to gold afternoon, the wall clock's hands follow, and the window's light patch slides across the floor.

**Weather** — five states. Each one changes the sky, the clouds, the rain on the glass, the full-screen rain and lightning, and (through a `multiply` layer) the colour of the room's shadows.

**Scenes**

| Scene | What you can touch |
|---|---|
| At wake-up | five ways of telling the time, straight from the poem's first bracket |
| Bedroom | window, mirror, kitchen doorway, jeans on the bed, front door |
| The window | five kinds of weather |
| The mirror | five things the glass can show: loneliness, a toothpaste ad, wheat, a lotus, crossed eyes |
| The kitchen | the fridge, then five things to eat — the food stays on the table |
| The jeans | five explanations, while two coins roll under the wardrobe |
| The afternoon | the hamper, a postcard, the window, letter paper, a notebook |
| The door | six visitors from the poem's last bracket |

**Endings** — if `$coins < 0`, the landing gains a man with a clipboard; each of the six endings quotes its poem line and closes with the final numbers.

---

## Accessibility

- Everything works from the keyboard: `Tab` through scene hotspots and choices, `Enter` / `Space` to activate
- `:focus-visible` uses a brick-red ring, not the browser default
- Scene hotspots are `role="button"` with `aria-label`
- Numbers change in text as well as colour (the mood dot is never the only signal)
- `prefers-reduced-motion: reduce` turns off every animation
- Body text ≥ 4.5:1 contrast, large text ≥ 3:1

---

## Run locally

```bash
cd sunday-morning
python -m http.server 8123
# open http://127.0.0.1:8123/
```

## Deploy to Netlify

**Drag and drop:** drop the `sunday-morning` folder onto <https://app.netlify.com/drop>.

**CLI:**
```bash
npm i -g netlify-cli
netlify deploy --dir=. --prod
```

`netlify.toml` is already included; the publish directory is `.`.

---

## Known trade-offs

- Scenes are a fixed 1200×560 canvas filled with `slice`, so very wide or very tall windows crop a little at the edges. Everything important sits inside the central safe area.
- The web fonts add a few hundred KB on first load (`preconnect` + `display=swap`); offline it falls back to a system serif and the layout still holds.
- The illustrations are drawn in code, not painted by hand. The style is deliberately flat and print-like rather than pretending to be 3D.
