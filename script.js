// Wait for DOM to load
window.addEventListener("DOMContentLoaded", () => {
  const calculateBtn = document.getElementById("calculateBtn");
  calculateBtn.addEventListener("click", generateSchedule);

  const resetBtn = document.getElementById("resetBtn");
  resetBtn.addEventListener("click", resetForm);

  // Dark Mode Toggle & Logo Switching
  document.getElementById("darkModeToggle").addEventListener("change", function() {
    const body = document.body;
    const logoImg = document.getElementById("logoImg");
    if (this.checked) {
      body.classList.add("dark-mode");
      logoImg.src = "logo_dark.jpg";
    } else {
      body.classList.remove("dark-mode");
      logoImg.src = "logo_light.jpg";
    }
  });

  // Easter Egg: Dino Game on yellow T square
  document.getElementById("dinoGameBtn").addEventListener("click", function() {
    window.open("dino.html", "_blank");
  });

  // Easter Egg: Memory Game on green O square
  document.getElementById("memoryGameBtn").addEventListener("click", function() {
    window.open("memory.html", "_blank");
  });
});

// Register service worker for offline support (placed right after DOMContentLoaded block)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then(reg => console.log("SW registered:", reg.scope))
      .catch(err => console.error("SW registration failed:", err));
  });
}

/**
 * Parse "YYYY-MM-DD" into a Date object (local time)
 */
function parseDateInput(input) {
  const [year, month, day] = input.split("-");
  return new Date(year, month - 1, day);
}

// Accessible, tap-friendly tooltips for rows that have a title=""
function initRowTooltips() {
  const tables = [document.getElementById("resultsSummary"), document.getElementById("currentDateModel")];
  const allTooltips = [];

  tables.forEach(tbl => {
    if (!tbl) return;
    tbl.querySelectorAll("tr[title]").forEach(row => {
      const helpText = row.getAttribute("title") || "";
      row.removeAttribute("title");

      const firstCell = row.querySelector("td:first-child, th:first-child");
      if (!firstCell || !helpText.trim()) return;

      // Create the (i) button and tooltip bubble
      const wrap = document.createElement("span");
      wrap.className = "cell-help";

      const btn = document.createElement("button");
      btn.className = "help-tip-btn";
      btn.type = "button";
      btn.setAttribute("aria-label", "More info");
      btn.setAttribute("aria-expanded", "false");
      btn.textContent = "i";

      const bubble = document.createElement("div");
      bubble.className = "tooltip-bubble";
      bubble.setAttribute("role", "tooltip");
      bubble.textContent = helpText;

      wrap.appendChild(btn);
      wrap.appendChild(bubble);
      firstCell.appendChild(wrap);

      allTooltips.push({ btn, bubble });
      let open = false;

      function openTip() {
        // close others
        allTooltips.forEach(t => {
          t.bubble.classList.remove("visible");
          t.btn.setAttribute("aria-expanded", "false");
        });
        bubble.classList.add("visible");
        btn.setAttribute("aria-expanded", "true");
        open = true;
      }

      function closeTip() {
        bubble.classList.remove("visible");
        btn.setAttribute("aria-expanded", "false");
        open = false;
      }

      // Toggle on click/tap
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        open ? closeTip() : openTip();
      });

      // Open on hover (nice for desktop), close on leave
      btn.addEventListener("mouseenter", openTip);
      wrap.addEventListener("mouseleave", () => { if (!btn.matches(":focus")) closeTip(); });

      // Keyboard support (Enter/Space/ESC)
      btn.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeTip();
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          open ? closeTip() : openTip();
        }
      });

      // Click outside closes it
      document.addEventListener("click", (e) => {
        if (!wrap.contains(e.target)) closeTip();
      });
    });
  });
}

// Run once DOM is ready
window.addEventListener("DOMContentLoaded", initRowTooltips);

/**
 * Main function to generate schedule, calculations, and weather forecast
 */
