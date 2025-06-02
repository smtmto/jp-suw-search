import { extractWorkTitleFromFileName } from "../utils/text-utils.js";
import { getDecadeKey } from "../utils/date-utils.js";
import { fixedWorkMetadata } from "../data/metadata-definition.js";
import { columnOrderInternalKeys } from "../ui/ui-constants.js";

export function parseOpenCHJLine(
  line,
  globalLineIndex,
  uploadedFileNameWithoutExt
) {
  const fields = line.split("\t");
  const expectedFieldsArray = [9, 13];
  const initialToken = {};
  const keysForInit = columnOrderInternalKeys;

  keysForInit.forEach((key) => {
    initialToken[key] = null;
  });

  let rawOpenCHJFirstColumn = fields[0];

  const keyFromUploadedFile = uploadedFileNameWithoutExt;

  let finalWorkTitle = null;
  let finalAuthor = null;
  let finalGenre = null;
  let finalYear = null;
  let finalGender = null;
  let metaSourceFound = false;

  if (keyFromUploadedFile === "demo_data") {
    if (fixedWorkMetadata && fixedWorkMetadata["こころ"]) {
      const demoMeta = fixedWorkMetadata["こころ"];
      finalWorkTitle = "こころ";
      finalAuthor = demoMeta.author ?? null;
      finalGenre = demoMeta.genre ?? null;
      finalYear = demoMeta.year ?? null;
      finalGender = demoMeta.gender ?? null;
    } else {
      finalWorkTitle = "こころ";
    }
    metaSourceFound = true;
  }

  if (!metaSourceFound && fixedWorkMetadata) {
    let primaryMetaKeyCandidate = keyFromUploadedFile;
    const sokkiPrefixMatch = keyFromUploadedFile.match(/^\d{2}_\d{2}_(.+)/);
    const genjiPrefixMatch = keyFromUploadedFile.match(/^\d{2}\.\d{2}(.+)/);

    if (sokkiPrefixMatch && sokkiPrefixMatch[1]) {
      primaryMetaKeyCandidate = sokkiPrefixMatch[1];
    } else if (genjiPrefixMatch && genjiPrefixMatch[1]) {
      primaryMetaKeyCandidate = genjiPrefixMatch[1];
    }

    if (fixedWorkMetadata.hasOwnProperty(primaryMetaKeyCandidate)) {
      const meta = fixedWorkMetadata[primaryMetaKeyCandidate];
      finalAuthor = meta.author ?? null;
      finalGenre = meta.genre ?? null;
      finalYear = meta.year ?? null;
      finalGender = meta.gender ?? null;
      finalWorkTitle = extractWorkTitleFromFileName(primaryMetaKeyCandidate);
      metaSourceFound = true;
    }
    if (!metaSourceFound) {
      const baseTitleKey = extractWorkTitleFromFileName(
        primaryMetaKeyCandidate
      );
      if (baseTitleKey && fixedWorkMetadata.hasOwnProperty(baseTitleKey)) {
        const meta = fixedWorkMetadata[baseTitleKey];
        finalAuthor = meta.author ?? null;
        finalGenre = meta.genre ?? null;
        finalYear = meta.year ?? null;
        finalGender = meta.gender ?? null;
        finalWorkTitle = baseTitleKey;
        metaSourceFound = true;
      }
    }
  }

  if (!metaSourceFound) {
    let titleCandidate = extractWorkTitleFromFileName(keyFromUploadedFile);
    let authorCandidate = null;

    const spaceIndex = keyFromUploadedFile.indexOf(" ");

    if (
      spaceIndex !== -1 &&
      spaceIndex > 0 &&
      spaceIndex < keyFromUploadedFile.length - 1
    ) {
      authorCandidate = keyFromUploadedFile.substring(0, spaceIndex).trim();

      let titleAfterSpace = keyFromUploadedFile
        .substring(spaceIndex + 1)
        .trim();

      if (titleCandidate === keyFromUploadedFile) {
        titleCandidate = titleAfterSpace;
      }
    }

    finalAuthor = authorCandidate;
    finalWorkTitle = titleCandidate;

    if (!finalWorkTitle || finalWorkTitle.trim() === "") {
      if (keyFromUploadedFile && keyFromUploadedFile.trim() !== "") {
        finalWorkTitle = keyFromUploadedFile;
      } else {
        finalWorkTitle = null;
      }
    }
  }

  const tokenFileName =
    rawOpenCHJFirstColumn === undefined
      ? uploadedFileNameWithoutExt + ".txt"
      : fields[0] || uploadedFileNameWithoutExt + ".txt";

  if (!expectedFieldsArray.includes(fields.length)) {
    const errorToken = {
      ...initialToken,
      ファイル名: tokenFileName,
      書字形出現形: line.substring(0, 50) + (line.length > 50 ? "..." : ""),
      品詞: "エラー",
      終了文字位置: `error_line_${globalLineIndex + 1}`,
      作品名: finalWorkTitle,
      作者: finalAuthor,
      サブコーパス名: fields.length > 1 ? fields[1] || "" : "",
      isErrorToken: true,
      errorInfo: {
        line: globalLineIndex + 1,
        message: `フィールド数が不正です (${
          fields.length
        }個, 期待値: ${expectedFieldsArray.join("または")}個)`,
        content: line,
      },
    };
    return errorToken;
  }
  try {
    let startPos = parseInt(fields[2], 10);
    if (isNaN(startPos) || startPos < 0) startPos = 0;
    let endPos = parseInt(fields[3], 10);
    if (isNaN(endPos) || endPos < 0) endPos = startPos;

    const token = {
      ...initialToken,
      ファイル名: tokenFileName,
      開始文字位置: startPos,
      終了文字位置: String(endPos),
      文境界: fields[4] || "I",
      書字形出現形: fields[5] || "",
      語彙素: fields[6] || "",
      語彙素読み: fields[7] || "",
      品詞: fields[8] || "",
      活用型: fields.length === 13 ? fields[9] || "" : "",
      活用形: fields.length === 13 ? fields[10] || "" : "",
      発音形: fields.length === 13 ? fields[11] || "" : "",
      語種: fields.length === 13 ? fields[12] || "" : "",
      成立年: finalYear,
      形式: finalGenre,
      作者: finalAuthor,
      性別: finalGender,
      作品名: finalWorkTitle,
      サブコーパス名: fields[1] || "",
      isErrorToken: false,
    };
    return token;
  } catch (parseError) {
    console.error(
      `[DataHandler:parseOpenCHJLine] Fatal error parsing line ${
        globalLineIndex + 1
      } for uploaded file ${uploadedFileNameWithoutExt}.txt:`,
      parseError,
      "Line content:",
      line
    );
    const fatalErrorToken = {
      ...initialToken,
      ファイル名: tokenFileName,
      書字形出現形: `[パースエラー: ${parseError.message}]`,
      品詞: "エラー",
      終了文字位置: `fatal_error_line_${globalLineIndex + 1}`,
      作品名: finalWorkTitle,
      作者: finalAuthor,
      サブコーパス名: fields.length > 1 ? fields[1] || "" : "",
      isErrorToken: true,
      errorInfo: {
        line: globalLineIndex + 1,
        message: `致命的なパースエラー: ${parseError.message}`,
        content: line,
      },
    };
    return fatalErrorToken;
  }
}

