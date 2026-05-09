const calendar = document.getElementById("calendar");
const monthYear = document.getElementById("monthYear");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const themeToggle = document.getElementById("themeToggle");
const courseSelect = document.getElementById("courseSelect");

const modal = document.getElementById("eventModal");
const courseInput = document.getElementById("courseInput");
const titleInput = document.getElementById("titleInput");
const startTimeInput = document.getElementById("startTimeInput");
const endTimeInput = document.getElementById("endTimeInput");
const saveEventBtn = document.getElementById("saveEvent");
const cancelEventBtn = document.getElementById("cancelEvent");

const recurringCheck = document.getElementById("recurringCheck");
const recurringFields = document.getElementById("recurringFields");
const recurStartInput = document.getElementById("recurStartInput");
const recurEndInput = document.getElementById("recurEndInput");

const modalTitle = document.getElementById("modalTitle");
const courseList = document.getElementById("courseList");

const calendarTab = document.getElementById("calendarTab");
const upcomingTab = document.getElementById("upcomingTab");
const calendarView = document.getElementById("calendarView");
const upcomingView = document.getElementById("upcomingView");
const weekPrev = document.getElementById("weekPrev");
const weekNext = document.getElementById("weekNext");
const weekLabel = document.getElementById("weekLabel");
const weekGrid = document.getElementById("weekGrid");

const DAY_START = 8 * 60;
const DAY_END = 20 * 60;
const DAY_HEIGHT = 180;

let selectedDateKey = null;
let ignoreEvent = null;

function isToday(year, month, day) {
  const t = new Date();
  return day === t.getDate() && month === t.getMonth() && year === t.getFullYear();
}

/* ---------- COLOR SEPARATION ---------- */
const courseColors = JSON.parse(localStorage.getItem("courseColors")) || { light : {}, dark : {} };

const PRESET_COLORS_LIGHT = [
  "#1565c0",
  "#2e7d32",
  "#c62828",
  "#6a1b9a",
  "#e65100",
  "#00838f", 
  "#4527a0",
  "#558b2f",
  "#d84315",
  "#00695c",
];

const PRESET_COLORS_DARK = [
  "#90caf9",
  "#a5d6a7",
  "#ef9a9a",
  "#ce93d8",
  "#ffcc80",
  "#80deea",
  "#b39ddb",
  "#c5e1a5",
  "#ffab91",
  "#80cbc4",
];


let lightIndex = 0;
let darkIndex = 0;


function getCourseColor(course) {
  const mode = isDarkMode() ? "dark" : "light";

  if (courseColors[mode][course]) {
    return courseColors[mode][course];
  }
  if (isDarkMode()) {
    const color = PRESET_COLORS_DARK[darkIndex % PRESET_COLORS_DARK.length];
    darkIndex++;
    courseColors.dark[course] = color;
  }
  else {
    const color = PRESET_COLORS_LIGHT[lightIndex % PRESET_COLORS_LIGHT.length];
    lightIndex++;
    courseColors.light[course] = color;
  }

  localStorage.setItem("courseColors", JSON.stringify(courseColors));

  return courseColors[mode][course];
}

/* ---------- DARK OR LIGHT MODE ---------- */
function isDarkMode() {
  return document.body.classList.contains("dark");
}

let currentDate = new Date();

// LOAD SAVED DATA
const events = JSON.parse(localStorage.getItem("events")) || {};

/* ---------- THEME ---------- */
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  renderCalendar();
});

/* ---------- DROPDOWN MENU ---------- */
function getAllCourses() {
  const courses = new Set();

  Object.values(events).forEach(dayEvents => {
    dayEvents.forEach(e => courses.add(e.course));
  });

  return [...courses];
}

function populateCourseDropdown() {
  courseSelect.innerHTML = `<option value="">All Courses</option>`;

  getAllCourses().forEach(course => {
    const option = document.createElement("option");
    option.value = course;
    option.textContent = course;
    courseSelect.appendChild(option);
  });
}