function generateSchedule() {
  const startDateInput = document.getElementById("startDate").value;
  const endDateInput = document.getElementById("endDate").value;
  const cityInput = document.getElementById("cityInput").value.trim();
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.textContent = "";

  // Validate date inputs
  if (!startDateInput || !endDateInput) {
    errorMessage.textContent = "Please enter both Start Date and End Date.";
    return;
  }

  const start = parseDateInput(startDateInput);
  const end = parseDateInput(endDateInput);

  if (start > end) {
    errorMessage.textContent = "Start Date cannot be after End Date.";
    return;
  }

  // Clear the schedule table
  const scheduleTableBody = document.querySelector("#scheduleTable tbody");
  scheduleTableBody.innerHTML = "";

  // Calculate the number of trip days (inclusive)  ✅ DST-proof change
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const dayCount =
    Math.floor(
      (Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) -
       Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) /
      MS_PER_DAY
    ) + 1;

  let weekendCount = 0;

  // Build schedule rows
  for (let i = 0; i < dayCount; i++) {
    const currentDate = new Date(start.getTime());
    currentDate.setDate(start.getDate() + i);

    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, "0");
    const d = String(currentDate.getDate()).padStart(2, "0");
    const dateKey = `${y}-${m}-${d}`;

    // Use dateMapping or fallback
    let dayOfWeek = dateMapping[dateKey] || getDayOfWeek(currentDate);
    if (dayOfWeek === "Sat" || dayOfWeek === "Sun") {
      weekendCount++;
    }

    // ✅ Mark first day by index, last day by actual date string
    const isEnd = (dateKey === endDateInput);
    const code = (i === 0 || isEnd) ? "T" : "S";

    // Create table row
    const row = document.createElement("tr");
    const dayCell = document.createElement("td");
    dayCell.textContent = dayOfWeek;
    const dateCell = document.createElement("td");
    dateCell.textContent = dateKey;
    const codeCell = document.createElement("td");
    codeCell.textContent = code;
    codeCell.classList.add(code);

    row.appendChild(dayCell);
    row.appendChild(dateCell);
    row.appendChild(codeCell);
    scheduleTableBody.appendChild(row);
  }

  // Turnaround calculations
  let turnaroundPercentValue = 0.25;
  if (dayCount > 7 && dayCount <= 13) {
    turnaroundPercentValue = 0.28;
  } else if (dayCount > 13) {
    turnaroundPercentValue = 0.3333;
  }

  const turnaroundDaysInitial = dayCount * turnaroundPercentValue;
  const additionalTurnaround = 0.25 * weekendCount;
  const finalTurnaroundDaysNotRounded = turnaroundDaysInitial + additionalTurnaround;
  const finalTurnaroundDaysRounded = Math.round(finalTurnaroundDaysNotRounded);
  const totalTurnaroundDays = finalTurnaroundDaysRounded;

  // Weekend bonus rate & contribution
  const weekendBonusRate = weekendCount > 0 ? 25 : 0;
  let weekendBonusContribution = 0;
  if (finalTurnaroundDaysNotRounded > 0) {
    weekendBonusContribution = ((additionalTurnaround / finalTurnaroundDaysNotRounded) * 100).toFixed(2);
  }

  // Update Results Summary
  document.getElementById("totalTripDays").textContent = dayCount;
  document.getElementById("totalWeekendDays").textContent = weekendCount;
  document.getElementById("totalTurnaroundDays").textContent = totalTurnaroundDays;

  // Update Current Date Model Display
  document.getElementById("turnaroundPercent").textContent = (turnaroundPercentValue * 100).toFixed(2) + "%";
  document.getElementById("modelWeekendDays").textContent = weekendCount;
  document.getElementById("modelTripDays").textContent = dayCount;
  document.getElementById("turnaroundDaysInitial").textContent = turnaroundDaysInitial.toFixed(2);
  document.getElementById("turnaroundDaysNotRounded").textContent = finalTurnaroundDaysNotRounded.toFixed(2);
  document.getElementById("weekendBonusRate").textContent = weekendBonusRate + "%";
  document.getElementById("weekendBonusPercent").textContent = weekendBonusContribution + "%";
  document.getElementById("turnaroundDaysRounded").textContent = finalTurnaroundDaysRounded;

  // === Human-readable math summary (auto-filled) ===
  try {
    const pctUsed = (turnaroundPercentValue * 100).toFixed(2);
    const wbRate = weekendBonusRate; // already a % (0 or 25)
    const summaryHTML = `
      Trip length: <b>${dayCount}</b> day(s) with <b>${weekendCount}</b> weekend day(s).<br>
      Base turnaround: <b>${dayCount}</b> × <b>${pctUsed}%</b> = <b>${turnaroundDaysInitial.toFixed(2)}</b>.<br>
      Weekend bonus: <b>${weekendCount}</b> × <b>${wbRate}%</b> = <b>${additionalTurnaround.toFixed(2)}</b>.<br>
      Total (not rounded): <b>${finalTurnaroundDaysNotRounded.toFixed(2)}</b> → rounded to <b>${finalTurnaroundDaysRounded}</b>.
    `;
    const summaryEl = document.getElementById("calcSummary");
    if (summaryEl) {
      summaryEl.style.display = "block";
      summaryEl.innerHTML = summaryHTML;
    } else {
      console.warn("calcSummary element not found in DOM.");
    }
  } catch (e) {
    console.error("Failed to render summary:", e);
  }

  // ✅ Append O-days starting from the calendar day AFTER the end date
  const turnaroundStartDate = new Date(
    end.getFullYear(), end.getMonth(), end.getDate() + 1
  );
  const scheduleTableBody2 = document.querySelector("#scheduleTable tbody");
  for (let j = 0; j < totalTurnaroundDays; j++) {
    const currentTurnaroundDate = new Date(turnaroundStartDate.getTime());
    currentTurnaroundDate.setDate(turnaroundStartDate.getDate() + j);

    const ty = currentTurnaroundDate.getFullYear();
    const tm = String(currentTurnaroundDate.getMonth() + 1).padStart(2, "0");
    const td = String(currentTurnaroundDate.getDate()).padStart(2, "0");
    const turnaroundDateKey = `${ty}-${tm}-${td}`;

    let turnaroundDayOfWeek = dateMapping[turnaroundDateKey] || getDayOfWeek(currentTurnaroundDate);

    const row = document.createElement("tr");
    const dayCell = document.createElement("td");
    dayCell.textContent = turnaroundDayOfWeek;
    const dateCell = document.createElement("td");
    dateCell.textContent = turnaroundDateKey;
    const codeCell = document.createElement("td");
    codeCell.textContent = "O";
    codeCell.classList.add("O");

    row.appendChild(dayCell);
    row.appendChild(dateCell);
    row.appendChild(codeCell);
    scheduleTableBody2.appendChild(row);
  }

  // If city input is provided, fetch weather
  if (cityInput !== "") {
    fetchWeatherForecast(cityInput, startDateInput);
  } else {
    document.getElementById("weatherForecast").innerHTML = "";
  }
}

