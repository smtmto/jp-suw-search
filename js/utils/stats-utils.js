export function calculateFilteredStats(statsData) {
  const defaultStats = { total_tokens: 0, filtered_tokens: 0, file_count: 0 };
  if (!statsData || !statsData.decade_stats) {
    console.warn("[calculateFilteredStats] Invalid statsData provided.");
    return defaultStats;
  }

  const activeTab =
    document.querySelector(".tab.active")?.getAttribute("data-tab") ||
    "unit-search";
  const checkboxName =
    activeTab === "string-search" ? "string-year-decade" : "year-decade";
  const selectedDecadeKeys = new Set();
  let isAnyChecked = false;
  let hasCustomRange = false;

  document
    .querySelectorAll(`input[name="${checkboxName}"]:checked`)
    .forEach((checkbox) => {
      isAnyChecked = true;
      if (checkbox.value === "before1869") {
        selectedDecadeKeys.add("before1869s");
      } else if (checkbox.value === "after2000") {
        selectedDecadeKeys.add("after2000s");
      } else if (checkbox.value === "unknown") {
        selectedDecadeKeys.add("unknown");
      } else {
        selectedDecadeKeys.add(checkbox.value + "s");
      }
    });

  const startInputId =
    activeTab === "string-search"
      ? "string-year-range-start"
      : "year-range-start";
  const endInputId =
    activeTab === "string-search" ? "string-year-range-end" : "year-range-end";
  const startInput = document.getElementById(startInputId);
  const endInput = document.getElementById(endInputId);

  let customYearStart = null;
  let customYearEnd = null;

  if (startInput && endInput) {
    const startValue = startInput.value.trim();
    const endValue = endInput.value.trim();

    if (startValue !== "" || endValue !== "") {
      const startYear = startValue !== "" ? parseInt(startValue, 10) : 0;
      const endYear = endValue !== "" ? parseInt(endValue, 10) : 9999;

      if (!isNaN(startYear) && !isNaN(endYear) && startYear <= endYear) {
        customYearStart = startYear;
        customYearEnd = endYear;
        hasCustomRange = true;
      }
    }
  }

  if (!isAnyChecked && !hasCustomRange) {
    return {
      total_tokens: statsData.total_tokens || 0,
      filtered_tokens: statsData.filtered_tokens || 0,
      file_count: statsData.file_count || 0,
    };
  }

  let totalTokens = 0;
  let filteredTokens = 0;
  const includedDecades = new Set();

  if (hasCustomRange) {
    for (const decadeKey in statsData.decade_stats) {
      let includeDecade = false;

      if (decadeKey === "before1869s") {
        includeDecade = customYearStart <= 1869;
      } else if (decadeKey === "after2000s") {
        includeDecade = customYearEnd >= 2000;
      } else if (decadeKey === "unknown") {
        includeDecade = false;
      } else {
        const match = decadeKey.match(/^(\d{4})s$/);
        if (match) {
          const decadeStart = parseInt(match[1], 10);
          const decadeEnd = decadeStart + 9;
          includeDecade = !(
            decadeEnd < customYearStart || decadeStart > customYearEnd
          );
        }
      }

      if (includeDecade) {
        includedDecades.add(decadeKey);
      }
    }
  }

  const allSelectedDecades = new Set([
    ...selectedDecadeKeys,
    ...includedDecades,
  ]);

  allSelectedDecades.forEach((decadeKey) => {
    const decadeStat = statsData.decade_stats[decadeKey];
    if (decadeStat) {
      totalTokens += decadeStat.total_tokens || 0;
      filteredTokens += decadeStat.filtered_tokens || 0;
    }
  });

  const calculatedFileCount = statsData.file_count || 0;

  return {
    total_tokens: totalTokens,
    filtered_tokens: filteredTokens,
    file_count: calculatedFileCount,
  };
}
