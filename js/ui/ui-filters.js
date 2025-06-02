import {
  getActiveDataSourceType,
  getYearFilterStates,
  setYearFilterState,
} from "../store/app-state.js";

export function setupYearFilterListeners() {
  const unitYearFilter = document.getElementById("default-year-filter");
  if (unitYearFilter) {
    unitYearFilter.addEventListener("change", (event) => {
      if (event.target.name === "year-decade") {
        saveCurrentYearFilterState("unit");
      }
    });
  }
  const stringYearFilter = document.getElementById(
    "string-default-year-filter"
  );
  if (stringYearFilter) {
    stringYearFilter.addEventListener("change", (event) => {
      if (event.target.name === "string-year-decade") {
        saveCurrentYearFilterState("string");
      }
    });
  }
}

export function saveCurrentYearFilterState(searchType) {
  const dataSourceType = getActiveDataSourceType() || "default";
  const checkboxName =
    searchType === "unit" ? "year-decade" : "string-year-decade";
  const yearFilterContainerId =
    searchType === "unit"
      ? "default-year-filter"
      : "string-default-year-filter";
  const yearFilterContainer = document.getElementById(yearFilterContainerId);

  if (dataSourceType === "default" && yearFilterContainer) {
    yearFilterContainer
      .querySelectorAll(`input[name="${checkboxName}"]`)
      .forEach((cb) => {
        setYearFilterState(dataSourceType, searchType, cb.value, cb.checked);
      });
  }
}

export function restoreYearFilterState(searchType) {
  const dataSourceType = getActiveDataSourceType() || "default";
  const checkboxName =
    searchType === "unit" ? "year-decade" : "string-year-decade";
  const yearFilterContainerId =
    searchType === "unit"
      ? "default-year-filter"
      : "string-default-year-filter";
  const yearFilterContainer = document.getElementById(yearFilterContainerId);

  if (dataSourceType === "default" && yearFilterContainer) {
    const stateObj = getYearFilterStates()[dataSourceType][searchType];
    yearFilterContainer
      .querySelectorAll(`input[name="${checkboxName}"]`)
      .forEach((cb) => {
        if (stateObj[cb.value] !== undefined) {
          cb.checked = stateObj[cb.value];
        }
      });
  }
}

export function getYearFilterSettingsFromDOM() {
  const yearFilterDecades = [];
  document
    .querySelectorAll('input[name="year-decade"]:checked')
    .forEach((input) => {
      if (input.value === "before1869") {
        yearFilterDecades.push("before1869s");
      } else if (input.value === "after2000") {
        yearFilterDecades.push("after2000s");
      } else if (input.value === "unknown") {
        yearFilterDecades.push("unknown");
      } else {
        yearFilterDecades.push(input.value + "s");
      }
    });

  const startInput = document.getElementById("year-range-start");
  const endInput = document.getElementById("year-range-end");
  let customYearRange = null;

  if (startInput && endInput) {
    const startValue = startInput.value.trim();
    const endValue = endInput.value.trim();

    if (startValue !== "" || endValue !== "") {
      const startYear = startValue !== "" ? parseInt(startValue, 10) : 0;
      const endYear = endValue !== "" ? parseInt(endValue, 10) : 9999;
      if (!isNaN(startYear) && !isNaN(endYear)) {
        if (startYear <= endYear) {
          customYearRange = {
            start: startYear,
            end: endYear,
          };
        } else {
          console.warn(
            `[getYearFilterSettings] 開始年(${startYear})が終了年(${endYear})より大きいため、範囲指定は無効です。`
          );
        }
      }
    }
  }
  return { yearFilterDecades, customYearRange };
}

export function getStringYearFilterSettingsFromDOM() {
  const yearFilterDecades = [];
  document
    .querySelectorAll('input[name="string-year-decade"]:checked')
    .forEach((input) => {
      if (input.value === "before1869") {
        yearFilterDecades.push("before1869s");
      } else if (input.value === "after2000") {
        yearFilterDecades.push("after2000s");
      } else if (input.value === "unknown") {
        yearFilterDecades.push("unknown");
      } else {
        yearFilterDecades.push(input.value + "s");
      }
    });

  const startInput = document.getElementById("string-year-range-start");
  const endInput = document.getElementById("string-year-range-end");
  let customYearRange = null;

  if (startInput && endInput) {
    const startValue = startInput.value.trim();
    const endValue = endInput.value.trim();

    if (startValue !== "" || endValue !== "") {
      const startYear = startValue !== "" ? parseInt(startValue, 10) : 0;
      const endYear = endValue !== "" ? parseInt(endValue, 10) : 9999;
      if (!isNaN(startYear) && !isNaN(endYear)) {
        if (startYear <= endYear) {
          customYearRange = {
            start: startYear,
            end: endYear,
          };
        } else {
          console.warn(
            `[getStringYearFilterSettings] 開始年(${startYear})が終了年(${endYear})より大きいため、範囲指定は無効です。`
          );
        }
      }
    }
  }
  return { yearFilterDecades, customYearRange };
}