/* ---------- CALENDAR RENDER ---------- */
function renderCalendar() {
  calendar.innerHTML = "";
  const selectedCourse = courseSelect.value;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  monthYear.textContent =
    currentDate.toLocaleString("default", { month: "long" }) + " " + year;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    calendar.appendChild(document.createElement("div"));
  }

  // Actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDiv = document.createElement("div");
    dayDiv.className = "day";

    if (isToday(year,  month, day)) {
      dayDiv.classList.add("Today");
    }

    const number = document.createElement("div");
    number.className = "day-number";
    number.textContent = day;
    dayDiv.appendChild(number);

    const dayEventsDiv = document.createElement("div");
    dayEventsDiv.className = "day-events";
    dayDiv.appendChild(dayEventsDiv);

    const dateKey = `${year}-${month + 1}-${day}`;

    // Show events
    if (events[dateKey]) {
      const dayEvents = events[dateKey]
      .map((e, index) => ({
        ...e,
        startTime: normalizeTime(e.startTime),
        endTime: normalizeTime(e.endTime),
        id: index + "_" + (e.course || "") + "_" + (e.title || "")
      }))
      .sort((a, b) => {
        if (!a.startTime) {
          return 1;
        }
        if (!b.startTime) {
          return -1;
        }
        return a.startTime.localeCompare(b.startTime);
      });

      let lastBottom = 0;
      dayEvents.forEach(e => {
        if (selectedCourse && e.course !== selectedCourse) {
          return ;
        }

        const eventDiv = document.createElement("div");
        eventDiv.className = "event";
        eventDiv.dataset.id = e.id;

        let top = 0;
        let height = 20;

        if (e.startTime) {
          const startMin = timeToMinutes(e.startTime);
          let endMin = e.endTime ? timeToMinutes(e.endTime) : startMin + 60;

          if (isNaN(startMin)) {
            return ;
          }

          if (isNaN(endMin) || endMin <= startMin) {
            endMin = startMin + 60;
          }

          top = ((startMin - DAY_START) / (DAY_END - DAY_START)) * DAY_HEIGHT;
          height = Math.max(height, 24);
          
          if (top < lastBottom + 8) {
            top = lastBottom + 8;
          }

          if (top + height > DAY_HEIGHT) {
            return ;
          }

          lastBottom = top + height;
        } else {
          top = lastBottom + 8;
          lastBottom = top + height;
        }

        eventDiv.style.position = "absolute";
        eventDiv.style.top = `${top}px`;
        eventDiv.style.height = `${height}px`;
        eventDiv.style.left = "0";
        eventDiv.style.right = "0";

        let timeLabel = "";
        if (e.startTime && e.endTime) {
          timeLabel = `${e.startTime}-${e.endTime}`;
        } else if (e.startTime) {
          timeLabel = `${e.startTime}`;
        } else if (e.endTime) {
          timeLabel = `${e.endTime}`;
        }

        const recurIcon = e.recurringId ? " ↻" : "";
        eventDiv.innerHTML = `<div class="event-title">${e.course}: ${e.title}${recurIcon}</div><div class="event-time">${timeLabel}</div>`;
        eventDiv.style.background = getCourseColor(e.course);
        eventDiv.style.color = isDarkMode() ? "#000" : "#fff";

        eventDiv.addEventListener("click", evt => {
          evt.stopPropagation();
          openEditModal(dateKey, e);
        });

        dayEventsDiv.appendChild(eventDiv);
      });
    }

    // Click to add event
    dayDiv.addEventListener("click", () => openModal(dateKey));

    calendar.appendChild(dayDiv);
  }
}

