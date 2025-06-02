let corpusDataInfo = null;
let indexData = null;
let fileMetadata = null;
let _statsData = null;

function getDecadeKeyWorker(year) {
  if (year === null || year === undefined || year === "") return "unknown";

  const yearStr = String(year).trim();
  let parsedYear = NaN;

  if (/^\d{4}$/.test(yearStr)) {
    parsedYear = parseInt(yearStr, 10);
  } else {
    const match = yearStr.match(/^(\d{4})/);
    if (match) parsedYear = parseInt(match[1], 10);
  }

  if (isNaN(parsedYear)) return "unknown";

  if (parsedYear < 1870) return "before1869s";
  if (1870 <= parsedYear && parsedYear < 1880) return "1870s";
  if (1880 <= parsedYear && parsedYear < 1890) return "1880s";
  if (1890 <= parsedYear && parsedYear < 1900) return "1890s";
  if (1900 <= parsedYear && parsedYear < 1910) return "1900s";
  if (1910 <= parsedYear && parsedYear < 1920) return "1910s";
  if (1920 <= parsedYear && parsedYear < 1930) return "1920s";
  if (1930 <= parsedYear && parsedYear < 1940) return "1930s";
  if (1940 <= parsedYear && parsedYear < 1950) return "1940s";
  if (1950 <= parsedYear && parsedYear < 1960) return "1950s";
  if (1960 <= parsedYear && parsedYear < 1970) return "1960s";
  if (1970 <= parsedYear && parsedYear < 1980) return "1970s";
  if (1980 <= parsedYear && parsedYear < 1990) return "1980s";
  if (1990 <= parsedYear && parsedYear < 2000) return "1990s";
  if (parsedYear >= 2000) return "after2000s";

  return "unknown";
}

function passesYearFilterWorker(metadata, yearFilterDecades, customYearRange) {
  const metaYear = metadata?.recording_year ?? null;

  if (metaYear === null || metaYear === "") {
    return yearFilterDecades.includes("unknown");
  }

  let parsedYear = NaN;
  const yearStr = String(metaYear).trim();
  if (/^\d{4}$/.test(yearStr)) {
    parsedYear = parseInt(yearStr, 10);
  } else {
    const match = yearStr.match(/^(\d{4})/);
    if (match) {
      parsedYear = parseInt(match[1], 10);
    }
  }

  if (isNaN(parsedYear)) {
    return yearFilterDecades.includes("unknown");
  }

  if (
    customYearRange &&
    parsedYear >= customYearRange.start &&
    parsedYear <= customYearRange.end
  ) {
    return true;
  }

  const tokenDecadeKey = getDecadeKeyWorker(parsedYear);
  return yearFilterDecades.includes(tokenDecadeKey);
}

function getTokenFileNameById(tokenId) {
  if (!corpusDataInfo || tokenId >= corpusDataInfo.tokenCount) return null;
  return corpusDataInfo?.tokenIdToFileMap?.[tokenId] ?? null;
}

function evaluateTokenAgainstConditionWorker(tokenId, condition) {
  const token = getTokenById(tokenId);
  if (!token) return false;

  const mainConditionOperand = {
    type: condition.type,
    value: condition.value,
  };
  let mainResult = matchesConditionWorker(token, mainConditionOperand);

  if (
    !condition.shortUnitConditions ||
    condition.shortUnitConditions.length === 0
  ) {
    return mainResult;
  }

  // 1. Process NOT operator
  const evaluationPipeline = [{ value: mainResult }];

  for (const suc of condition.shortUnitConditions) {
    const subCond = {
      type: suc.type,
      value: suc.value,
    };
    let subResult = matchesConditionWorker(token, subCond);

    if (suc.logic === "NOT") {
      evaluationPipeline.push({ operator: "AND" });
      evaluationPipeline.push({ value: !subResult });
    } else if (suc.logic === "AND") {
      evaluationPipeline.push({ operator: "AND" });
      evaluationPipeline.push({ value: subResult });
    } else if (suc.logic === "OR") {
      evaluationPipeline.push({ operator: "OR" });
      evaluationPipeline.push({ value: subResult });
    }
  }

  // 2. Process AND operator
  let currentTerms = [...evaluationPipeline];
  let i = 0;
  while (i < currentTerms.length) {
    if (
      i + 2 < currentTerms.length &&
      currentTerms[i].hasOwnProperty("value") &&
      currentTerms[i + 1].operator === "AND" &&
      currentTerms[i + 2].hasOwnProperty("value")
    ) {
      const leftOperand = currentTerms[i].value;
      const rightOperand = currentTerms[i + 2].value;
      const result = leftOperand && rightOperand;
      currentTerms.splice(i, 3, { value: result });
    } else {
      i++;
    }
  }

  // 3. Process OR operator
  let finalResult = currentTerms[0].value;
  i = 1;
  while (i < currentTerms.length) {
    if (
      currentTerms[i].operator === "OR" &&
      i + 1 < currentTerms.length &&
      currentTerms[i + 1].hasOwnProperty("value")
    ) {
      const rightOperand = currentTerms[i + 1].value;
      finalResult = finalResult || rightOperand;
      i += 2;
    } else {
      break;
    }
  }
  return finalResult;
}

