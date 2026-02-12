const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const state = {
  theme: localStorage.getItem("theme") || "dark",
  filter: "All",
  query: "",
  cards: [
    { title: "Movie Library", desc: "Browse your collection like a mini streaming UI.", tag: "Media" },
    { title: "Story Breakdown", desc: "Analyze what makes a movie rewatchable.", tag: "Analysis" },
    { title: "Behind the Scenes", desc: "Production trivia and hidden stories.", tag: "Production" },
    { title: "Watchlist", desc: "Queue up classics and track rewatches.", tag: "Media" },
    { title: "Timeline Notes", desc: "Scene-by-scene notes with timestamps.", tag: "Analysis" },
    { title: "Sound + Score", desc: "Why the music elevates the story.", tag: "Production" },
    { title: "Characters", desc: "Motives, arcs, and what lands emotionally.", tag: "Analysis" },
    { title: "Practical Effects", desc: "Old-school craft that still holds up.", tag: "Production" },
    { title: "Collections", desc: "Tags, categories, and smart sorting.", tag: "Media" },
  ],
  tags: ["All", "Media", "Analysis", "Production"],
};

const commands = [
  { title: "Toggle Theme", desc: "Switch dark/light mode", run: () => toggleTheme() },
  { title: "Focus Search", desc: "Jump to the search input", run: () => $("#searchInput").focus() },
  { title: "Clear Filters", desc: "Reset tag + search query", run: () => setFilter("All", true) },
  { title: "Shuffle Cards", desc: "Randomize the grid order", run: () => shuffleCards() },
  { title: "Show Toast", desc: "Tiny notification demo", run: () => toast("Yep — vanilla can look premium.") },
];

function applyTheme() {
  if (state.theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
    $("#metricTheme").textContent = "Light";
  } else {
    document.documentElement.removeAttribute("data-theme");
    $("#metricTheme").textContent = "Dark";
  }
  localStorage.setItem("theme", state.theme);
}

function toggleTheme() {
  state.theme = state.theme === "light" ? "dark" : "light";
  applyTheme();
  toast(`Theme: ${state.theme}`);
}

function renderChips() {
  const wrap = $("#chips");
  wrap.innerHTML = "";
  state.tags.forEach(tag => {
    const btn = document.createElement("button");
    btn.className = "chip";
    btn.textContent = tag;
    btn.setAttribute("aria-pressed", tag === state.filter ? "true" : "false");
    btn.addEventListener("click", () => setFilter(tag));
    wrap.appendChild(btn);
  });
}

function getFilteredCards() {
  const q = state.query.trim().toLowerCase();
  return state.cards.filter(c => {
    const tagOk = state.filter === "All" || c.tag === state.filter;
    const textOk = !q || (c.title + " " + c.desc + " " + c.tag).toLowerCase().includes(q);
    return tagOk && textOk;
  });
}

function renderCards() {
  const grid = $("#grid");
  grid.innerHTML = "";

  const cards = getFilteredCards();
  cards.forEach(c => {
    const el = document.createElement("article");
    el.className = "card";
    el.tabIndex = 0;
    el.innerHTML = `
      <h3>${c.title}</h3>
      <p>${c.desc}</p>
      <div class="meta">
        <span class="tag">${c.tag}</span>
        <span class="muted">↵ Enter</span>
      </div>
    `;

    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") toast(`Opened: ${c.title}`);
    });
    el.addEventListener("click", () => toast(`Opened: ${c.title}`));

    grid.appendChild(el);
  });

  $("#metricCards").textContent = state.cards.length;
  $("#metricFiltered").textContent = cards.length;
}

function setFilter(tag, clearSearch = false) {
  state.filter = tag;
  if (clearSearch) {
    state.query = "";
    $("#searchInput").value = "";
  }
  renderChips();
  renderCards();
}

function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2200);
}

function shuffleCards() {
  for (let i = state.cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [state.cards[i], state.cards[j]] = [state.cards[j], state.cards[i]];
  }
  renderCards();
  toast("Shuffled.");
}

/* -------- Command Palette -------- */
function openCmd() {
  $("#cmdModal").classList.add("open");
  $("#cmdModal").setAttribute("aria-hidden", "false");
  $("#cmdInput").value = "";
  renderCmdList("");
  $("#cmdInput").focus();
}

function closeCmd() {
  $("#cmdModal").classList.remove("open");
  $("#cmdModal").setAttribute("aria-hidden", "true");
}

function renderCmdList(query) {
  const q = query.trim().toLowerCase();
  const list = $("#cmdList");
  list.innerHTML = "";

  const filtered = commands.filter(c =>
    (c.title + " " + c.desc).toLowerCase().includes(q)
  );

  filtered.forEach((c) => {
    const row = document.createElement("div");
    row.className = "cmdItem";
    row.innerHTML = `
      <div class="cmdItem__left">
        <div class="cmdItem__title">${c.title}</div>
        <div class="cmdItem__desc">${c.desc}</div>
      </div>
      <div class="kbd">Enter</div>
    `;
    row.addEventListener("click", () => { c.run(); closeCmd(); });
    list.appendChild(row);
  });
}

function wireUI() {
  applyTheme();
  renderChips();
  renderCards();

  $("#themeBtn").addEventListener("click", toggleTheme);
  $("#cmdBtn").addEventListener("click", openCmd);

  $("#toastBtn").addEventListener("click", () => toast("Clean UI. No framework. ✅"));
  $("#shuffleBtn").addEventListener("click", shuffleCards);

  $("#searchInput").addEventListener("input", (e) => {
    state.query = e.target.value;
    renderCards();
  });

  $("#clearSearch").addEventListener("click", () => {
    state.query = "";
    $("#searchInput").value = "";
    renderCards();
  });

  $("#cmdInput").addEventListener("input", (e) => renderCmdList(e.target.value));

  $("#cmdModal").addEventListener("click", (e) => {
    if (e.target?.dataset?.close === "true") closeCmd();
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    $("#metricFocus").textContent = document.activeElement?.tagName || "None";

    const isCmdOpen = $("#cmdModal").classList.contains("open");
    if (e.key === "Escape" && isCmdOpen) closeCmd();

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      isCmdOpen ? closeCmd() : openCmd();
    }

    if (!isCmdOpen && e.key === "/") {
      e.preventDefault();
      $("#searchInput").focus();
    }
  });
}

wireUI();