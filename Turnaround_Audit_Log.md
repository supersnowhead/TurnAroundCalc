# 🧮 Turnaround Day Calculator — Audit Log
**Version:** 1.0  
**Status:** Active Development  
**Last Updated:** October 2025  

---

## 🎯 Overview
This document tracks issues, improvements, and cleanup tasks for the **Turnaround Day Calculator** project.

---

## 🧮 Calculation & Logic
- [ ] **Remove legacy “data mining” code**  
  Old test logic no longer needed now that date generation is clean.  
- [ ] **Validate weather data meaning**  
  Confirm whether weather API values represent daily high, low, or average temperatures.  
- [ ] **Add unit/context to weather results**  
  Example: “Forecast High (°F) for this date.”

---

## 🎨 Layout & Display
- [ ] **Calculation Summary Box width**  
  Currently wider than all other boxes/tables. Align or constrain for visual balance.  
- [ ] **Tooltip wrapping**  
  Text runs off on small screens (portrait mode). Ensure tooltips auto-expand or wrap dynamically.  
- [ ] **Responsive consistency**  
  Test layout in landscape and portrait on both iPhone and Android browsers.

---

## 🌤️ Weather Feature Improvements
- [ ] **Update placeholder text**  
  Change input hint from “Enter US City” → “Enter ZIP Code (preferred)” for clarity.  
- [ ] **Improve feedback**  
  When ZIP entered, display full location (e.g., *Charlotte, NC*) and specify data context.  
- [ ] **Add note under forecast**  
  Example: “Temperatures shown are forecasted daily highs.”

---

## 🧹 Code Cleanup & Refactoring
- [ ] Remove commented test sections and console logs.  
- [ ] Verify only active functions remain (`calculateDays()`, `fetchWeather()`, etc.).  
- [ ] Confirm service worker and PWA caching scripts are clean and consistent.

---

## 🧠 Future Ideas
- [ ] Dark mode logo auto-toggle  
- [ ] Optional “Auto ZIP from location” feature for faster weather lookup  
- [ ] Compact mobile view toggle (key stats only)  
- [ ] Version indicator in footer (“v1.0 Build Oct 2025”)  

---

## 🧾 Notes
- The project originated from an **Excel calculator**, then evolved into a **Python GUI**, and now exists as a full **progressive web app**.  
- Core principle: keep it **fast, functional, and field-friendly** — optimized for travel, mobile use, and offline operation.
