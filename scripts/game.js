/* ==========================================================================
   game.js — state machine, narration, interaction
   Every line of game text is English. Quoted lines are from Xi Xi's poem
   "Sunday Morning", translated by Howard Goldblatt.
   One rule: the screen is always derived from a single state object (S).
   ========================================================================== */

(() => {
  "use strict";

  /* ── DOM ──────────────────────────────────────────────── */
  const $ = (id) => document.getElementById(id);
  const sceneEl = $("scene");
  const fxEl = $("fx");
  const narrEl = $("narration");
  const optsEl = $("options");
  const hintEl = $("hint");
  const floatEl = $("floaters");
  const folioEl = $("folio-scene");
  const folioN = $("folio-n");
  const titleEl = $("title");

  /* ── State ────────────────────────────────────────────── */
  const S = {
    time: "07:00",
    weather: "Unknown",
    energy: 80,
    coins: 0,
    mood: "Neutral",
    flags: { slept: false, vision: "idle", food: null, jeansDone: false,
             afternoonDone: false, afterPicked: null, doorDone: false, wakeNote: null },
  };

  /* ── Vocabulary ───────────────────────────────────────── */
  const MOOD = {
    Neutral: "Neutral", Calm: "Calm", Dazed: "Dazed", Peaceful: "Peaceful",
    Energetic: "Energetic", Lethargic: "Lethargic", Melancholy: "Melancholy",
    Anxious: "Anxious", Lonely: "Lonely", Amused: "Amused", Serene: "Serene",
    Content: "Content", Silly: "Silly", Sociable: "Sociable", Hungry: "Hungry",
    Resigned: "Resigned", Relieved: "Relieved", Determined: "Determined",
    Wistful: "Wistful", Hopeful: "Hopeful", Bored: "Bored",
    Regretful: "Regretful", Happy: "Happy", Carefree: "Carefree",
    Playful: "Playful", Focused: "Focused", Inspired: "Inspired",
    Indebted: "Indebted",
  };

  const WEATHER = {
    Unknown: "Unknown",
    "Clear and mild": "Clear and mild",
    "Bright sunshine": "Bright sunshine",
    Overcast: "Overcast",
    Drizzles: "Drizzles",
    Storm: "Storm",
  };

  /* short labels for the status bar */
  const WEATHER_SHORT = {
    Unknown: "Unknown", "Clear and mild": "Clear", "Bright sunshine": "Sunny",
    Overcast: "Overcast", Drizzles: "Drizzle", Storm: "Storm",
  };

  const MOOD_UP = new Set(["Peaceful", "Energetic", "Serene", "Content", "Amused",
    "Happy", "Carefree", "Playful", "Inspired", "Focused", "Determined",
    "Hopeful", "Relieved", "Sociable", "Calm"]);
  const MOOD_MID = new Set(["Neutral", "Silly", "Dazed"]);

  /* ── Helpers ──────────────────────────────────────────── */
  const clamp = (v) => Math.max(0, Math.min(100, v));
  const clockKey = (t) => (t === "15:30" ? "15b" : t.slice(0, 2));
  const signed = (n) => (n < 0 ? `−${Math.abs(n)}` : `+${n}`);

  let busy = false;
  let seq = 0;
  let folioIndex = 0;
  let currentOptions = [];

  const roman = (n) => {
    const map = [[10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]];
    let out = "";
    for (const [v, r] of map) while (n >= v) { out += r; n -= v; }
    return out;
  };

  /* ── Status bar ───────────────────────────────────────── */
  function syncHUD() {
    $("hud-time").textContent = S.time;
    $("hud-weather").textContent = WEATHER_SHORT[S.weather] ?? S.weather;

    const bar = $("hud-energy");
    bar.style.setProperty("--v", S.energy);
    bar.dataset.low = S.energy < 30 ? "1" : "0";
    $("hud-energy-num").textContent = S.energy;

    $("hud-coins").textContent = S.coins;
    $("hud-mood").textContent = MOOD[S.mood] ?? S.mood;

    document.body.dataset.weather = S.weather;
    document.body.dataset.clock = clockKey(S.time);
    document.body.dataset.mood = MOOD_UP.has(S.mood) ? "up"
      : MOOD_MID.has(S.mood) ? "flat" : "down";
  }

  /* ── Weather effects ──────────────────────────────────── */
  function syncFX() {
    fxEl.innerHTML = "";
    const w = S.weather;

    if (w === "Storm" || w === "Drizzles") {
      const n = w === "Storm" ? 80 : 36;
      const rain = document.createElement("div");
      rain.className = "rain";
      for (let i = 0; i < n; i++) {
        const d = document.createElement("i");
        d.style.left = `${Math.random() * 108 - 4}%`;
        d.style.height = `${(w === "Storm" ? 14 : 9) + Math.random() * (w === "Storm" ? 26 : 16)}%`;
        d.style.opacity = `${0.07 + Math.random() * 0.18}`;
        d.style.animationDuration = `${(w === "Storm" ? 0.55 : 0.95) + Math.random() * 0.6}s`;
        d.style.animationDelay = `${-Math.random() * 2}s`;
        rain.appendChild(d);
      }
      fxEl.appendChild(rain);
    }

    if (w === "Storm") {
      const l = document.createElement("div");
      l.className = "lightning";
      fxEl.appendChild(l);
    }

    if (w === "Bright sunshine" || w === "Clear and mild") {
      const s = document.createElement("div");
      s.className = "sunbeam";
      s.style.opacity = w === "Bright sunshine" ? "1" : "0.5";
      fxEl.appendChild(s);
    }
  }

  /* ── Floating numbers ─────────────────────────────────── */
  function float(text, sign = "flat") {
    const el = document.createElement("div");
    el.className = "floater";
    el.dataset.sign = sign;
    el.textContent = text;
    el.style.left = `${26 + Math.random() * 46}%`;
    el.style.top = `${36 + Math.random() * 14}%`;
    floatEl.appendChild(el);
    setTimeout(() => el.remove(), 1700);
  }

  /* ── The only place numbers change ────────────────────── */
  function apply({ energy = 0, coins = 0, mood = null, time = null }) {
    if (energy) {
      const before = S.energy;
      S.energy = clamp(S.energy + energy);
      const d = S.energy - before;
      if (d !== 0) float(`Energy ${signed(d)}`, d > 0 ? "up" : "down");
    }
    if (coins) {
      S.coins += coins;
      float(`Coins ${signed(coins)}`, coins > 0 ? "up" : "down");
    }
    if (mood) {
      S.mood = mood;
      float(MOOD[mood] ?? mood, MOOD_UP.has(mood) ? "up" : MOOD_MID.has(mood) ? "flat" : "down");
    }
    if (time) S.time = time;

    syncHUD();
    syncFX();
  }

  /* ── Scene painting ───────────────────────────────────── */
  function paint(svg, folio) {
    const my = ++seq;
    sceneEl.classList.add("is-out");

    setTimeout(() => {
      if (my !== seq) return;
      sceneEl.innerHTML = svg;
      sceneEl.classList.remove("is-out");
      sceneEl.classList.add("is-in");
      folioEl.textContent = folio;
      folioN.textContent = roman(++folioIndex);
      setTimeout(() => sceneEl.classList.remove("is-in"), 700);
      bindHotspots();
    }, 170);
  }

  /* ── Choices ──────────────────────────────────────────── */
  function renderOptions(list, hint) {
    currentOptions = list;
    optsEl.innerHTML = "";
    list.forEach((o) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "opt" + (o.quiet ? " opt--quiet" : "");
      b.dataset.hot = o.hot || "";
      b.innerHTML = `<span class="opt__zh">${o.label}</span>` +
        (o.sub ? `<span class="opt__en">${o.sub}</span>` : "");
      b.addEventListener("click", () => run(o));
      optsEl.appendChild(b);
    });
    hintEl.textContent = hint === "" ? "" : (hint || "Click an object in the room, or choose below.");
  }

  function run(option) {
    if (busy || option.disabled) return;
    busy = true;
    optsEl.querySelectorAll(".opt").forEach((b) => (b.disabled = true));
    sceneEl.querySelectorAll(".hotspot").forEach((h) => h.setAttribute("tabindex", "-1"));
    try {
      option.act();
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => { busy = false; }, 240);
    }
  }

  function bindHotspots() {
    sceneEl.querySelectorAll(".hotspot").forEach((el) => {
      const key = el.dataset.hot;
      const fire = (e) => {
        e.preventDefault();
        if (busy) return;
        const opt = currentOptions.find((o) => o.hot === key);
        if (opt) run(opt);
      };
      el.addEventListener("click", fire);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") fire(e);
      });
    });
  }

  const narrate = (html) => { narrEl.innerHTML = html; };

  /* ======================================================================
     Views
     ====================================================================== */
  const V = {};

  /* At wake-up ─────────────────────────────────────────────── */
  V.wake = () => {
    const queasy = (t, energy, mood, note) => () => {
      S.flags.wakeNote = note;
      apply({ time: t, energy, mood });
      go("bedroom");
    };

    const opts = [
      { label: "The clock strikes seven", sub: "07:00",
        act: queasy("07:00", -2, "Calm", "Seven. The morning is still cool and unclaimed.") },
      { label: "It's nine o'clock", sub: "09:00",
        act: queasy("09:00", -8, "Lethargic", "Nine. Two hours have already gone somewhere without you.") },
      { label: "No telling what time it is", sub: "??:??",
        act: () => {
          const t = ["07:00", "09:00", "11:00"][Math.floor(Math.random() * 3)];
          S.flags.wakeNote = `You look at the clock. It says ${t}, which settles nothing at all.`;
          apply({ time: t, energy: -4, mood: "Dazed" });
          go("bedroom");
        } },
      { label: "It's noon", sub: "12:00",
        act: () => { S.flags.slept = true; queasy("12:00", 8, "Lethargic",
          "Noon. The morning has been used up without you, and the room is very bright.")(); } },
      { label: "It's right back to sleep for a while", sub: "later",
        act: () => { S.flags.slept = true; queasy("12:00", 12, "Calm",
          "You turn over. When you wake again it is noon, and the pillow is warm.")(); } },
    ];

    paint(Scenes.bedroom({ ...S, bare: true }), "At wake-up");
    narrate("It's summer. Sunday morning.<br>At wake-up—");
    renderOptions(opts, "The poem begins with a choice about the time. So does this.");
  };

  /* Bedroom (the hub) ──────────────────────────────────────── */
  V.bedroom = () => {
    const w = S.weather;
    const wtxt = w === "Unknown"
      ? "You don't know yet what the weather is doing outside."
      : `Outside: ${WEATHER[w]}.`;

    const opts = [
      { label: "Look out of the window", sub: "the window", hot: "window",
        act: () => go("window") },
      { label: "Look in the mirror", sub: "a pair of eyes crossing", hot: "mirror",
        act: () => go("mirror") },
      { label: "Go to the kitchen", sub: "a glass of ice water", hot: "kitchen",
        act: () => go("kitchen") },
      { label: "Put on yesterday's jeans", sub: "two coins", hot: "jeans",
        act: () => go("jeans") },
    ];

    if (!S.flags.slept) {
      opts.push({
        label: "Go back to sleep for a while", sub: "the clock", quiet: true,
        act: () => {
          S.flags.slept = true;
          apply({ energy: 10, time: "12:00", mood: "Lethargic" });
          narrate("You get back under the quilt. When you wake, the morning has been spent.");
          V.bedroom();
        },
      });
    }

    opts.push({
      label: "Come to a decision about the afternoon", sub: "for this afternoon", quiet: true,
      hot: "afternoon", act: () => go("afternoon"),
    });

    if (S.flags.afternoonDone) {
      opts.push({
        label: "Answer the door", sub: "there's the doorbell", hot: "door",
        act: () => go("door"),
      });
    }

    const note = S.flags.wakeNote ? `${S.flags.wakeNote}<br>` : "";
    S.flags.wakeNote = null;
    paint(Scenes.bedroom(S), "Bedroom");
    narrate(`${note}Summer. Sunday morning. You sit on the edge of the bed, still not deciding to get up.<br>${wtxt}`);
    renderOptions(opts, S.flags.afternoonDone
      ? "The doorbell could ring at any moment."
      : "Four places to go: the window, the mirror, the kitchen, the jeans.");
  };

  /* The window ─────────────────────────────────────────────── */
  V.window = () => {
    const EFFECT = {
      "Clear and mild":  [5, "Peaceful"],
      "Bright sunshine": [1, "Energetic"],
      "Overcast":        [-5, "Lethargic"],
      "Drizzles":        [5, "Melancholy"],
      "Storm":           [-10, "Anxious"],
    };

    const opts = Object.keys(WEATHER).filter((k) => k !== "Unknown").map((k) => ({
      label: k.charAt(0).toUpperCase() + k.slice(1),
      sub: k === "Drizzles" ? "sometimes heavy" : k === "Storm" ? "on the way" : "",
      act: () => {
        apply({ energy: EFFECT[k][0], mood: EFFECT[k][1] });
        S.weather = k;
        syncHUD(); syncFX();
        busy = true;
        setTimeout(() => { busy = false; go("bedroom"); }, 720);
      },
    }));

    opts.push({ label: "Stay by the window", sub: "back to bed", quiet: true,
      act: () => go("bedroom") });

    paint(Scenes.windowView(S), "The window");
    narrate("You open the window a crack. The weather today is—");
    renderOptions(opts, "Choose one, and the light in the whole room will change with it.");
  };

  /* The mirror ─────────────────────────────────────────────── */
  const MIRROR = {
    idle: ["", "The mirror shows more than you do."],
    lonely: ["a pall of loneliness",
      "A pall of loneliness. The room in the glass is larger than your room and much emptier, with no echo in it at all. You can see yourself standing very far away."],
    toothpaste: ["a toothpaste ad",
      "A toothpaste ad. White light, a smile, a jingle you can't rinse out. Even loneliness has a sponsor."],
    wheat: ["boundless wheat fields",
      "Boundless wheat fields. The wind keeps blowing and the wheat keeps bending and nobody has to say anything."],
    lotus: ["a lotus in full bloom",
      "A lotus in full bloom. No vase, no water, no explanation. Some Sundays are allowed to be quietly miraculous."],
    eyes: ["a pair of eyes crossing",
      "A pair of eyes crossing. The face in the mirror is more serious than you are, so the whole room agrees to be absurd for a moment."],
  };

  const MIRROR_MOOD = {
    lonely: "Lonely", toothpaste: "Amused", wheat: "Serene",
    lotus: "Content", eyes: "Silly",
  };

  const MIRROR_LABEL = {
    lonely: "A pall of loneliness",
    toothpaste: "A toothpaste ad",
    wheat: "Boundless wheat fields",
    lotus: "A lotus in full bloom",
    eyes: "A pair of eyes crossing",
  };

  V.mirror = () => {
    const v = S.flags.vision;
    const [quote, text] = MIRROR[v] ?? MIRROR.idle;

    const opts = Object.entries(MIRROR_MOOD).map(([key, mood]) => ({
      label: MIRROR_LABEL[key],
      sub: key === v ? "what you see now" : "",
      act: () => {
        S.flags.vision = key;
        apply({ mood, time: S.time === "07:00" ? "08:00" : null });
        V.mirror();
      },
    }));

    opts.push({ label: "Step away from the mirror", sub: "back to the bedroom",
      quiet: true, act: () => go("bedroom") });

    paint(Scenes.mirror(S, v), "The mirror");
    narrate((quote ? `<span class="verse">“${quote}”</span>` : "") + text);
    renderOptions(opts, "The mirror will keep changing as long as you stay.");
  };

  /* The kitchen ────────────────────────────────────────────── */
  const FOOD = {
    bread: {
      label: "Some bread with sugar and peanut butter",
      sub: "eat standing up",
      energy: 20, coins: 0, mood: null,
      text: "Sugar crunches between your teeth. It is not a proper breakfast and it is exactly the right breakfast.",
    },
    teahouse: {
      label: "The teahouse is sure to be packed",
      sub: "five coins",
      energy: 30, coins: -5, mood: "Sociable",
      text: "It is. You squeeze in, and five coins buy a pot of tea, two buns, and a whole roomful of Sunday. Nobody asks your name, which is good.",
    },
    noodles: {
      label: "God, no more instant noodles",
      sub: "three minutes",
      energy: -10, coins: 0, mood: "Hungry",
      text: "You eat them anyway. The same seasoning packet, the same three minutes. Afterwards you are less fed than before.",
    },
    apple: {
      label: "An apple",
      sub: "slightly bruised",
      energy: 20, coins: 0, mood: null,
      text: "One apple, slightly bruised, cold from the fridge. You polish it on your sleeve for no reason at all.",
    },
    empty: {
      label: "There's nothing to eat in the fridge",
      sub: "half an onion",
      energy: -10, coins: 0, mood: "Hungry",
      text: "Half an onion, a bottle of water, and a light that has been on since yesterday. You close the door gently, as if not to wake anything.",
    },
  };

  V.kitchen = () => {
    if (S.flags.food) {
      const f = FOOD[S.flags.food];
      paint(Scenes.kitchen(S, S.flags.food), "The kitchen");
      narrate(`<span class="verse">“${f.label.toLowerCase()}”</span>${f.text}`);
      renderOptions([
        { label: "Go back to the bedroom", sub: "leave the plate", quiet: true,
          act: () => { S.flags.food = null; go("bedroom"); } },
      ], "The fridge goes on humming its one-note song.");
      return;
    }

    const opts = Object.entries(FOOD).map(([key, f]) => ({
      label: f.label,
      sub: f.sub,
      act: () => {
        S.flags.food = key;
        apply({ energy: f.energy, coins: f.coins, mood: f.mood,
                time: S.time < "10:00" ? "10:00" : null });
        V.kitchen();
      },
    }));

    opts.push({ label: "Go back to the bedroom", sub: "still hungry", quiet: true,
      act: () => go("bedroom") });

    paint(Scenes.kitchen(S, null), "The kitchen");
    narrate("Go to the kitchen and pour a glass of ice water.<br>Thoughts turn to what to eat and drink.");
    renderOptions(opts, "Whatever you choose stays on the table until you leave.");
  };

  /* The jeans ──────────────────────────────────────────────── */
  const JEANS = {
    leo: {
      label: "Bad things happen to Leos", sub: "it's written in the stars",
      mood: "Resigned",
      text: "It is written in the stars. The explanation is worthless and strangely comforting.",
    },
    troubles: {
      label: "Troubles have ended", sub: "so this is over too",
      mood: "Relieved",
      text: "Even if the trouble was only two coins, it has ended. The floorboard creaks, as if clearing its throat.",
    },
    save: {
      label: "Try harder to save some money?", sub: "a note to self",
      mood: "Determined",
      text: "You write this down on the back of a receipt. You will lose the receipt.",
    },
    fountain: {
      label: "There'll be a fountain here", sub: "make a wish",
      mood: "Wistful",
      text: "People will throw coins into it on purpose and make wishes with their eyes open. You make a wish at the gap under the wardrobe.",
    },
    earth: {
      label: "The earth is still young", sub: "plenty of room",
      mood: "Hopeful",
      text: "It has plenty of room for two more coins. They are becoming part of the floor, part of a geology too patient to argue with.",
    },
  };

  V.jeans = () => {
    if (S.flags.jeansDone) {
      paint(Scenes.jeans(S, "after"), "The jeans");
      narrate(`<span class="verse">“two can't be found”</span>You lie flat on your stomach, arm stretched to the shoulder, and find only dust. You could move the wardrobe. You don't.`);
      renderOptions([
        { label: "Go back to the bedroom", sub: "leave the coins", quiet: true,
          act: () => { S.flags.jeansDone = false; go("bedroom"); } },
      ], "Two coins are settling in under the wardrobe.");
      return;
    }

    const opts = Object.entries(JEANS).map(([key, j]) => ({
      label: j.label,
      sub: j.sub,
      act: () => {
        S.flags.jeansDone = true;
        apply({ coins: -2, mood: j.mood, time: S.time < "11:00" ? "11:00" : null });
        paint(Scenes.jeans(S, "throw"), "The jeans");
        narrate("<span class=\"verse\">“coins fall out of the pocket”</span>Two of them. They hit the floorboards, ring once, and roll under the wardrobe — that narrow dark country where everything lost on a Sunday morning goes.");
        renderOptions([], "……");
        setTimeout(() => {
          paint(Scenes.jeans(S, "after"), "The jeans");
          narrate(`<span class="verse">“${j.label.toLowerCase()}”</span>You lie flat on your stomach, arm stretched to the shoulder, and find only dust. You could move the wardrobe. You don't.<br><br>${j.text}`);
          renderOptions([
            { label: "Go back to the bedroom", sub: "leave the coins", quiet: true,
              act: () => { S.flags.jeansDone = false; go("bedroom"); } },
          ], "Two coins are settling in under the wardrobe.");
        }, 1150);
      },
    }));

    opts.push({ label: "Go back to the bedroom", sub: "keep your pockets", quiet: true,
      act: () => go("bedroom") });

    paint(Scenes.jeans(S, "before"), "The jeans");
    narrate("When putting on jeans, coins fall out of the pocket and roll all over the floor. In the end, two can't be found.<br>The explanation for that is—");
    renderOptions(opts, "Whichever you choose, the coins do not come back.");
  };

  /* The afternoon ──────────────────────────────────────────── */
  V.afternoon = () => {
    if (S.flags.afterPicked) {
      const p = S.flags.afterPicked;
      paint(Scenes.afternoon(S, p), "The afternoon");
      narrate(`<span class="verse">“${p.quote}”</span>${p.text}`);
      renderOptions([
        { label: "There's the doorbell", sub: "go to the door", hot: "door",
          act: () => go("door") },
      ], "Half past three. Someone is at the door.");
      return;
    }

    const raining = S.weather === "Storm" || S.weather === "Drizzles";

    const pick = (r) => () => {
      apply({ time: "15:00", energy: r.energy, mood: r.mood });
      S.flags.afterPicked = r;
      S.flags.afternoonDone = true;
      V.afternoon();
    };

    const opts = [
      { label: "The hamper full of dirty clothes can wait till Monday",
        sub: "leave it", hot: "hamper",
        act: pick({
          quote: "the hamper full of dirty clothes can wait till Monday",
          energy: -10, mood: "Bored",
          text: "It can wait. You decide this with great firmness, then spend three hours sitting near it, doing nothing in particular, occasionally lifting the lid to confirm that it can wait.",
        }) },
      { label: "Go swimming at Sai Wan beach, with its big waves",
        sub: raining ? "the weather is bad" : "salt and sand", hot: "postcard",
        act: pick(raining
          ? { quote: "go swimming at Sai Wan beach, with its big waves",
              energy: -20, mood: "Regretful",
              text: "The big waves at Sai Wan are bigger than advertised. The sky is the colour of wet slate, the water is cold enough to argue with, and the lifeguard has gone home. You go in anyway, come out shivering, and spend the bus ride back regretting the whole idea with great thoroughness." }
          : { quote: "go swimming at Sai Wan beach, with its big waves",
              energy: 20, mood: "Happy",
              text: "The big waves at Sai Wan do exactly what big waves should. You let one carry you, come up laughing, and float on your back until the sun decides the afternoon is over. Salt on your arms, sand in everything." }) },
      { label: "Sing in the rain",
        sub: raining ? "there is rain" : "there is no rain", hot: "sing",
        act: pick(raining
          ? { quote: "sing in the rain",
              energy: -10, mood: "Carefree",
              text: "There is, wonderfully, actual rain. You step out under it and sing badly and at full volume, and the street empties politely around you. By the third verse you are soaked and entirely without cares." }
          : { quote: "sing in the rain",
              energy: -5, mood: "Playful",
              text: "There is no rain to sing in, so you sing into the hallway instead, and the tiled echo turns it into a fairly convincing downpour. A neighbour closes a window. You take it as applause." }) },
      { label: "Write an application letter for an interesting job",
        sub: "one page, then delete", hot: "letter",
        act: pick({
          quote: "write an application letter for an interesting job",
          energy: -30, mood: "Focused",
          text: "The job sounds interesting in the way jobs sound interesting at a distance. You write one page, delete it, write half a page, and finally keep three sentences that sound like a person who owns an iron. The window goes from bright to amber while you are looking for a better verb.",
        }) },
      { label: "Start writing a great novel",
        sub: "first sentence", hot: "novel",
        act: pick({
          quote: "start writing a great novel",
          energy: -30, mood: "Inspired",
          text: "You write the first sentence of a great novel. It is about a Sunday morning, a mirror, and two coins under a wardrobe, and it is going to be enormous. You forget to eat. You forget the time. This is exactly what afternoons are for.",
        }) },
    ];

    opts.push({ label: "Go back to the bedroom", sub: "not yet", quiet: true,
      act: () => go("bedroom") });

    paint(Scenes.afternoon(S, null), "The afternoon");
    narrate("Come to a decision. For this afternoon—<br>The morning has gone somewhere, and whatever you choose will eat the hours.");
    renderOptions(opts, "Everything on the table can be picked up, or not.");
  };

  /* The door ───────────────────────────────────────────────── */
  const ENDINGS = {
    broom: {
      name: "A broom salesman",
      quote: "a broom salesman",
      text: "He has three brooms, a demonstration, and the unshakeable cheer of a man who has been refused eleven times today. He sweeps a small, invisible pile of dust on your doormat into a very tidy heap, and you almost buy one.",
      extra: () => (S.mood === "Bored" ? "You buy one. Of course you buy one." : "You don't buy one. He sweeps the mat anyway."),
    },
    fee: {
      name: "Someone here to collect the building management fee",
      quote: "someone here to collect the building management fee",
      text: (S.coins < 0
        ? `He does not ask whether it is convenient. He asks when it will be paid. You start explaining about the two coins under the wardrobe, and hear, as you say it, that this is not the explanation anyone was hoping for. He writes something down. He will come back on Monday, the same day as the laundry.`
        : `A clipboard, a receipt, a perfectly ordinary little transaction. He counts your coins twice, thanks you without looking up, and moves on to the next door. The building remains, impossibly, managed.`),
      extra: () => (S.coins < 0
        ? `You are ${Math.abs(S.coins)} coins in the red. He writes the number down slowly, so that you can watch.`
        : "A small, ordinary duty discharged."),
    },
    stereo: {
      name: "Someone here to repossess a record player over lapsed payments",
      quote: "someone here to repossess a record player over lapsed payments",
      text: "Two men and a carrying case. The record player has not played anything in months, but the moment they lift it you remember exactly which side of which record was on last. They are careful with it, which is somehow worse. The room is quieter afterwards, and much too large.",
      extra: () => (S.coins < 0 ? "You do not mention the coins under the wardrobe. Neither do they." : "The paperwork is clean. Clean enough to feel like nothing happened."),
    },
    telegram: {
      name: "A telegram",
      quote: "a telegram",
      text: "A thin yellow envelope, folded twice. Nobody sends telegrams anymore, which is precisely why you are afraid to open it. You stand in the doorway holding it while the light on the landing changes colour.",
      extra: () => (S.mood === "Lonely" ? "It is from someone who has been thinking of you. You read it twice."
        : S.mood === "Happy" ? "It says: arriving sunday stop bring the big waves stop."
        : "You open it. There is one sentence inside, and a place with no name on it."),
    },
    nobody: {
      name: "Nobody in the hallway",
      quote: "nobody in the hallway",
      text: "Nobody. The stairwell hums, a door closes three floors down, and the strip of afternoon light goes on lying across the doormat as though someone had only just stepped out of it.",
      extra: () => (S.mood === "Lonely" ? "You stay in the doorway a little longer than necessary."
        : S.mood === "Silly" ? "You say “come in” to the empty corridor, and laugh at yourself."
        : ""),
    },
    balloons: {
      name: "A roomful of hydrogen balloons that float in",
      quote: "a roomful of hydrogen balloons that float in",
      text: "They come in slowly, bumping the ceiling, tugging at their strings: a whole roomful of them, as if the sky had misplaced a thought and sent it to your door. You duck. You close the door behind them so they will not escape. The room is suddenly, ridiculously festive.",
      extra: () => (S.mood === "Happy" || S.mood === "Inspired" ? "You decide this is the best possible ending to a Sunday morning."
        : S.mood === "Regretful" ? "Even the wet shoes and the cold bus ride seem forgiven."
        : ""),
    },
  };

  V.door = () => {
    const debt = S.coins < 0;
    const opts = Object.entries(ENDINGS).map(([key, e]) => ({
      label: e.name,
      act: () => finish(key),
    }));
    opts.push({ label: "Not yet", sub: "leave the door closed", quiet: true,
      act: () => go("bedroom") });

    paint(Scenes.door(S, null), "The door");
    narrate(
      "There's the doorbell. One short ring, then the polite pause of someone who intends to ring again.<br>" +
      "You cross the room and open the door." +
      (debt ? `<br>You are ${Math.abs(S.coins)} coins in the red, and all afternoon the footsteps have stopped at your door.` : "")
    );
    renderOptions(opts, debt ? "Someone on the landing is holding a clipboard." : "The door opens and it's—");
  };

  function finish(key) {
    const e = ENDINGS[key];
    S.flags.doorDone = true;

    paint(Scenes.door(S, key), "Outside");
    narrate(`
      <div class="ending">
        <p class="ending__kicker">Ending · ${e.name}</p>
        <span class="ending__line">“${e.quote}”</span>
        <p>${e.text}</p>
        <p>${e.extra()}</p>
        <p class="ending__tally">
          Time ${S.time} · Weather ${WEATHER[S.weather]} · Energy ${S.energy} · Coins ${S.coins} · Mood ${MOOD[S.mood]}
        </p>
      </div>
    `);
    renderOptions([
      { label: "Have this Sunday again", sub: "start over", act: () => reset() },
    ], "");
  }

  /* ── Navigation ───────────────────────────────────────── */
  function go(view) {
    const fn = V[view];
    if (!fn) return;
    window.scrollTo({ top: 0, behavior: "instant" });
    fn();
  }

  function reset() {
    Object.assign(S, {
      time: "07:00", weather: "Unknown", energy: 80, coins: 0, mood: "Neutral",
      flags: { slept: false, vision: "idle", food: null, jeansDone: false,
               afternoonDone: false, afterPicked: null, doorDone: false, wakeNote: null },
    });
    folioIndex = 0;
    syncHUD(); syncFX();
    go("wake");
  }

  /* ── Boot ─────────────────────────────────────────────── */
  function boot() {
    syncHUD(); syncFX();
    go("wake");

    $("start").addEventListener("click", () => {
      titleEl.classList.add("is-out");
      setTimeout(() => { titleEl.hidden = true; }, 1100);
      document.body.dataset.clock = "07";
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !titleEl.hidden) {
        titleEl.classList.add("is-out");
        setTimeout(() => { titleEl.hidden = true; }, 1100);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
