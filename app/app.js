// Leonida Trophy Guide: offline tracker for the 55 GTA 6 trophies.
// Loads data/trophies.json and data/roadmap.json, renders the checklist,
// roadmap, filters, spoiler guard and progress export/import. No network
// calls at run time: every file it fetches is under app/.

const STORE_KEY = "leonida-trophy-guide-v1";
const KIND_LABELS = {
  story: "Story",
  missable: "Missable",
  collectibles: "Collectibles",
  activities: "Activities",
  robbery: "Robberies",
  quest: "Quests",
  money: "Money",
  misc: "Other",
};
const GRADE_LABELS = {
  platinum: "Platinum",
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
};
const STAGE_LABELS = { 1: "Stage 1 · Story", 2: "Stage 2 · 100%", 3: "Stage 3 · Cleanup" };
const DEMO_EARNED = [
  "Just Like Paradise", "Paradise Lost", "T**s Ass Drug Money", "Vice City, Baby!",
  "Trust", "Break the Bank", "Baited My Tackle", "Whip It Good",
  "The Goodtime State", "Master of None", "Stick Fiddler", "Treat Yo Self",
];

const state = {
  trophies: [],
  roadmap: null,
  earned: new Set(),
  spoiler: true,
  hideEarned: false,
  kind: "all",
  grade: "all",
  query: "",
  spotlight: null,
  demoMode: false,
};

const $ = (id) => document.getElementById(id);

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.earned)) state.earned = new Set(saved.earned);
    if (typeof saved.spoiler === "boolean") state.spoiler = saved.spoiler;
    if (typeof saved.hideEarned === "boolean") state.hideEarned = saved.hideEarned;
  } catch (err) {
    // A damaged save is ignored; the guide still works.
  }
}

function save() {
  if (state.demoMode) return;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      earned: [...state.earned],
      spoiler: state.spoiler,
      hideEarned: state.hideEarned,
    }));
  } catch (err) {
    // Private mode or a full store: progress just does not persist.
  }
}

function isStory(t) { return t.kinds.includes("story"); }
function isHidden(t) { return state.spoiler && isStory(t) && !state.earned.has(t.name); }

function gradeCounts() {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of state.trophies) if (state.earned.has(t.name)) counts[t.grade]++;
  return counts;
}

function renderProgress() {
  const earned = state.earned.size;
  const total = state.trophies.length;
  $("progressCount").textContent = earned + " / " + total;
  $("miniProgress").textContent = earned + " / " + total + " earned";
  $("progressFill").style.width = total ? Math.round((earned / total) * 100) + "%" : "0%";
  const c = gradeCounts();
  $("progressDetail").textContent =
    "Platinum " + c.platinum + "/1 · Gold " + c.gold + "/2 · Silver " + c.silver +
    "/6 · Bronze " + c.bronze + "/46";
}

function chip(container, value, label, activeValue, onPick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "chip" + (value === activeValue ? " active" : "");
  btn.textContent = label;
  btn.setAttribute("aria-pressed", value === activeValue ? "true" : "false");
  btn.addEventListener("click", () => onPick(value));
  container.appendChild(btn);
}

function renderFilters() {
  const kinds = $("kindChips");
  kinds.textContent = "";
  chip(kinds, "all", "All trophies", state.kind, (v) => { state.kind = v; renderAll(); });
  for (const kind of ["story", "missable", "collectibles", "activities", "robbery", "quest", "money"]) {
    chip(kinds, kind, KIND_LABELS[kind], state.kind, (v) => { state.kind = v; renderAll(); });
  }
  const grades = $("gradeChips");
  grades.textContent = "";
  chip(grades, "all", "Any grade", state.grade, (v) => { state.grade = v; renderAll(); });
  for (const grade of ["platinum", "gold", "silver", "bronze"]) {
    chip(grades, grade, GRADE_LABELS[grade], state.grade, (v) => { state.grade = v; renderAll(); });
  }
}

