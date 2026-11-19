// Leonida Trophy Guide — an offline checklist + guide for GTA VI's 55 PS5 trophies.
// All data is local (data/trophies.json, data/roadmap.json); the app makes no
// network request. Progress lives in localStorage and can be exported/imported.

const LS_KEY = "leonida-trophy-guide-v1";
const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
const KIND_LABELS = {
  story: "Story",
  missable: "Missable",
  collectibles: "Collectibles",
  activities: "Activities",
};

let trophies = [];
let roadmap = null;
let earned = new Set();
let spoilerOn = false;
let kindFilter = "all";
let gradeFilter = "all";
let query = "";
let selectedId = null;

const $ = (id) => document.getElementById(id);

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function trophyById(id) {
  return trophies.find((t) => t.id === id) || null;
}

function stageOf(trophy) {
  if (!roadmap) return null;
  return roadmap.stages.find((s) => s.trophies.includes(trophy.id)) || null;
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    earned = new Set(Array.isArray(saved.earned) ? saved.earned : []);
    spoilerOn = saved.spoiler === true;
  } catch (err) {
    earned = new Set();
    spoilerOn = false;
  }
}

function saveState() {
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ app: "leonida-trophy-guide", earned: [...earned].sort((a, b) => a - b), spoiler: spoilerOn }),
    );
  } catch (err) {
    // Storage full or unavailable: the page still works, it just forgets.
  }
}

async function loadData() {
  const [trophyRes, roadmapRes] = await Promise.all([
    fetch("data/trophies.json"),
    fetch("data/roadmap.json"),
  ]);
  if (!trophyRes.ok || !roadmapRes.ok) throw new Error("Could not load trophy data.");
  const trophyData = await trophyRes.json();
  trophies = trophyData.trophies.slice().sort((a, b) => a.id - b.id);
  roadmap = await roadmapRes.json();
}

function isHiddenBySpoiler(trophy) {
  return spoilerOn && trophy.kind === "story" && !earned.has(trophy.id);
}

function visibleName(trophy) {
  return isHiddenBySpoiler(trophy) ? "Hidden story trophy" : trophy.name;
}

function visibleDesc(trophy) {
  return isHiddenBySpoiler(trophy)
    ? "Spoiler guard is on — earn this trophy to reveal its name and description."
    : trophy.description;
}

function matchesFilters(trophy) {
  if (kindFilter === "missable" && !trophy.missable) return false;
  if (kindFilter !== "all" && kindFilter !== "missable" && trophy.kind !== kindFilter) return false;
  if (gradeFilter !== "all" && trophy.grade !== gradeFilter) return false;
  if (query) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!hay.includes(query)) return false;
  }
  return true;
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function countText(trophy) {
  if (trophy.count == null) return "";
  if (trophy.id === 52 || trophy.id === 53) return `Target: $${Number(trophy.count).toLocaleString("en-US")}`;
  return `Count: ${trophy.count}`;
}

function badgeHtml(trophy) {
  const parts = [`<span class="badge grade-${trophy.grade}">${gradeLabel(trophy.grade)}</span>`];
  parts.push(`<span class="badge kind-${trophy.kind}">${KIND_LABELS[trophy.kind] || trophy.kind}</span>`);
  if (trophy.missable) parts.push(`<span class="badge missable">Missable</span>`);
  return parts.join("");
}

function renderList() {
  const list = $("trophyList");
  const shown = trophies.filter(matchesFilters);
  list.innerHTML = shown
    .map((t) => {
      const isEarned = earned.has(t.id);
      const count = countText(t);
      return `<li><button type="button" class="trophy-row${isEarned ? " earned" : ""}${t.id === selectedId ? " selected" : ""}" data-id="${t.id}" aria-pressed="${isEarned}">
        <input type="checkbox" class="trophy-check" data-id="${t.id}" ${isEarned ? "checked" : ""} aria-label="Mark ${escapeHtml(visibleName(t))} as earned" tabindex="-1">
        <span class="trophy-main">
          <span class="trophy-name">${escapeHtml(visibleName(t))}</span>
          <span class="trophy-desc">${escapeHtml(visibleDesc(t))}</span>
          <span class="trophy-meta">${badgeHtml(t)}</span>
        </span>
        <span class="trophy-count">${escapeHtml(count)}</span>
      </button></li>`;
    })
    .join("");
  $("emptyNote").hidden = shown.length !== 0;
  $("tabCount").textContent = `${shown.length} of ${trophies.length} shown`;
}

