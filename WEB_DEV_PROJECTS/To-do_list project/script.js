/* ============================================================
   PART 1: THE TO-DO LIST
   ============================================================ */

// ---- Step 1: Grab the HTML elements we need to control ----
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const progressPercentEl = document.getElementById('progress-percent');
const progressFillEl = document.getElementById('progress-fill');

// ---- Step 2: Our data ----
// Each task now looks like: { text, completed, date }
// "date" is filled in AUTOMATICALLY (no new input box needed) —
// whatever day you click "Add" on is the day the task gets stamped
// with. That's what lets us answer "how many did I finish today?".
let tasks = [];

const savedTasks = localStorage.getItem('tasks');
if (savedTasks) {
  tasks = JSON.parse(savedTasks);
  // Tasks saved before this update won't have a "date" — give them
  // today's date as a harmless fallback so nothing breaks.
  tasks.forEach(function (task) {
    if (!task.date) task.date = todayStr();
  });
}

// ---- Small date helper, shared by both parts of this file ----
// Turns a Date object into a "YYYY-MM-DD" text string using LOCAL
// time. We use this (instead of toISOString) because ISO time is
// based on UTC and can accidentally shift the date by a day
// depending on where you live.
function toDateStr(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function todayStr() {
  return toDateStr(new Date());
}

// ---- Step 3: Functions ----
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks() {
  taskList.innerHTML = '';

  tasks.forEach(function (task, index) {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '');

    const span = document.createElement('span');
    span.textContent = task.text;
    span.addEventListener('click', function () {
      tasks[index].completed = !tasks[index].completed;
      saveTasks();
      renderTasks();
      renderProgress();
      updateDayStats(); // keep the "finished on this date" count in sync
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', function () {
      tasks.splice(index, 1);
      saveTasks();
      renderTasks();
      renderProgress();
      renderCalendar(); // a day's dot/count may need to disappear
      updateDayStats();
    });

    li.appendChild(span);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });
}

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

  tasks.push({ text: text, completed: false, date: todayStr() });
  taskInput.value = '';
  saveTasks();
  renderTasks();
  renderProgress();
  renderCalendar();   // today's cell now has one more task
  updateDayStats();
}

// ---- Step 4: Connect user actions to our functions ----
addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') addTask();
});


/* ============================================================
   PART 2: THE CALENDAR
   ============================================================ */

const calendarBody = document.getElementById('calendar-body');
const monthYearLabel = document.getElementById('month-year');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');

// Which month is currently being displayed.
let calendarViewDate = new Date();

// Which date the user has clicked on, to inspect its stats.
// Starts as today, so you see today's count without clicking anything.
let selectedDate = todayStr();

// Creates (once) a little box under the calendar header to show
// "X of Y tasks finished" for whatever date is selected. We build
// this with JavaScript instead of editing the HTML file.
const dayStatsEl = document.createElement('div');
dayStatsEl.id = 'day-stats';
dayStatsEl.style.textAlign = 'center';
dayStatsEl.style.color = '#faf7f7';
dayStatsEl.style.fontSize = '13px';
dayStatsEl.style.margin = '4px 0 10px';
document
  .querySelector('.calendar-header')
  .insertAdjacentElement('afterend', dayStatsEl);

// Counts how many tasks fall on a given "YYYY-MM-DD" date, and how
// many of those are completed.
function getStatsForDate(dateStr) {
  const dayTasks = tasks.filter(function (t) { return t.date === dateStr; });
  const completed = dayTasks.filter(function (t) { return t.completed; }).length;
  return { total: dayTasks.length, completed: completed };
}

// Updates the little stats box to match whatever date is selected.
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
        // blank cell before the 1st
      } else if (date > daysInMonth) {
        // blank cell after the last day
      } else {
        const cellDateStr = toDateStr(new Date(year, month, date));
        cell.textContent = date;
        cell.style.cursor = 'pointer';
        cell.style.borderRadius = '4px';

        // ---- Pinpoint today ----
        if (cellDateStr === todayStr()) {
          cell.style.border = '2px solid #4a90e2';
          cell.style.fontWeight = 'bold';
        }

        // ---- Highlight whichever date is currently selected ----
        if (cellDateStr === selectedDate) {
          cell.style.backgroundColor = '#4a90e2';
          cell.style.color = '#ffffff';
        }

        // ---- Small dot under any day that has tasks ----
        const stats = getStatsForDate(cellDateStr);
        if (stats.total > 0) {
          cell.title = `${stats.completed} of ${stats.total} finished`;
          if (cellDateStr !== selectedDate) {
            cell.style.textDecoration = 'underline';
          }
        }

        // Clicking a day selects it and refreshes the stats box.
        cell.addEventListener('click', function () {
          selectedDate = cellDateStr;
          renderCalendar();
          updateDayStats();
        });

        date = date + 1;
      }

      row.appendChild(cell);
    }

    calendarBody.appendChild(row);
  }
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
   PART 3: DRAW EVERYTHING ONCE, WHEN THE PAGE FIRST LOADS
   ============================================================ */
renderTasks();
renderProgress();
renderCalendar();
updateDayStats();