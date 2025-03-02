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

  // Easter Egg: Click yellow square (T) for Dino Game
  document.getElementById("dinoGameBtn").addEventListener("click", function() {
    window.open("dino.html", "_blank");
  });

  // Easter Egg: Click green square (O) for Memory Game
  document.getElementById("memoryGameBtn").addEventListener("click", function() {
    window.open("memory.html", "_blank");
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
 * Main function to generate schedule, calculations, and weather forecast
 */
function generateSchedule() {
  const startDateInput = document.getElementById("startDate").value;
  const endDateInput = document.getElementById("endDate").value;
  const cityInput = document.getElementById("cityInput").value.trim();
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

  // Loop through trip days
  for (let i = 0; i < dayCount; i++) {
    const currentDate = new Date(start.getTime());
    currentDate.setDate(start.getDate() + i);

    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, "0");
    const d = String(currentDate.getDate()).padStart(2, "0");
    const dateKey = `${y}-${m}-${d}`;

    let dayOfWeek = dateMapping[dateKey] || getDayOfWeek(currentDate);
    if (dayOfWeek === "Sat" || dayOfWeek === "Sun") {
      weekendCount++;
    }

    const code = (i === 0 || i === dayCount - 1) ? "T" : "S";

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

  // Weekend Bonus Rate (static 25% if any weekend exists)
  const weekendBonusRate = weekendCount > 0 ? 25 : 0;
  // Weekend Bonus Contribution: percentage of total turnaround days from weekend bonus
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
  document.getElementById("turnaroundDaysInitial").textContent = turnaroundDaysInitial.toFixed(2);
  document.getElementById("turnaroundDaysNotRounded").textContent = finalTurnaroundDaysNotRounded.toFixed(2);
  document.getElementById("weekendBonusRate").textContent = weekendBonusRate + "%";
  document.getElementById("weekendBonusPercent").textContent = weekendBonusContribution + "%";
  document.getElementById("turnaroundDaysRounded").textContent = finalTurnaroundDaysRounded;

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
    scheduleTableBody.appendChild(row);
  }

  // If a city is provided, fetch the weather forecast for the trip start date
  if (cityInput !== "") {
    fetchWeatherForecast(cityInput, startDateInput);
  } else {
    document.getElementById("weatherForecast").innerHTML = "";
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
 * Fetch weather forecast for the given city and trip start date
 */
function fetchWeatherForecast(city, tripStartDate) {
  const apiKey = "996b65a5e617bf8f1c3c1e9116aa1ab6"; // Replace with your OpenWeatherMap API key
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city},US&appid=${apiKey}&units=imperial`;

  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error("Weather data not available");
      }
      return response.json();
    })
    .then(data => {
      // Find forecast for the trip start date
      const forecastList = data.list;
      // Filter forecasts for the trip start date (YYYY-MM-DD)
      const filteredForecasts = forecastList.filter(item => item.dt_txt.startsWith(tripStartDate));
      let weatherHTML = "";
      if (filteredForecasts.length > 0) {
        // For simplicity, choose the forecast closest to noon
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
 * Reset function: Clears all inputs, tables, and error messages.
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
}