/* ---------- EDIT EVENT ---------- */
function openEditModal(dateKey, eventObj) {
  selectedDateKey = dateKey;
  ignoreEvent = eventObj;
  modalTitle.textContent = "Edit Event";

  courseInput.value = eventObj.course;
  titleInput.value = eventObj.title;
  startTimeInput.value = eventObj.startTime || "";
  endTimeInput.value = eventObj.endTime || "";

  modal.classList.remove("hidden");

  const oldDeleteButton = modal.querySelector(".delete-btn");
  if (oldDeleteButton) {
    oldDeleteButton.remove();
  }

  const oldDeleteAllButton = modal.querySelector(".delete-all-btn");
  if (oldDeleteAllButton) {
    oldDeleteAllButton.remove();
  }

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete Event";
  deleteBtn.classList.add("delete-btn");
  deleteBtn.onclick = () => {
    removeEvent(dateKey, eventObj);
    modal.classList.add("hidden");
    selectedDateKey = null;
    ignoreEvent = null;
    populateCourseDropdown();
    populateCourseAutoComplete();
    renderCalendar();
    if (!upcomingView.classList.contains("hidden")) {
      renderWeekView();
    }
  };

  modal.querySelector(".modal-content").appendChild(deleteBtn);

  if (eventObj.recurringId) {
    const deleteAllBtn = document.createElement("button");
    deleteAllBtn.textContent = "Delete All Occurrences";
    deleteAllBtn.classList.add("delete-all-btn");
    deleteAllBtn.onclick = () => {
      removeAllRecurring(eventObj.recurringId);
      modal.classList.add("hidden");
      selectedDateKey = null;
      ignoreEvent = null;
      populateCourseDropdown();
      populateCourseAutoComplete();
      renderCalendar();
      if (!upcomingView.classList.contains("hidden")) {
        renderWeekView();
      }
    };

    modal.querySelector(".modal-content").appendChild(deleteAllBtn);
  }

  saveEventBtn.onclick = () => {
    const course = courseInput.value.trim();
    const title = titleInput.value.trim();
    const rawStart = startTimeInput.value.trim();
    const rawEnd = endTimeInput.value.trim();
    const startTime = normalizeTime(rawStart);
    const endTime = normalizeTime(rawEnd);

    if ((rawStart && !startTime) || (rawEnd && !endTime)) {
      alert("Invalid time format. Use formats like 1pm, 12:30am, or 14:00.");
      return;
    }

    if (!title) {
      alert("Title required!");
      return;
    }

    if (startTime && endTime) {
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      if (startMinutes > endMinutes) {
        alert("Start time cannot be after the end time!");
        return;
      }
    }

    if (hasConflict(dateKey, startTime, endTime)) {
      alert("This event conflicts with an existing one!");
      return;
    }

    if (eventObj.recurringId) {
      const choice = confirm("Save changes to all occurrences? Click OK for all, Cancel for just this one.");

      if (choice) {
        Object.keys(events).forEach(dk => {
          events[dk] = events[dk].map(e => {
            if (e.recurringId === eventObj.recurringId) {
              return {...e, course, title, startTime, endTime};
            }

            return e;
          });
        });
      }
      else {
        removeEvent(dateKey, eventObj);

        if (!events[dateKey]) {
          events[dateKey] = [];
        }

        events[dateKey].push({
          course,
          title,
          startTime,
          endTime
        });
      }
    }
    else {
      removeEvent(dateKey, eventObj);
      
      if (!events[dateKey]) {
        events[dateKey] = [];
      }

      events[dateKey].push({
        course,
        title,
        startTime,
        endTime
      });
    }

    localStorage.setItem("events", JSON.stringify(events));
    modal.classList.add("hidden");
    selectedDateKey = null;
    ignoreEvent = null;

    populateCourseDropdown();
    populateCourseAutoComplete();
    renderCalendar();
    if (!upcomingView.classList.contains("hidden")) {
      renderWeekView();
    }
  };
}