function getTokenById(tokenId) {
  if (!corpusDataInfo || tokenId >= corpusDataInfo.tokenCount) return null;
  const surface = getTokenSurfaceById(tokenId);
  const fileName = getTokenFileNameById(tokenId);
  const pos = corpusDataInfo.tokenIdToPosMap?.[tokenId] ?? null;
  const lemma = corpusDataInfo.tokenIdToLemmaMap?.[tokenId] ?? null;
  const conjType = corpusDataInfo.tokenIdToConjTypeMap?.[tokenId] ?? null;
  const conjForm = corpusDataInfo.tokenIdToConjFormMap?.[tokenId] ?? null;

  return {
    書字形出現形: surface,
    ファイル名: fileName,
    品詞: pos,
    語彙素: lemma,
    活用型: conjType,
    活用形: conjForm,
  };
}

function getTokenSurfaceById(tokenId) {
  return corpusDataInfo?.tokenIdToSurfaceMap?.[tokenId] ?? null;
}

function matchesConditionWorker(token, condition) {
  if (!token || !condition) {
    return false;
  }

  if (!condition.value || condition.value.trim() === "") {
    return true;
  }

  try {
    switch (condition.type) {
      case "書字形出現形":
        return token.書字形出現形 === condition.value;
      case "語彙素":
        return token.語彙素 === condition.value;
      case "品詞":
        const tokenPos = token.品詞 || "";
        const conditionPos = condition.value;

        if (conditionPos.includes("%")) {
          const basePattern = conditionPos.replace(/%$/, "");
          return tokenPos.startsWith(basePattern);
        } else if (conditionPos.includes("*")) {
          const conditionParts = conditionPos.split("-");
          const tokenParts = tokenPos.split("-");

          for (let i = 0; i < conditionParts.length; i++) {
            if (
              conditionParts[i] !== "*" &&
              (i >= tokenParts.length || conditionParts[i] !== tokenParts[i])
            ) {
              return false;
            }
          }
          return true;
        } else {
          return tokenPos === conditionPos;
        }
      case "活用型":
        if (condition.value.includes("%")) {
          const basePattern = condition.value.replace(/%$/, "");
          return token.活用型 && token.活用型.startsWith(basePattern);
        } else if (condition.value.includes("-")) {
          return token.活用型 === condition.value;
        } else {
          return token.活用型 && token.活用型.startsWith(condition.value);
        }
      case "活用形":
        if (condition.value.includes("%")) {
          const basePattern = condition.value.replace(/%$/, "");
          return token.活用形 && token.活用形.startsWith(basePattern);
        } else if (condition.value.includes("-")) {
          return token.活用形 === condition.value;
        } else {
          return token.活用形 && token.活用形.startsWith(condition.value);
        }
      default:
        return false;
    }
  } catch (e) {
    console.error("条件マッチングエラー:", e, { token, condition });
    return false;
  }
}

function getCandidateTokenIds(keyCondition) {
  if (
    (!keyCondition.shortUnitConditions ||
      keyCondition.shortUnitConditions.length === 0) &&
    ["書字形出現形", "語彙素", "品詞"].includes(keyCondition.type)
  ) {
    const indexResults = getCandidateTokenIdsForSingleCondition(
      keyCondition.type,
      keyCondition.value
    );

    if (indexResults.length > 0) {
      return indexResults;
    }
  }

  const totalTokens = corpusDataInfo.tokenCount;
  const candidateIds = [];

  for (let tokenId = 0; tokenId < totalTokens; tokenId++) {
    if (evaluateTokenAgainstConditionWorker(tokenId, keyCondition)) {
      candidateIds.push(tokenId);
    }
  }

  return candidateIds;
}