/**
 * Fallback: returns abbreviated day name
 */
function getDayOfWeek(date) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
}

/**
 * Fetch weather forecast for the given city and trip start date
 */
function fetchWeatherForecast(city, tripStartDate) {
  // Basic logic: if city has no comma, add ",US"
  let queryCity = city;
  if (!queryCity.includes(",")) {
    queryCity += ",US";
  }

  const apiKey = "996b65a5e617bf8f1c3c1e9116aa1ab6"; // Replace with your real API key
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${queryCity}&appid=${apiKey}&units=imperial`;

  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error("Weather data not available");
      }
      return response.json();
    })
    .then(data => {
      const forecastList = data.list;
      // Filter forecasts for the exact trip start date
      const filteredForecasts = forecastList.filter(item => item.dt_txt.startsWith(tripStartDate));

      let weatherHTML = "";
      if (filteredForecasts.length > 0) {
        // Choose the forecast closest to noon
        let targetForecast = filteredForecasts.reduce((prev, curr) => {
          return Math.abs(new Date(curr.dt_txt).getHours() - 12) <
                 Math.abs(new Date(prev.dt_txt).getHours() - 12)
                 ? curr
                 : prev;
        });
        weatherHTML = `<h3>Weather Forecast for ${city} on ${tripStartDate}</h3>`;
        weatherHTML += `<p>Temperature: ${targetForecast.main.temp}°F</p>`;
        weatherHTML += `<p>Weather: ${targetForecast.weather[0].description}</p>`;
        weatherHTML += `<p>Wind: ${targetForecast.wind.speed} mph</p>`;
      } else {
        weatherHTML = `<p>No forecast data available for ${tripStartDate} in ${city}.</p>`;
      }
      document.getElementById("weatherForecast").innerHTML = weatherHTML;
    })
    .catch(error => {
      document.getElementById("weatherForecast").innerHTML = `<p>Error fetching weather: ${error.message}</p>`;
    });
}

/**
 * Reset function: Clears all inputs, tables, and error messages
 */
function resetForm() {
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  document.getElementById("cityInput").value = "";
  document.querySelector("#scheduleTable tbody").innerHTML = "";
  document.getElementById("totalTripDays").textContent = "0";
  document.getElementById("totalWeekendDays").textContent = "0";
  document.getElementById("totalTurnaroundDays").textContent = "0";
  document.getElementById("turnaroundPercent").textContent = "0%";
  document.getElementById("modelWeekendDays").textContent = "0";
  document.getElementById("modelTripDays").textContent = "0";
  document.getElementById("turnaroundDaysInitial").textContent = "0";
  document.getElementById("turnaroundDaysNotRounded").textContent = "0";
  document.getElementById("weekendBonusRate").textContent = "0%";
  document.getElementById("weekendBonusPercent").textContent = "0%";
  document.getElementById("turnaroundDaysRounded").textContent = "0";
  document.getElementById("weatherForecast").innerHTML = "";
  document.getElementById("errorMessage").textContent = "";
  const summaryEl = document.getElementById("calcSummary");
  if (summaryEl) summaryEl.innerHTML = "";
}

