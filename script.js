const storageKey = "aws-30-day-zero-to-pro-progress-v2";
const dayItems = Array.from(document.querySelectorAll(".day-item"));
const dayToggles = Array.from(document.querySelectorAll(".day-toggle"));
const subtaskCheckboxes = Array.from(document.querySelectorAll(".subtask"));
const progressCount = document.getElementById("progressCount");
const progressFill = document.getElementById("progressFill");
const resetBtn = document.getElementById("resetBtn");

function getSavedSubtasks() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map(String));
  } catch (_) {
    return new Set();
  }
}

function saveSubtasks(doneSubtasks) {
  localStorage.setItem(storageKey, JSON.stringify(Array.from(doneSubtasks)));
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
  const doneSubtasks = getSavedSubtasks();

  subtaskCheckboxes.forEach((subtask) => {
    subtask.checked = doneSubtasks.has(subtask.dataset.id);
  });

  dayToggles.forEach((dayToggle) => {
    updateDayVisual(dayToggle.dataset.day);
  });

  updateProgress();
}

subtaskCheckboxes.forEach((subtask) => {
  subtask.addEventListener("change", () => {
    const doneSubtasks = getSavedSubtasks();
    const id = subtask.dataset.id;

    if (subtask.checked) doneSubtasks.add(id);
    else doneSubtasks.delete(id);

    saveSubtasks(doneSubtasks);
    updateDayVisual(subtask.dataset.day);
    updateProgress();
  });
});

dayToggles.forEach((dayToggle) => {
  dayToggle.addEventListener("change", () => {
    const day = dayToggle.dataset.day;
    const daySubtasks = getDaySubtasks(day);
    const doneSubtasks = getSavedSubtasks();

    daySubtasks.forEach((subtask) => {
      subtask.checked = dayToggle.checked;
      if (dayToggle.checked) doneSubtasks.add(subtask.dataset.id);
      else doneSubtasks.delete(subtask.dataset.id);
    });

    saveSubtasks(doneSubtasks);
    updateDayVisual(day);
    updateProgress();
  });
});

resetBtn.addEventListener("click", () => {
  localStorage.removeItem(storageKey);
  paintChecklist();
});

paintChecklist();