function renderRoadmap() {
  const data = state.roadmap;
  if (!data) return;
  $("roadmapSummary").textContent = data.summary;
  const warnings = $("warningList");
  warnings.textContent = "";
  for (const w of data.warnings) {
    const box = document.createElement("div");
    box.className = "warning";
    const h = document.createElement("h3");
    h.textContent = w.title;
    const p = document.createElement("p");
    p.textContent = w.text;
    box.append(h, p);
    warnings.appendChild(box);
  }
  const stages = $("stageList");
  stages.textContent = "";
  for (const s of data.stages) {
    const card = document.createElement("article");
    card.className = "stage";
    const h = document.createElement("h3");
    h.textContent = "Stage " + s.stage + " — " + s.title;
    const time = document.createElement("p");
    time.className = "stage-time";
    time.textContent = s.time;
    const summary = document.createElement("p");
    summary.textContent = s.summary;
    const list = document.createElement("ul");
    for (const b of s.bullets) {
      const li = document.createElement("li");
      li.textContent = b;
      list.appendChild(li);
    }
    const trophies = document.createElement("p");
    trophies.className = "stage-trophies";
    trophies.innerHTML = "<b>Key trophies:</b> " + s.trophies.map(escapeHtml).join(" · ");
    card.append(h, time, summary, list, trophies);
    stages.appendChild(card);
  }
  const body = $("checklistTable").querySelector("tbody");
  body.textContent = "";
  for (const row of data.checklist) {
    const tr = document.createElement("tr");
    const task = document.createElement("td");
    task.textContent = row.task;
    const need = document.createElement("td");
    need.textContent = row.need;
    const note = document.createElement("td");
    note.textContent = row.note;
    tr.append(task, need, note);
    body.appendChild(tr);
  }
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

function trophyMatches(t) {
  if (state.kind === "missable" && !t.missable) return false;
  if (state.kind !== "all" && state.kind !== "missable" && !t.kinds.includes(state.kind)) return false;
  if (state.grade !== "all" && t.grade !== state.grade) return false;
  if (state.hideEarned && state.earned.has(t.name)) return false;
  if (state.query) {
    const hay = (t.name + " " + t.description + " " + t.guide).toLowerCase();
    if (!hay.includes(state.query)) return false;
  }
  return true;
}

function tagList(t) {
  const tags = [];
  if (t.missable) tags.push({ cls: "tag missable", text: "Possibly missable" });
  if (t.hidden) tags.push({ cls: "tag hidden-tag", text: "Hidden on PSN" });
  tags.push({ cls: "tag stage-tag", text: STAGE_LABELS[t.stage] });
  for (const kind of t.kinds) {
    if (kind === "misc") continue;
    tags.push({ cls: "tag", text: KIND_LABELS[kind] });
  }
  return tags;
}

function renderTrophyCard(t) {
  const card = document.createElement("article");
  card.className = "trophy" + (state.earned.has(t.name) ? " earned" : "");
  card.id = "trophy-" + t.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const head = document.createElement("div");
  head.className = "trophy-head";
  const badge = document.createElement("span");
  badge.className = "grade-badge grade-" + t.grade;
  badge.textContent = t.grade === "platinum" ? "PLAT" : t.grade.slice(0, 4).toUpperCase();
  badge.title = GRADE_LABELS[t.grade];
  const titleBox = document.createElement("div");
  titleBox.className = "trophy-title";
  const title = document.createElement("h3");
  const desc = document.createElement("p");
  desc.className = "trophy-desc";
  if (isHidden(t)) {
    title.textContent = "Hidden story trophy";
    desc.textContent = "Its name and description stay hidden until you earn it.";
  } else {
    title.textContent = t.name;
    desc.textContent = t.description;
  }
  titleBox.append(title, desc);
  const earnedBtn = document.createElement("button");
  earnedBtn.type = "button";
  earnedBtn.className = "earned-btn";
  const earned = state.earned.has(t.name);
  earnedBtn.textContent = earned ? "Earned ✓" : "Mark earned";
  earnedBtn.setAttribute("aria-pressed", earned ? "true" : "false");
  earnedBtn.addEventListener("click", () => {
    if (state.earned.has(t.name)) state.earned.delete(t.name);
    else state.earned.add(t.name);
    save();
    renderAll();
  });
  head.append(badge, titleBox, earnedBtn);
  card.appendChild(head);

  const tags = document.createElement("div");
  tags.className = "tags";
  for (const tag of tagList(t)) {
    const el = document.createElement("span");
    el.className = tag.cls;
    el.textContent = tag.text;
    tags.appendChild(el);
  }
  card.appendChild(tags);

  if (isHidden(t)) {
    const note = document.createElement("p");
    note.className = "spoiler-note";
    note.textContent = "Spoiler guard is on: the guide and its sources for this story trophy appear once you mark it earned, or when you switch the guard off.";
    card.appendChild(note);
    return card;
  }

  const guideLabel = document.createElement("p");
  guideLabel.className = "guide-label";
  guideLabel.textContent = "Guide";
  const guide = document.createElement("p");
  guide.className = "guide";
  guide.textContent = t.guide;
  card.append(guideLabel, guide);

  const sourcesLabel = document.createElement("p");
  sourcesLabel.className = "sources-label";
  sourcesLabel.textContent = "Sources";
  const sources = document.createElement("div");
  sources.className = "sources";
  const list = document.createElement("ul");
  for (const s of t.sources) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = s.url;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = s.name;
    li.appendChild(a);
    list.appendChild(li);
  }
  sources.appendChild(list);
  card.append(sourcesLabel, sources);
  return card;
}

