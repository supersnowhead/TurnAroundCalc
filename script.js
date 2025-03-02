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
      logoImg.src = "logo_dark.jpg"; // Use your dark-mode logo
    } else {
      body.classList.remove("dark-mode");
      logoImg.src = "logo_light.jpg"; // Use your light-mode logo
    }
  });
});

/**
 * Parse "YYYY-MM-DD" into a Date object (local time)
 */
function parseDateInput(input) {
  const [year, month, day] = input.split("-");
  return new Date(year, month - 1, day);
}

/**
 * Main function to generate schedule and perform calculations
 */
function generateSchedule() {
  const startDateInput = document.getElementById("startDate").value;
  const endDateInput = document.getElementById("endDate").value;
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.textContent = "";

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

  // Clear schedule table
  const scheduleTableBody = document.querySelector("#scheduleTable tbody");
  scheduleTableBody.innerHTML = "";

  // Calculate trip days (inclusive)
  const dayCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  let weekendCount = 0;

  // Loop through each day in the trip
  for (let i = 0; i < dayCount; i++) {
    const currentDate = new Date(start.getTime());
    currentDate.setDate(start.getDate() + i);

    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, "0");
    const d = String(currentDate.getDate()).padStart(2, "0");
    const dateKey = `${y}-${m}-${d}`;

    // Fallback if dateMapping doesn't have the date
    let dayOfWeek = dateMapping[dateKey] || getDayOfWeek(currentDate);

    // Check if it's a weekend
    if (dayOfWeek === "Sat" || dayOfWeek === "Sun") {
      weekendCount++;
    }

    // Code: T on first & last day, otherwise S
    const code = (i === 0 || i === dayCount - 1) ? "T" : "S";

    // Build a table row
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

  // Turnaround Calculations
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

  // Weekend Bonus Rate: 25% if weekendCount > 0, else 0%
  const weekendBonusRate = weekendCount > 0 ? 25 : 0;
  // Weekend Bonus Contribution: % of total turnaround days from the weekend bonus
  let weekendBonusContribution = 0;
  if (finalTurnaroundDaysNotRounded > 0) {
    weekendBonusContribution = ((additionalTurnaround / finalTurnaroundDaysNotRounded) * 100).toFixed(2);
  }

  // Update Results Summary
  document.getElementById("totalTripDays").textContent = dayCount;
  document.getElementById("totalWeekendDays").textContent = weekendCount;
  document.getElementById("totalTurnaroundDays").textContent = totalTurnaroundDays;

  // Update Current Date Model Display
  document.getElementById("turnaroundPercent").textContent =
    (turnaroundPercentValue * 100).toFixed(2) + "%";
  document.getElementById("modelWeekendDays").textContent = weekendCount;
  document.getElementById("modelTripDays").textContent = dayCount;
  document.getElementById("turnaroundDaysInitial").textContent =
    turnaroundDaysInitial.toFixed(2);
  document.getElementById("turnaroundDaysNotRounded").textContent =
    finalTurnaroundDaysNotRounded.toFixed(2);
  document.getElementById("weekendBonusRate").textContent =
    weekendBonusRate + "%";
  document.getElementById("weekendBonusPercent").textContent =
    weekendBonusContribution + "%";
  document.getElementById("turnaroundDaysRounded").textContent =
    finalTurnaroundDaysRounded;

  // Append O-days (Turnaround Days) to the schedule table
  const turnaroundStartDate = new Date(end.getTime());
  turnaroundStartDate.setDate(end.getDate() + 1);
  for (let j = 0; j < totalTurnaroundDays; j++) {
    const currentTurnaroundDate = new Date(turnaroundStartDate.getTime());
    currentTurnaroundDate.setDate(turnaroundStartDate.getDate() + j);

    const ty = currentTurnaroundDate.getFullYear();
    const tm = String(currentTurnaroundDate.getMonth() + 1).padStart(2, "0");
    const td = String(currentTurnaroundDate.getDate()).padStart(2, "0");
    const turnaroundDateKey = `${ty}-${tm}-${td}`;

    let turnaroundDayOfWeek =
      dateMapping[turnaroundDateKey] || getDayOfWeek(currentTurnaroundDate);

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
    scheduleTableBody.appendChild(row);
  }
}

/**
 * Fallback: Returns abbreviated day name.
 */
function getDayOfWeek(date) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
}

/**
 * Reset function: Clears all inputs, tables, and error messages.
 */
function resetForm() {
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
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
  document.getElementById("errorMessage").textContent = "";
}