function getCandidateTokenIdsForSingleCondition(type, value) {
  let ids = [];
  if (!indexData || typeof indexData !== "object") {
    console.error(
      "[Worker:getCandidateTokenIdsForSingleCondition] Worker internal indexData missing."
    );
    return [];
  }
  if (
    !type ||
    typeof type !== "string" ||
    value === undefined ||
    value === null
  ) {
    console.error(
      "[Worker:getCandidateTokenIdsForSingleCondition] Invalid args:",
      {
        type,
        value,
      }
    );
    return [];
  }

  let targetIndex = null;
  switch (type) {
    case "書字形出現形":
      targetIndex = indexData.surface_index;
      break;
    case "語彙素":
      targetIndex = indexData.lemma_index;
      break;
    case "品詞":
      targetIndex = indexData.pos_index;
      break;
    default:
      console.warn(`[Worker] Unsupported index type: ${type}`);
      return [];
  }
  if (!targetIndex || typeof targetIndex !== "object") {
    console.warn(`[Worker] Index data for "${type}" not found.`);
    return [];
  }

  const conditionValue = String(value);

  if (conditionValue.endsWith("%")) {
    const prefix = conditionValue.slice(0, -1);
    for (const key in targetIndex) {
      if (
        Object.prototype.hasOwnProperty.call(targetIndex, key) &&
        String(key).startsWith(prefix)
      ) {
        const potentialIds = targetIndex[key];
        if (Array.isArray(potentialIds)) {
          ids.push(...potentialIds);
        }
      }
    }
  } else {
    if (Object.prototype.hasOwnProperty.call(targetIndex, conditionValue)) {
      const matchingIds = targetIndex[conditionValue];
      if (Array.isArray(matchingIds)) {
        ids = matchingIds;
      }
    }
  }

  return ids;
}

function searchAndFilterInText(
  text,
  tokenIndices,
  regex,
  yearFilterDecades,
  customYearRange,
  finalTokenIds
) {
  let match;
  regex.lastIndex = 0;
  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    const matchedString = match[0];
    const matchEnd = matchIndex + matchedString.length;

    if (matchedString.length === 0) {
      if (regex.lastIndex === text.length) break;
      regex.lastIndex++;
      continue;
    }

    const overlappingTokenInfo = tokenIndices
      .filter((pos) => matchIndex < pos.end && matchEnd > pos.start)
      .map((pos) => ({ index: pos.originalIndex }));

    if (overlappingTokenInfo.length > 0) {
      const lastTokenIdx = Math.max(
        ...overlappingTokenInfo.map((info) => info.index)
      );
      const lastTokenFileName = getTokenFileNameById(lastTokenIdx);
      const metadata = lastTokenFileName ? fileMetadata[lastTokenFileName] : {};

      if (
        passesYearFilterWorker(metadata, yearFilterDecades, customYearRange)
      ) {
        finalTokenIds.push({
          tokenId: lastTokenIdx,
          matchStartIndex: match.index,
          matchedString: match[0],
        });
      }
    }
  }
}

function performUnitSearchWorker(
  keyCondition,
  yearFilterDecades,
  customYearRange
) {
  if (!corpusDataInfo || !indexData || !fileMetadata) {
    console.error("[Worker] Data not loaded for unit search.");
    throw new Error("Worker data not loaded");
  }
  if (!keyCondition || !keyCondition.value) {
    console.error("[Worker] Key condition value is missing.");
    throw new Error("Key condition value missing");
  }
  let candidateTokenIds = getCandidateTokenIds(keyCondition);
  const finalTokenIds = [];
  const totalCandidates = candidateTokenIds.length;

  for (let i = 0; i < totalCandidates; i++) {
    const tokenId = candidateTokenIds[i];
    if (tokenId === undefined || tokenId === null) continue;

    const tokenFileName = getTokenFileNameById(tokenId);
    if (!tokenFileName) {
      continue;
    }
    const metadata = fileMetadata[tokenFileName] || {};

    if (!passesYearFilterWorker(metadata, yearFilterDecades, customYearRange)) {
      continue;
    }

    finalTokenIds.push(tokenId);
  }
  return { tokenIds: finalTokenIds, totalHits: finalTokenIds.length };
}