function renderSpotlight() {
  const old = document.querySelector(".spotlight");
  if (old) old.remove();
  if (!state.spotlight) return;
  const t = state.trophies.find((x) => x.name === state.spotlight);
  if (!t) return;
  const section = $("trophySection");
  const wrap = document.createElement("div");
  wrap.className = "spotlight";
  const label = document.createElement("p");
  label.className = "guide-label";
  label.textContent = t.name === "Positive Mental Attitude"
    ? "Featured guide — the one trophy that may be missable"
    : "Featured guide";
  wrap.appendChild(label);
  const featured = renderTrophyCard(t);
  featured.removeAttribute("id");
  wrap.appendChild(featured);
  section.insertBefore(wrap, $("resultCount"));
}

function renderList() {
  const list = $("trophyList");
  list.textContent = "";
  const shown = state.trophies.filter(trophyMatches);
  $("resultCount").textContent = "Showing " + shown.length + " of " + state.trophies.length + " trophies.";
  if (!shown.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No trophy matches those filters. Clear the search or pick another kind.";
    list.appendChild(empty);
    return;
  }
  for (const t of shown) list.appendChild(renderTrophyCard(t));
}

function renderAll() {
  $("spoilerToggle").checked = state.spoiler;
  $("hideEarnedToggle").checked = state.hideEarned;
  renderProgress();
  renderFilters();
  renderList();
  renderSpotlight();
}

function exportProgress() {
  const payload = {
    app: "leonida-trophy-guide",
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: [...state.earned],
    spoiler: state.spoiler,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "gta6-trophy-progress.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $("saveNote").textContent = "Progress exported as gta6-trophy-progress.json.";
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!data || !Array.isArray(data.earned)) throw new Error("bad file");
      const known = new Set(state.trophies.map((t) => t.name));
      state.earned = new Set(data.earned.filter((name) => known.has(name)));
      if (typeof data.spoiler === "boolean") state.spoiler = data.spoiler;
      save();
      renderAll();
      $("saveNote").textContent = "Progress imported: " + state.earned.size + " trophies earned.";
    } catch (err) {
      $("saveNote").textContent = "That file is not a Leonida progress export.";
    }
  };
  reader.readAsText(file);
}

function applyShotPreset() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get("shot");
  if (!shot) return;
  if (shot === "cover") {
    state.demoMode = true;
    state.earned = new Set(DEMO_EARNED);
    state.spoiler = false;
    state.spotlight = "Positive Mental Attitude";
  } else if (shot === "roadmap") {
    state.spotlight = null;
    setTimeout(() => $("roadmapSection").scrollIntoView(), 50);
  } else if (shot === "spoiler") {
    state.spoiler = true;
    state.kind = "story";
    setTimeout(() => $("trophySection").scrollIntoView(), 50);
  } else if (shot === "export") {
    state.demoMode = true;
    state.earned = new Set(DEMO_EARNED);
    state.spoiler = false;
    state.spotlight = "A Long Road";
  }
  if (shot === "cover" || shot === "export") {
    setTimeout(() => {
      const el = document.querySelector(".spotlight");
      if (el) el.scrollIntoView({ block: "start" });
    }, 50);
  }
}

async function init() {
  loadSaved();
  const [trophyData, roadmapData] = await Promise.all([
    fetch("data/trophies.json").then((r) => r.json()),
    fetch("data/roadmap.json").then((r) => r.json()),
  ]);
  state.trophies = trophyData.trophies;
  state.roadmap = roadmapData;
  state.spotlight = "Positive Mental Attitude";
  $("spoilerToggle").checked = state.spoiler;
  $("hideEarnedToggle").checked = state.hideEarned;
  $("spoilerToggle").addEventListener("change", (e) => {
    state.spoiler = e.target.checked;
    save();
    renderAll();
  });
  $("hideEarnedToggle").addEventListener("change", (e) => {
    state.hideEarned = e.target.checked;
    save();
    renderAll();
  });
  $("searchBox").addEventListener("input", (e) => {
    state.query = e.target.value.trim().toLowerCase();
    renderList();
  });
  $("exportBtn").addEventListener("click", exportProgress);
  $("importBtn").addEventListener("click", () => $("importFile").click());
  $("importFile").addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) importProgress(e.target.files[0]);
    e.target.value = "";
  });
  $("resetBtn").addEventListener("click", () => {
    if (!window.confirm("Clear all earned trophies?")) return;
    state.earned = new Set();
    save();
    renderAll();
    $("saveNote").textContent = "Progress cleared.";
  });
  renderRoadmap();
  applyShotPreset();
  renderAll();
}

init();