/* ---------- NORMALIZE TIME ---------- */
function normalizeTime(input) {
  if (!input) {
    return null;
  }

  const time = input.trim().toLowerCase();

  const match = time.match(/^(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?$/);

  if (!match) {
    return null;
  }

  let hour = parseInt(match[1]);
  let minute = match[2] !== undefined ? Number(match[2]) : 0;
  const period = match[3];

  if (period) {
    if (hour < 1 || hour > 12) {
      return null;
    }
    if (hour === 12) {
      hour = 0;
    }
    if (period === "pm") {
      hour += 12;
    }
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

/* ---------- MODAL ---------- */
function openModal(dateKey) {
  selectedDateKey = dateKey;
  ignoreEvent = null;
  courseInput.value = "";
  titleInput.value = "";
  startTimeInput.value = "";
  endTimeInput.value = "";
  recurringCheck.checked = false;
  recurringFields.style.display = "none";
  modal.classList.remove("hidden");
  modalTitle.textContent = "Add Event";

  const [year, month, day] = dateKey.split("-").map(Number);
  const padded = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  recurStartInput.value = padded;
  recurEndInput.value = "";

  const oldDeleteButton = modal.querySelector(".delete-btn");
  if (oldDeleteButton) {
    oldDeleteButton.remove();
  }

  const oldDeleteAllButton = modal.querySelector(".delete-all-btn");
  if (oldDeleteAllButton) {
    oldDeleteAllButton.remove();
  }

  saveEventBtn.onclick = () => {
    const course = courseInput.value;
    const title = titleInput.value.trim();

    const rawStart = startTimeInput.value.trim();
    const rawEnd = endTimeInput.value.trim();
    const startTime = normalizeTime(rawStart);
    const endTime = normalizeTime(rawEnd);

    if ((rawStart && !startTime) || (rawEnd && !endTime)) {
      alert("Invalid time format. Use formats like 1pm, 12:30am, or 14:00.");
      return;
    }

    if (!title) {
      alert("Title required!");
      return;
    }

    let newEndTime = endTime;

    if (startTime && endTime) {
      const [startH, startM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (startMinutes > endMinutes) {
        alert("Start time cannot be after the end time!");
        return;
      }

      if (startMinutes === endMinutes) {
        newEndTime = null;
      }

      if (hasConflict(selectedDateKey, startTime, newEndTime)) {
        alert("This event conflicts with an existing one!");
        return;
      }
    }

    if(recurringCheck.checked) {
      const start = new Date(recurStartInput.value + "T00:00:00");
      const end = new Date(recurEndInput.value + "T00:00:00");

      if (!recurStartInput.value || !recurEndInput.value) {
        alert("Please fill in both start and end dates for recurring events.");
        return ;
      }

      if (end < start) {
        alert("End date cannot be before start date.");
        return ;
      }

      const recurringId = crypto.randomUUID();
      const current = new Date(start);

      while (current <= end) {
        const dk = `${current.getFullYear()}-${current.getMonth() + 1}-${current.getDate()}`;

        if (!hasConflict(dk, startTime, endTime)) {
          if (!events[dk]) {
            events[dk] = [];
          }

          events[dk].push({
            id: crypto.randomUUID(),
            recurringId,
            course,
            title,
            startTime,
            endTime: newEndTime
          });
        }

        current.setDate(current.getDate() + 7);
      }
    }
      else {
        if (hasConflict(selectedDateKey, startTime, endTime)) {
          alert("This event conflicts with an existing one!");
          return ;
        }

        if (!events[selectedDateKey]) {
          events[selectedDateKey] = [];
        }
        events[selectedDateKey].push({
          id: crypto.randomUUID(),
          course,
          title,
          startTime,
          endTime: newEndTime
        });
      }

    localStorage.setItem("events", JSON.stringify(events));
    modal.classList.add("hidden");

    populateCourseDropdown();
    populateCourseAutoComplete();
    renderCalendar();
  }
}

recurringCheck.addEventListener("change", () => {
  recurringFields.style.display = recurringCheck.checked ? "block" : "none";
});

cancelEventBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  selectedDateKey = null;
  ignoreEvent = null;
});

/* ---------- CLOSE MODAL ---------- */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    modal.classList.add("hidden");
    selectedDateKey = null;
    ignoreEvent = null;
  }
});

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.add("hidden");
    selectedDateKey = null;
    ignoreEvent = null;
  }
});