export function generateIndexData(tokens) {
  const surface_index = {};
  const lemma_index = {};
  const pos_index = {};
  const utterance_index = {};

  if (!Array.isArray(tokens)) {
    console.error("Input 'tokens' is not an array!");
    return { surface_index, lemma_index, pos_index, utterance_index };
  }

  tokens.forEach((token, idx) => {
    if (!token || token.isErrorToken) {
      return;
    }
    const tokenId = idx;

    const surface = token["書字形出現形"];
    if (typeof surface === "string" && surface.trim() !== "") {
      const key = surface.trim();
      if (!surface_index[key]) surface_index[key] = [];
      surface_index[key].push(tokenId);
    }
    const lemma = token["語彙素"];
    if (typeof lemma === "string" && lemma.trim() !== "") {
      const key = lemma.trim();
      if (!lemma_index[key]) lemma_index[key] = [];
      lemma_index[key].push(tokenId);
    }
    const pos = token["品詞"];
    if (typeof pos === "string" && pos.trim() !== "") {
      const key = pos.trim();
      if (!pos_index[key]) pos_index[key] = [];
      pos_index[key].push(tokenId);
    }
    const utteranceId = token["終了文字位置"];
    if (typeof utteranceId === "string" && utteranceId.trim() !== "") {
      const key = utteranceId.trim();
      if (!utterance_index[key]) utterance_index[key] = [];
      utterance_index[key].push(tokenId);
    }
  });

  return { surface_index, lemma_index, pos_index, utterance_index };
}