function performStringSearchWorker(
  query,
  searchMode,
  yearFilterDecades,
  customYearRange
) {
  if (!corpusDataInfo || !fileMetadata)
    throw new Error("[Worker] Data not loaded for string search.");

  const finalTokenIds = [];
  const totalTokens = corpusDataInfo.tokenCount;
  let regex;
  try {
    if (searchMode === "regex") {
      regex = new RegExp(query, "g");
    } else {
      let regexString = "";
      let inCharClass = false;
      for (let i = 0; i < query.length; i++) {
        const char = query[i];
        if (inCharClass) {
          if (char === "]") {
            regexString += "]";
            inCharClass = false;
          } else if (char === "\\" && i + 1 < query.length) {
            regexString += "\\" + query[++i];
          } else {
            regexString += char;
          }
        } else {
          switch (char) {
            case "*":
            case "%":
              regexString += ".*?";
              break;
            case "?":
            case "_":
              regexString += ".";
              break;
            case "[":
              regexString += "[";
              inCharClass = true;
              if (i + 1 < query.length && query[i + 1] === "^") {
                regexString += "^";
                i++;
              }
              break;
            case ".":
            case "+":
            case "^":
            case "$":
            case "{":
            case "}":
            case "(":
            case ")":
            case "|":
            case "\\":
              regexString += "\\" + char;
              break;
            default:
              regexString += char;
              break;
          }
        }
      }
      if (inCharClass)
        throw new Error("Unterminated character class in wildcard query.");
      regex = new RegExp(regexString, "g");
    }
  } catch (e) {
    throw new Error(`[Worker] Invalid search pattern: ${e.message}`);
  }

  let currentFileId = null;
  let currentText = "";
  let currentTokenIndices = [];

  for (let i = 0; i < totalTokens; i++) {
    const tokenFileName = getTokenFileNameById(i);
    const tokenSurface = getTokenSurfaceById(i);

    if (tokenFileName === null || tokenSurface === null) continue;

    const isNewFile = tokenFileName !== currentFileId;

    if (isNewFile && i > 0) {
      if (currentText)
        searchAndFilterInText(
          currentText,
          currentTokenIndices,
          regex,
          yearFilterDecades,
          customYearRange,
          finalTokenIds
        );
      currentFileId = tokenFileName;
      currentText = "";
      currentTokenIndices = [];
    }
    if (currentFileId === null) currentFileId = tokenFileName;

    const start = currentText.length;
    currentText += tokenSurface;
    currentTokenIndices.push({
      originalIndex: i,
      start: start,
      end: currentText.length,
    });
  }
  if (currentText)
    searchAndFilterInText(
      currentText,
      currentTokenIndices,
      regex,
      yearFilterDecades,
      customYearRange,
      finalTokenIds
    );

  return { tokenIds: finalTokenIds, totalHits: finalTokenIds.length };
}

self.onmessage = function (event) {
  const type = event.data.type;
  const messageIdFromEvent = event.data.messageId;

  if (type === "loadData") {
    try {
      const payload = event.data.payload;

      if (!payload) {
        throw new Error("Payload missing in loadData message.");
      }

      const receivedCorpusDataInfo = payload.corpusDataInfo;
      const receivedIndexData = payload.indexData;
      const receivedFileMetadata = payload.fileMetadata;
      const receivedStatsData = payload.statsData;

      if (
        !receivedCorpusDataInfo ||
        receivedCorpusDataInfo.tokenCount === undefined ||
        !receivedIndexData
      ) {
        throw new Error(
          "Required data (corpusDataInfo or indexData) missing in payload."
        );
      }

      corpusDataInfo = receivedCorpusDataInfo;
      indexData = receivedIndexData;
      fileMetadata = receivedFileMetadata;
      statsData = receivedStatsData;

      self.postMessage({ type: "dataLoaded", messageId: messageIdFromEvent });
    } catch (e) {
      console.error("[Worker:onmessage] Error processing 'loadData':", e);
      self.postMessage({
        type: "error",
        message: e.message,
        messageId: messageIdFromEvent,
      });
    }
  } else if (type === "unitSearch") {
    let searchSuccess = false;
    let results = null;
    let errorMessage = "";
    try {
      if (!event.data.payload) {
        throw new Error("Payload is missing for unitSearch");
      }
      results = performUnitSearchWorker(
        event.data.payload.keyCondition,
        event.data.payload.yearFilterDecades,
        event.data.payload.customYearRange
      );
      searchSuccess = true;
    } catch (error) {
      console.error("[Worker] Error during unit search:", error);
      errorMessage = error.message || "Unknown unit search error";
      searchSuccess = false;
    } finally {
      if (searchSuccess && results) {
        self.postMessage({
          type: "unitSearchResult",
          success: true,
          results: results,
        });
      } else {
        self.postMessage({
          type: "unitSearchResult",
          success: false,
          error: errorMessage,
        });
      }
    }
  } else if (type === "stringSearch") {
    let searchSuccess = false;
    let results = null;
    let errorMessage = "";
    const startTime = event.data.startTime;
    try {
      if (!event.data.payload) {
        throw new Error("Payload is missing for stringSearch");
      }
      results = performStringSearchWorker(
        event.data.payload.query,
        event.data.payload.searchMode,
        event.data.payload.yearFilterDecades,
        event.data.payload.customYearRange
      );
      searchSuccess = true;
    } catch (error) {
      console.error("[Worker] Error during string search:", error);
      errorMessage = error.message || "Unknown string search error";
      searchSuccess = false;
    } finally {
      if (searchSuccess && results) {
        self.postMessage({
          type: "stringSearchResult",
          success: true,
          results: results,
          startTime: startTime,
        });
      } else {
        self.postMessage({
          type: "stringSearchResult",
          success: false,
          error: errorMessage,
          startTime: startTime,
        });
      }
    }
  } else {
    if (type !== "workerReady") {
      console.warn(
        "[Worker:onmessage] Received unknown message type or type without expected payload:",
        type,
        event.data
      );
    }
  }
};

self.postMessage({ type: "workerReady" });