/* ---------- REMOVE EVENT ---------- */
function removeEvent(dateKey, eventToRemove) {
  events[dateKey] = events[dateKey].filter(e => {
    const eStart = normalizeTime(e.startTime);
    const eEnd = normalizeTime(e.endTime);
    const rStart = normalizeTime(eventToRemove.startTime);
    const rEnd = normalizeTime(eventToRemove.endTime);

    return !(
      e.course === eventToRemove.course &&
      e.title === eventToRemove.title &&
      eStart === rStart &&
      eEnd === rEnd
    );
  });

  if (!events[dateKey] || events[dateKey].length === 0) {
    delete events[dateKey];
  }

  localStorage.setItem("events", JSON.stringify(events));
}

function removeAllRecurring(recurringId) {
  Object.keys(events).forEach(dateKey =>{
    events[dateKey] = events[dateKey].filter(e => e.recurringId !== recurringId);
    if (events[dateKey].length === 0) {
      delete events[dateKey];
    }
  });

  localStorage.setItem("events", JSON.stringify(events));
}

/* ---------- NAVIGATION ---------- */
prevBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

nextBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

courseSelect.addEventListener("change", renderCalendar);

/* ---------- CONFLICT CHECKING ---------- */
function hasConflict(dateKey, newStart, newEnd) {
  if (!newStart) {
    return false;
  }

  const [nsH, nsM] = newStart.split(":").map(Number);
  const newStartMin = nsH * 60 + nsM;
  const newEndMin = newEnd ? newEnd.split(":").map(Number).reduce((h, m) => h * 60 + m) : newStartMin + 60;
  
  return (events[dateKey] || []).some(e => {
    if (ignoreEvent && e.course === ignoreEvent.course && e.title === ignoreEvent.title && normalizeTime(e.startTime) === normalizeTime(ignoreEvent.startTime) && normalizeTime(e.endTime) === normalizeTime(ignoreEvent.endTime)) {
      return false;
    }

    if (!e.startTime) {
      return false;
    }

    const [sH, sM] = e.startTime.split(":").map(Number);
    const startMin = sH * 60 + sM;
    const endMin = e.endTime ? e.endTime.split(":").map(Number).reduce((h, m) => h * 60 + m) : startMin + 60;

    return newStartMin < endMin && newEndMin > startMin;
  });
}

/* ---------- MINUTES CONVERSION ---------- */
function timeToMinutes(time) {
  if (!time || typeof time !== "string") {
    return NaN;
  }
  const parts = time.split(":").map(Number);
  if (parts.length !== 2 || parts.some(isNaN)) {
    return NaN;
  }
  const [h, m] = parts;

  return h * 60 + m;
}

/* ---------- POPULATE COURSES FOR AUTOCOMPLETE ---------- */
function populateCourseAutoComplete() {
  courseList.innerHTML = "";
  getAllCourses().forEach(course => {
    const option = document.createElement("option");
    option.value = course;
    courseList.appendChild(option);
  });
}

/* ---------- UPCOMING TAB ---------- */
function getWeekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

let currentWeekStart = getWeekStart(new Date());