function renderDetail() {
  const panel = $("detailPanel");
  const trophy = trophyById(selectedId);
  if (!trophy) {
    panel.innerHTML = `<p class="detail-empty">Pick a trophy from the list to read its guide, its sources and when it can be missed.</p>`;
    return;
  }
  const stage = stageOf(trophy);
  const isEarned = earned.has(trophy.id);
  const hidden = isHiddenBySpoiler(trophy);
  const sources = (trophy.sources || [])
    .map((s) => `<li>${escapeHtml(s)}</li>`)
    .join("");
  panel.innerHTML = `
    <p class="detail-kicker">Trophy ${trophy.id} of 55</p>
    <h2 class="detail-title">${escapeHtml(visibleName(trophy))}</h2>
    <p class="detail-desc">${escapeHtml(visibleDesc(trophy))}</p>
    ${hidden ? `<p class="detail-missable"><strong>Spoiler guard.</strong> This story trophy stays hidden until you earn it — tick it off below to reveal its guide.</p>` : `
    <div class="detail-badges">${badgeHtml(trophy)}</div>
    ${trophy.missable ? `<p class="detail-missable"><strong>Missable.</strong> This one can be lost for a playthrough — do it when the chance appears, not at the end.</p>` : ""}
    <h3>Guide</h3>
    <p class="detail-guide">${escapeHtml(trophy.guide)}</p>
    ${trophy.count != null ? `<p class="detail-stage">${escapeHtml(countText(trophy))} — PlayStation tracks this count.</p>` : ""}
    ${stage ? `<p class="detail-stage">Roadmap: Stage ${stage.n} — ${escapeHtml(stage.title)}</p>` : ""}
    <h3>Sources</h3>
    <ul class="detail-sources">${sources}</ul>
    <p class="detail-sources">The requirement itself comes from the official trophy description above; the steps are this guide's own words.</p>`}
    <div class="detail-actions">
      <button type="button" class="btn" id="detailToggle">${isEarned ? "Mark as not earned" : "Mark as earned"}</button>
    </div>`;
  $("detailToggle").addEventListener("click", () => toggleEarned(trophy.id));
}

function renderProgress() {
  const done = earned.size;
  const total = trophies.length || 55;
  const pct = total ? Math.round((done / total) * 100) : 0;
  $("progressText").textContent = `${done} / ${total} earned`;
  $("progressPct").textContent = `${pct}%`;
  $("progressFill").style.width = `${pct}%`;
  $("progressNote").textContent =
    done === 0
      ? "Tick a trophy off when you earn it — progress is saved in this browser."
      : done === total
        ? "Platinum! Every trophy is earned — congratulations, Leonida Legend."
        : `${total - done} to go. The Roadmap tab shows the fastest order.`;
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
}

function toggleEarned(id) {
  if (earned.has(id)) earned.delete(id);
  else earned.add(id);
  saveState();
  renderAll();
}

function selectTrophy(id, { scroll = false } = {}) {
  selectedId = id;
  renderList();
  renderDetail();
  if (scroll) {
    const row = document.querySelector(`.trophy-row[data-id="${id}"]`);
    if (row) row.scrollIntoView({ block: "nearest" });
  }
  history.replaceState(null, "", `#trophy-${id}`);
}

function renderRoadmap() {
  if (!roadmap) return;
  $("roadmapTitle").textContent = roadmap.title;
  $("roadmapSubtitle").textContent = roadmap.subtitle;
  $("roadmapList").innerHTML = roadmap.stages
    .map((stage) => {
      const stageTrophies = stage.trophies.map(trophyById).filter(Boolean);
      const done = stageTrophies.filter((t) => earned.has(t.id)).length;
      const chips = stageTrophies
        .map((t) => `<button type="button" class="roadmap-trophy${earned.has(t.id) ? " earned" : ""}${t.missable ? " missable" : ""}" data-id="${t.id}">${escapeHtml(t.name)}</button>`)
        .join("");
      return `<li class="roadmap-stage">
        <div class="roadmap-num" aria-hidden="true">${stage.n}</div>
        <div>
          <h3>${escapeHtml(stage.title)}</h3>
          <p>${escapeHtml(stage.advice)}</p>
          <p class="roadmap-progress">${done} / ${stageTrophies.length} earned in this stage</p>
          <div class="roadmap-trophies">${chips}</div>
        </div>
      </li>`;
    })
    .join("");
}

