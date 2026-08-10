/* ============================================================
   PART 0: SMALL SHARED HELPERS
   ============================================================ */

// Turns a Date object into a "YYYY-MM-DD" text string using LOCAL
// time, so it matches the date the user actually sees/picks.
function toDateStr(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function todayStr() {
  return toDateStr(new Date());
}


/* ============================================================
   PART 1: LIGHT / DARK MODE
   ============================================================ */

const themeToggleBtn = document.getElementById('theme-toggle');

function applyTheme(theme) {
  // Adding/removing a CSS class is all this needs to do — every
  // color in style.css is written as var(--something), and the
  // "light-mode" class on <body> swaps those variables' values.
  if (theme === 'light') {
    document.body.classList.add('light-mode');
    themeToggleBtn.textContent = '☀️ Light';
  } else {
    document.body.classList.remove('light-mode');
    themeToggleBtn.textContent = '🌙 Dark';
  }
}

// Remember the choice across visits, same trick as saving tasks.
const savedTheme = localStorage.getItem('theme') || 'dark';
applyTheme(savedTheme);

themeToggleBtn.addEventListener('click', function () {
  const isLight = document.body.classList.contains('light-mode');
  const newTheme = isLight ? 'dark' : 'light';
  applyTheme(newTheme);
  localStorage.setItem('theme', newTheme);
});


/* ============================================================
   PART 2: THE TO-DO LIST
   ============================================================ */

const taskInput = document.getElementById('task-input');
const taskDateInput = document.getElementById('task-date');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const listHeading = document.getElementById('list-heading');
const todayBtn = document.getElementById('today-btn');
const progressPercentEl = document.getElementById('progress-percent');
const progressFillEl = document.getElementById('progress-fill');

// Each task looks like: { text, completed, date }
// "date" now comes from the new date picker, so you can schedule a
// task for TODAY (the default) or any day in advance.
let tasks = [];

const savedTasks = localStorage.getItem('tasks');
if (savedTasks) {
  tasks = JSON.parse(savedTasks);
  tasks.forEach(function (task) {
    if (!task.date) task.date = todayStr(); // fallback for old saved tasks
  });
}

// Which date's tasks are currently shown in the main list.
// This is shared with the calendar below — clicking a calendar day
// changes this same variable, which is what "replaces" the list.
let selectedDate = todayStr();

// Default the date picker to today, so adding a task is one click
// unless you specifically want to schedule it ahead.
taskDateInput.value = todayStr();

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Redraws the list heading ("Today's Tasks" or a specific date).
function renderListHeading() {
  listHeading.textContent = selectedDate === todayStr()
    ? "Today's Tasks"
    : `Tasks for ${selectedDate}`;
}

// Redraws the <ul>, showing ONLY tasks whose date matches
// selectedDate — this is the "replace the list" behavior.
function renderTasks() {
  taskList.innerHTML = '';
  renderListHeading();

  const visibleTasks = tasks.filter(function (t) {
    return t.date === selectedDate;
  });

  if (visibleTasks.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty-message';
    li.textContent = 'No tasks for this date yet.';
    taskList.appendChild(li);
    return;
  }

  visibleTasks.forEach(function (task) {
    // Look up this task's real position in the full "tasks" array
    // (not its position in visibleTasks) so toggling/deleting hits
    // the right task even though the list is filtered.
    const index = tasks.indexOf(task);

    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '');

    const span = document.createElement('span');
    span.textContent = task.text;
    span.addEventListener('click', function () {
      tasks[index].completed = !tasks[index].completed;
      saveTasks();
      renderTasks();
      renderProgress();
      renderCalendar(); // that day's completed count may have changed
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', function () {
      tasks.splice(index, 1);
      saveTasks();
      renderTasks();
      renderProgress();
      renderCalendar();
    });

    li.appendChild(span);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });
}

// The progress bar always reflects ALL tasks (every date combined),
// separate from whichever single day the list is currently showing.
function renderProgress() {
  const total = tasks.length;
  const completed = tasks.filter(function (t) { return t.completed; }).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  progressPercentEl.textContent = percent + '%';
  progressFillEl.style.width = percent + '%';
}

