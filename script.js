const storageKey = "aws-30-day-zero-to-pro-progress-v1";
const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"][data-day]'));
const progressCount = document.getElementById("progressCount");
const progressFill = document.getElementById("progressFill");
const resetBtn = document.getElementById("resetBtn");

function getSavedDays() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map(String));
  } catch (_) {
    return new Set();
  }
}

function saveDays(doneDays) {
  localStorage.setItem(storageKey, JSON.stringify(Array.from(doneDays)));
}

function paintChecklist() {
  const doneDays = getSavedDays();
  checkboxes.forEach((checkbox) => {
    const day = checkbox.dataset.day;
    const done = doneDays.has(day);
    checkbox.checked = done;
    checkbox.closest("li").classList.toggle("done", done);
  });
  updateProgress();
}

function updateProgress() {
  const completed = checkboxes.filter((cb) => cb.checked).length;
  const total = checkboxes.length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  progressCount.textContent = `${completed}/${total} days complete (${pct}%)`;
  progressFill.style.width = `${pct}%`;
}

checkboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    const day = checkbox.dataset.day;
    const doneDays = getSavedDays();
    if (checkbox.checked) doneDays.add(day);
    else doneDays.delete(day);
    checkbox.closest("li").classList.toggle("done", checkbox.checked);
    saveDays(doneDays);
    updateProgress();
  });
});

resetBtn.addEventListener("click", () => {
  localStorage.removeItem(storageKey);
  paintChecklist();
});

paintChecklist();