function download(filename, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportProgress() {
  download("leonida-trophy-progress.json", JSON.stringify(
    { app: "leonida-trophy-guide", exported_at: new Date().toISOString(), earned: [...earned].sort((a, b) => a - b), spoiler: spoilerOn },
    null,
    2,
  ));
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      const ids = Array.isArray(data.earned) ? data.earned : [];
      const valid = ids.filter((id) => Number.isInteger(id) && trophyById(id));
      earned = new Set(valid);
      if (typeof data.spoiler === "boolean") spoilerOn = data.spoiler;
      saveState();
      syncControls();
      renderAll();
    } catch (err) {
      alert("That file is not a Leonida Trophy Guide export.");
    }
  };
  reader.readAsText(file);
}

function syncControls() {
  $("spoilerToggle").checked = spoilerOn;
  $("spoilerNote").hidden = !spoilerOn;
  document.querySelectorAll("#kindFilters .chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.kind === kindFilter);
  });
  $("gradeSelect").value = gradeFilter;
  $("searchInput").value = query;
}

function switchTab(which) {
  const checklist = which === "checklist";
  $("tabChecklist").classList.toggle("active", checklist);
  $("tabRoadmap").classList.toggle("active", !checklist);
  $("viewChecklist").classList.toggle("hidden", !checklist);
  $("viewRoadmap").classList.toggle("hidden", checklist);
}

function wireEvents() {
  $("trophyList").addEventListener("click", (event) => {
    const check = event.target.closest(".trophy-check");
    const row = event.target.closest(".trophy-row");
    if (!row) return;
    const id = Number(row.dataset.id);
    if (check) {
      event.preventDefault();
      toggleEarned(id);
      return;
    }
    selectTrophy(id);
  });
  $("roadmapList").addEventListener("click", (event) => {
    const chip = event.target.closest(".roadmap-trophy");
    if (!chip) return;
    switchTab("checklist");
    selectTrophy(Number(chip.dataset.id), { scroll: true });
  });
  $("kindFilters").addEventListener("click", (event) => {
    const chip = event.target.closest(".chip");
    if (!chip) return;
    kindFilter = chip.dataset.kind;
    syncControls();
    renderList();
  });
  $("gradeSelect").addEventListener("change", (event) => {
    gradeFilter = event.target.value;
    renderList();
  });
  $("searchInput").addEventListener("input", (event) => {
    query = event.target.value.trim().toLowerCase();
    renderList();
  });
  $("spoilerToggle").addEventListener("change", (event) => {
    spoilerOn = event.target.checked;
    saveState();
    syncControls();
    renderAll();
  });
  $("exportBtn").addEventListener("click", exportProgress);
  $("importBtn").addEventListener("click", () => $("importFile").click());
  $("importFile").addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) importProgress(file);
    event.target.value = "";
  });
  $("tabChecklist").addEventListener("click", () => switchTab("checklist"));
  $("tabRoadmap").addEventListener("click", () => switchTab("roadmap"));
}

async function init() {
  loadState();
  try {
    await loadData();
  } catch (err) {
    $("trophyList").innerHTML = `<li><p class="empty-note">Could not load the trophy data. Serve this folder over HTTP (for example, <code>python3 -m http.server</code>) and reload.</p></li>`;
    return;
  }
  const hash = window.location.hash.match(/^#trophy-(\d+)$/);
  const wanted = hash ? Number(hash[1]) : 17;
  selectedId = trophyById(wanted) ? wanted : 17;
  // Deep links: ?view=roadmap, ?kind=missable, ?grade=silver, ?spoiler=1 and
  // ?earned=2,3,4 let a link open the guide in a chosen state.
  const params = new URLSearchParams(window.location.search);
  if (["story", "missable", "collectibles", "activities"].includes(params.get("kind"))) {
    kindFilter = params.get("kind");
  }
  if (["platinum", "gold", "silver", "bronze"].includes(params.get("grade"))) {
    gradeFilter = params.get("grade");
  }
  if (params.get("spoiler") === "1") spoilerOn = true;
  if (params.get("earned")) {
    for (const part of params.get("earned").split(",")) {
      const id = Number(part);
      if (trophyById(id)) earned.add(id);
    }
    saveState();
  }
  wireEvents();
  syncControls();
  renderAll();
  if (params.get("view") === "roadmap") switchTab("roadmap");
}

init();
