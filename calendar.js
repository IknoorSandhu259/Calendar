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

const DAY_START = 8 * 60;
const DAY_END = 20 * 60;
const DAY_HEIGHT = 180;

let selectedDateKey = null;

/* ---------- COLOR SEPARATION ---------- */
const savedColors = JSON.parse(localStorage.getItem("courseColors")) || {};

const courseColors = {
  "CS101": "#4caf50",
  "MATH200": "#2196f3",
  "PHYS150": "#f44336",
  "ENG110": "#9c27b0"
};

function getCourseColor(course) {
  if (courseColors[course]) {
    return courseColours[course];
  }

  const hue = Math.floor(Math.random() * 360);
  const saturation = 70;
  const lightness = 50;
  const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  courseColors[course] = color;

  localStorage.setItem("courseColors", JSON.stringify(courseColors));

  return color;
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

          if (isNaN(startMin) || isNaN(endMin) || endMin <= startMin) {
            endMin = startMin + 60;
          }

          top = ((startMin - DAY_START) / (DAY_END - DAY_START)) * DAY_HEIGHT;
          height = Math.max(height, 24);
          
          if (top < lastBottom + 8) {
            top = lastBottom + 8;
          }

          if (top + height > DAY_HEIGHT) {
            height = DAY_HEIGHT - top;
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
        }

        eventDiv.innerHTML = `<div class="event-title">${e.course}: ${e.title}</div><div class="event-time">${timeLabel}</div>`;
        eventDiv.style.background = getCourseColor(e.course);
        eventDiv.style.color = isDarkMode() ? "#fff" : "#000";

        eventDiv.addEventListener("click", evt => {
          evt.stopPropagation();
          handleEventClick(dateKey, e);
        });

        dayEventsDiv.appendChild(eventDiv);
      });
    }

    // Click to add event
    dayDiv.addEventListener("click", () => openModal(dateKey));

    calendar.appendChild(dayDiv);
  }
}

// Function that removes events
function handleEventClick(dateKey, eventObj) {
  const confirmed = confirm(
    `Remove "${eventObj.title}" from ${eventObj.course}?`
  );

  if (confirmed) {
    removeEvent(dateKey, eventObj);
  }
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
  courseInput.value = "";
  titleInput.value = "";
  startTimeInput.value = "";
  endTimeInput.value = "";
  modal.classList.remove("hidden");
}

cancelEventBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  selectedDateKey = null;
});

saveEventBtn.addEventListener("click", () => {
  if (!selectedDateKey) {
    return ;
  }

  const course = courseInput.value;
  const title = titleInput.value.trim();

  const rawStart = startTimeInput.value.trim();
  const rawEnd = endTimeInput.value.trim();
  const startTime = normalizeTime(rawStart);
  const endTime = normalizeTime(rawEnd);

  if ((rawStart && !startTime) || (rawEnd && !endTime)) {
    alert("Invalid time format. Use formats like 1pm, 12:30am, or 14:00.");
    return ;
  }

  if (!title) {
    alert("Title required!");
    return ;
  }

  let newEndTime = endTime;

  if (startTime && endTime) {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startTime && endTime && startMinutes > endMinutes) {
      alert("Start time cannot be after the end time!");
      return ;
    }

    if (startMinutes === endMinutes) {
      newEndTime = null;
    }

    if (hasConflict(selectedDateKey, startTime, newEndTime)) {
      alert("This event conflicts with an existing one");
      return ;
    }
  }

  if (!events[selectedDateKey]) {
    events[selectedDateKey] = [];
  }

  events[selectedDateKey].push({
    course,
    title,
    startTime,
    endTime: newEndTime
  });

  localStorage.setItem("events", JSON.stringify(events));
  modal.classList.add("hidden");

  populateCourseDropdown();
  renderCalendar();
});

/* ---------- CLOSE MODAL ---------- */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    modal.classList.add("hidden");
    selectedDateKey = null;
  }
});

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.add("hidden");
    selectedDateKey = null;
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

  if (events[dateKey].length === 0) {
    delete events[dateKey];
  }

  localStorage.setItem("events", JSON.stringify(events));
  populateCourseDropdown();
  renderCalendar();
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
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/* ---------- INIT ---------- */
populateCourseDropdown();
renderCalendar();