export function generateStatsData(tokens) {
  let filtered_tokens = 0;
  let error_tokens_count = 0;
  const fileSet = new Set();

  const decadeCounts = {
    before1869s: { total: 0, filtered: 0, files: new Set() },
    "1870s": { total: 0, filtered: 0, files: new Set() },
    "1880s": { total: 0, filtered: 0, files: new Set() },
    "1890s": { total: 0, filtered: 0, files: new Set() },
    "1900s": { total: 0, filtered: 0, files: new Set() },
    "1910s": { total: 0, filtered: 0, files: new Set() },
    "1920s": { total: 0, filtered: 0, files: new Set() },
    "1930s": { total: 0, filtered: 0, files: new Set() },
    "1940s": { total: 0, filtered: 0, files: new Set() },
    "1950s": { total: 0, filtered: 0, files: new Set() },
    "1960s": { total: 0, filtered: 0, files: new Set() },
    "1970s": { total: 0, filtered: 0, files: new Set() },
    "1980s": { total: 0, filtered: 0, files: new Set() },
    "1990s": { total: 0, filtered: 0, files: new Set() },
    after2000s: { total: 0, filtered: 0, files: new Set() },
    unknown: { total: 0, filtered: 0, files: new Set() },
  };

  tokens.forEach((token) => {
    const fileName = token["ファイル名"];
    fileSet.add(fileName);
    const year = token["成立年"];
    const decade = getDecadeKey(year);

    if (decadeCounts[decade]) {
      decadeCounts[decade].files.add(fileName);
      decadeCounts[decade].total++;
    } else {
      console.warn(
        `[generateStatsData] Unknown decade key encountered: ${decade} for year ${year}`
      );
      decadeCounts["unknown"].files.add(fileName);
      decadeCounts["unknown"].total++;
    }

    if (token.isErrorToken) {
      error_tokens_count++;
    }

    const pos = token["品詞"] || "";
    if (
      !(pos.startsWith("記号") || pos.startsWith("補助記号") || pos === "空白")
    ) {
      filtered_tokens++;
      if (decadeCounts[decade]) {
        decadeCounts[decade].filtered++;
      } else {
        decadeCounts["unknown"].filtered++;
      }
    }
  });

  const stats = {
    total_tokens: tokens.length,
    filtered_tokens: filtered_tokens,
    error_tokens: error_tokens_count,
    file_count: fileSet.size,
    decade_stats: {},
  };

  for (const decadeKey in decadeCounts) {
    if (decadeCounts[decadeKey]) {
      stats.decade_stats[decadeKey] = {
        total_tokens: decadeCounts[decadeKey].total,
        filtered_tokens: decadeCounts[decadeKey].filtered,
        file_count: decadeCounts[decadeKey].files.size,
      };
    }
  }

  return stats;
}

export function generateFileMetadata(tokens) {
  const metadata = {};
  if (!tokens || tokens.length === 0) {
    console.warn("[DataHandler] No tokens provided to generateFileMetadata.");
    return metadata;
  }

  const fileDataMap = new Map();

  for (const token of tokens) {
    if (token.isErrorToken) continue;

    const openCHJFileName = token["ファイル名"];

    if (!fileDataMap.has(openCHJFileName)) {
      fileDataMap.set(openCHJFileName, {
        title: token["作品名"],
        recording_year: token["成立年"],
        speaker_name: token["作者"],
        speaker_gender: token["性別"],
        genre: token["形式"],
        speaker_count: null,
        speaker_id: null,
        speaker_birthyear: null,
        speaker_age: null,
        speaker_occupation: null,
        recording_time: null,
        related_document: null,
        url: null,
      });
    }
  }

  for (const [fileNameKey, metaValues] of fileDataMap) {
    metadata[fileNameKey] = metaValues;
  }

  return metadata;
}

export function cleanupMetadata(corpusDataToClean) {
  if (corpusDataToClean && corpusDataToClean.file_metadata) {
    for (const pid in corpusDataToClean.file_metadata) {
      if (Object.hasOwnProperty.call(corpusDataToClean.file_metadata, pid)) {
        const metadata = corpusDataToClean.file_metadata[pid];
        for (const key in metadata) {
          if (Object.hasOwnProperty.call(metadata, key)) {
            const value = metadata[key];
            if (
              (typeof value === "number" && isNaN(value)) ||
              value === "NaN" ||
              value === "nan"
            ) {
              metadata[key] = null;
            }
          }
        }
      }
    }
  }
}
