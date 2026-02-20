const storageKey = "aws-30-day-zero-to-pro-progress-v3";
const dayItems = Array.from(document.querySelectorAll(".day-item"));
const dayToggles = Array.from(document.querySelectorAll(".day-toggle"));
const subtaskCheckboxes = Array.from(document.querySelectorAll(".subtask"));
const metaTasks = Array.from(document.querySelectorAll(".meta-task"));
const notesFields = Array.from(document.querySelectorAll(".day-note"));
const progressCount = document.getElementById("progressCount");
const progressFill = document.getElementById("progressFill");
const resetBtn = document.getElementById("resetBtn");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");

function emptyState() {
  return {
    version: 1,
    subtasks: [],
    meta: [],
    notes: {}
  };
}

function normalizeState(raw) {
  const base = emptyState();
  if (!raw || typeof raw !== "object") return base;

  base.subtasks = Array.isArray(raw.subtasks) ? raw.subtasks.map(String) : [];
  base.meta = Array.isArray(raw.meta) ? raw.meta.map(String) : [];

  if (raw.notes && typeof raw.notes === "object") {
    Object.keys(raw.notes).forEach((key) => {
      base.notes[String(key)] = String(raw.notes[key] ?? "");
    });
  }

  return base;
}

function loadState() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return emptyState();
    return normalizeState(JSON.parse(raw));
  } catch (_) {
    return emptyState();
  }
}

function saveState(state) {
  localStorage.setItem(storageKey, JSON.stringify(normalizeState(state)));
}

function getDaySubtasks(day) {
  return subtaskCheckboxes.filter((cb) => cb.dataset.day === String(day));
}

function updateDayVisual(day) {
  const subtasks = getDaySubtasks(day);
  const checked = subtasks.filter((cb) => cb.checked).length;
  const allDone = subtasks.length > 0 && checked === subtasks.length;
  const someDone = checked > 0 && !allDone;

  const dayToggle = document.querySelector(`.day-toggle[data-day="${day}"]`);
  const dayItem = document.querySelector(`.day-item[data-day="${day}"]`);

  if (dayToggle) {
    dayToggle.checked = allDone;
    dayToggle.indeterminate = someDone;
  }
  if (dayItem) {
    dayItem.classList.toggle("done", allDone);
  }

  subtasks.forEach((subtask) => {
    const row = subtask.closest("li");
    if (row) row.classList.toggle("done", subtask.checked);
  });
}

function updateProgress() {
  const totalDays = dayToggles.length;
  const completedDays = dayToggles.filter((cb) => cb.checked).length;
  const pct = totalDays === 0 ? 0 : Math.round((completedDays / totalDays) * 100);

  progressCount.textContent = `${completedDays}/${totalDays} days complete (${pct}%)`;
  progressFill.style.width = `${pct}%`;
}

function paintChecklist() {
  const state = loadState();
  const doneSubtasks = new Set(state.subtasks);
  const doneMeta = new Set(state.meta);

  subtaskCheckboxes.forEach((subtask) => {
    subtask.checked = doneSubtasks.has(subtask.dataset.id);
  });

  metaTasks.forEach((meta) => {
    meta.checked = doneMeta.has(meta.dataset.id);
  });

  notesFields.forEach((field) => {
    const day = field.closest(".day-item")?.dataset.day;
    field.value = day ? state.notes[day] || "" : "";
  });

  dayToggles.forEach((dayToggle) => {
    updateDayVisual(dayToggle.dataset.day);
  });

  updateProgress();
}

subtaskCheckboxes.forEach((subtask) => {
  subtask.addEventListener("change", () => {
    const state = loadState();
    const doneSubtasks = new Set(state.subtasks);

    if (subtask.checked) doneSubtasks.add(subtask.dataset.id);
    else doneSubtasks.delete(subtask.dataset.id);

    state.subtasks = Array.from(doneSubtasks);
    saveState(state);
    updateDayVisual(subtask.dataset.day);
    updateProgress();
  });
});

dayToggles.forEach((dayToggle) => {
  dayToggle.addEventListener("change", () => {
    const day = dayToggle.dataset.day;
    const daySubtasks = getDaySubtasks(day);
    const state = loadState();
    const doneSubtasks = new Set(state.subtasks);

    daySubtasks.forEach((subtask) => {
      subtask.checked = dayToggle.checked;
      if (dayToggle.checked) doneSubtasks.add(subtask.dataset.id);
      else doneSubtasks.delete(subtask.dataset.id);
    });

    state.subtasks = Array.from(doneSubtasks);
    saveState(state);
    updateDayVisual(day);
    updateProgress();
  });
});

metaTasks.forEach((meta) => {
  meta.addEventListener("change", () => {
    const state = loadState();
    const doneMeta = new Set(state.meta);

    if (meta.checked) doneMeta.add(meta.dataset.id);
    else doneMeta.delete(meta.dataset.id);

    state.meta = Array.from(doneMeta);
    saveState(state);
  });
});

notesFields.forEach((field) => {
  field.addEventListener("input", () => {
    const day = field.closest(".day-item")?.dataset.day;
    if (!day) return;

    const state = loadState();
    state.notes[day] = field.value;
    saveState(state);
  });
});

exportBtn.addEventListener("click", () => {
  const state = loadState();
  const payload = {
    exportedAt: new Date().toISOString(),
    ...state
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "aws-30-day-progress.json";
  link.click();
  URL.revokeObjectURL(link.href);
});

importBtn.addEventListener("click", () => {
  importFile.value = "";
  importFile.click();
});

importFile.addEventListener("change", async () => {
  const file = importFile.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const state = normalizeState(parsed);
    saveState(state);
    paintChecklist();
  } catch (_) {
    alert("Invalid backup file. Please import a valid JSON export.");
  }
});

resetBtn.addEventListener("click", () => {
  localStorage.removeItem(storageKey);
  paintChecklist();
});

paintChecklist();