function addTask() {
  const text = taskInput.value.trim();
  if (text === '') return;

  // If the date field is somehow empty, fall back to today.
  const date = taskDateInput.value || todayStr();

  tasks.push({ text: text, completed: false, date: date });
  taskInput.value = '';
  saveTasks();

  // Jump the list to show the date you just added a task for, so
  // you immediately see it appear.
  selectedDate = date;

  renderTasks();
  renderProgress();
  renderCalendar();
}

addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') addTask();
});

todayBtn.addEventListener('click', function () {
  selectedDate = todayStr();
  renderTasks();
  renderCalendar();
});


/* ============================================================
   PART 3: THE CALENDAR
   ============================================================ */

const calendarBody = document.getElementById('calendar-body');
const monthYearLabel = document.getElementById('month-year');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');

// Which MONTH is currently on screen (separate from selectedDate,
// which is which single DAY's tasks are being shown).
let calendarViewDate = new Date();

// A small "X of Y finished" line under the calendar header.
const dayStatsEl = document.createElement('div');
dayStatsEl.id = 'day-stats';
document
  .querySelector('.calendar-header')
  .insertAdjacentElement('afterend', dayStatsEl);

function getStatsForDate(dateStr) {
  const dayTasks = tasks.filter(function (t) { return t.date === dateStr; });
  const completed = dayTasks.filter(function (t) { return t.completed; }).length;
  return { total: dayTasks.length, completed: completed };
}

function updateDayStats() {
  const stats = getStatsForDate(selectedDate);
  const isToday = selectedDate === todayStr();
  const label = isToday ? 'Today' : selectedDate;

  dayStatsEl.textContent = stats.total === 0
    ? `${label}: no tasks`
    : `${label}: ${stats.completed} of ${stats.total} tasks finished`;
}

function renderCalendar() {
  calendarBody.innerHTML = '';

  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth();

  monthYearLabel.textContent = calendarViewDate.toLocaleDateString(
    undefined,
    { month: 'long', year: 'numeric' }
  );

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();

  let date = 1;

  while (date <= daysInMonth) {
    const row = document.createElement('tr');

    for (let weekday = 0; weekday < 7; weekday++) {
      const cell = document.createElement('td');

      if (date === 1 && weekday < startWeekday) {
        cell.className = 'empty';
      } else if (date > daysInMonth) {
        cell.className = 'empty';
      } else {
        const cellDateStr = toDateStr(new Date(year, month, date));
        cell.textContent = date;

        if (cellDateStr === todayStr()) cell.classList.add('today');
        if (cellDateStr === selectedDate) cell.classList.add('selected');

        const stats = getStatsForDate(cellDateStr);
        if (stats.total > 0) {
          cell.title = `${stats.completed} of ${stats.total} finished`;
          const countEl = document.createElement('span');
          countEl.className = 'day-count';
          countEl.textContent = `${stats.completed}/${stats.total}`;
          cell.appendChild(countEl);
        }

        // Clicking a day is what "replaces" the to-do list above
        // with that day's tasks.
        cell.addEventListener('click', function () {
          selectedDate = cellDateStr;
          renderTasks();
          renderCalendar();
          updateDayStats();
        });

        date = date + 1;
      }

      row.appendChild(cell);
    }

    calendarBody.appendChild(row);
  }

  updateDayStats();
}

prevMonthBtn.addEventListener('click', function () {
  calendarViewDate = new Date(
    calendarViewDate.getFullYear(),
    calendarViewDate.getMonth() - 1,
    1
  );
  renderCalendar();
});

nextMonthBtn.addEventListener('click', function () {
  calendarViewDate = new Date(
    calendarViewDate.getFullYear(),
    calendarViewDate.getMonth() + 1,
    1
  );
  renderCalendar();
});


/* ============================================================
   PART 4: DRAW EVERYTHING ONCE, WHEN THE PAGE FIRST LOADS
   ============================================================ */
renderTasks();
renderProgress();
renderCalendar();