function renderWeekView() {
  weekGrid.innerHTML = "";
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  const startLabel = days[0].toLocaleDateString("default", {month: "short", day: "numeric"});
  const endLabel = days[6].toLocaleDateString("default", {month: "short", day: "numeric", year: "numeric"});
  weekLabel.textContent = `${startLabel} - ${endLabel}`;

  const HOURS_START = 0;
  const HOURS_END = 23;
  const HOUR_HEIGHT = 60;
  const TOTAL_HEIGHT = (HOURS_END - HOURS_START) * HOUR_HEIGHT;

  days.forEach(day => {
    const isPast = day < today;
    const isToday = day.getTime() === today.getTime();

    const dateKey = `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`;
    const dayEvents = events[dateKey] || [];

    const col = document.createElement("div");
    col.className = "week-col" + (isPast ? " week-past" : "") + (isToday ? " week-today" : "");

    const header = document.createElement("div");
    header.className = "week-col-header";
    header.innerHTML = `<span class ="week-day-name">${day.toLocaleDateString("default", {weekday: "short"})}</span><span class ="week-day-num">${day.getDate()}</span>`
    col.appendChild(header);

    const allDayRow = document.createElement("div");
    allDayRow.className = "week-allday-row";
    const allDayLabel = document.createElement("div");
    allDayLabel.className = "week-allday-label";
    allDayLabel.textContent = "All Day";
    allDayRow.appendChild(allDayLabel);

    dayEvents.filter(e => !e.startTime).forEach(e => {
      const chip = document.createElement("div");
      chip.className = "week-allday-chip";
      chip.textContent = `${e.course}: ${e.title}`;
      chip.style.background = getCourseColor(e.course);
      chip.style.color = isDarkMode() ? "#000" : "#fff";

      chip.addEventListener("click", evt => {
        evt.stopPropagation();
        openEditModal(dateKey, e);
      });
      allDayRow.appendChild(chip);
    });
    col.appendChild(allDayRow);

    const timeGrid = document.createElement("div");
    timeGrid.className = "week-time-grid";
    timeGrid.style.height = `${TOTAL_HEIGHT}px`;
    timeGrid.style.position = "relative";

    for (let h = HOURS_START; h <= HOURS_END; h++) {
      const line = document.createElement("div");
      line.className = "week-hour-line";
      line.style.top = `${(h - HOURS_START) * HOUR_HEIGHT}px`;
      timeGrid.appendChild(line);
    }

    dayEvents.filter(e => e.startTime).forEach(e => {
      const startMin = timeToMinutes(normalizeTime(e.startTime));
      if (isNaN(startMin)) {
        return;
      }

      const endMin = e.endTime ? timeToMinutes(normalizeTime(e.endTime)) : startMin + 60;

      const top = (startMin / 60) * HOUR_HEIGHT;
      const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 24);

      if (top < 0 || top > TOTAL_HEIGHT) {
        return;
      }

      const eventDiv = document.createElement("div");
      eventDiv.className = "week-event";
      eventDiv.style.top = `${top}px`;
      eventDiv.style.height = `${height}px`;
      eventDiv.style.background = getCourseColor(e.course);
      eventDiv.style.color = isDarkMode() ? "#000" : "#fff";
      eventDiv.innerHTML = `<div class="week-event-title">${e.course}: ${e.title}${e.recurringId ? " ↻" : ""}</div><div class="week-event-time">${normalizeTime(e.startTime)}${e.endTime ? "-" + normalizeTime(e.endTime) : ""}</div>`;
      eventDiv.addEventListener("click", evt => {
        evt.stopPropagation();
        openEditModal(dateKey, e);
      });
      timeGrid.appendChild(eventDiv);
    });

    col.appendChild(timeGrid);
    weekGrid.appendChild(col);
  });

  const timeCol = document.querySelector(".week-time-col");
  timeCol.innerHTML = `<div class='week-header-spacer'></div><div class='week-allday-spacer'><span class='week-allday-spacer-label'>All Day</span></div>`;
  for (let h = HOURS_START; h <= HOURS_END; h++) {
    const label = document.createElement("div");
    label.className = "week-hour-label";
    label.style.height = `${HOUR_HEIGHT}px`;
    label.style.top = `${(h - HOURS_START) * HOUR_HEIGHT}px`;
    label.textContent = h === 0 ? "12am" : h === 12 ? "12pm" : h < 12 ? `${h}am` : `${h - 12}pm`;
    timeCol.appendChild(label);
  }
}

calendarTab.addEventListener("click", () => {
  calendarView.classList.remove("hidden");
  upcomingView.classList.add("hidden");
  calendarTab.classList.add("active");
  upcomingTab.classList.remove("active");
});

upcomingTab.addEventListener("click", () => {
  upcomingView.classList.remove("hidden");
  calendarView.classList.add("hidden");
  upcomingTab.classList.add("active");
  calendarTab.classList.remove("active");
  currentWeekStart = getWeekStart(new Date());
  renderWeekView();
});

weekPrev.addEventListener("click", () => {
  currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  renderWeekView();
});

weekNext.addEventListener("click", () => {
  currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  renderWeekView();
});

/* ---------- INIT ---------- */
populateCourseDropdown();
populateCourseAutoComplete();
renderCalendar();