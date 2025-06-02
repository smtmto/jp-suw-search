import { escapeHtml } from "../utils/text-utils.js";

export function getContextTokens(
  tokenId,
  allTokens,
  contextSeparatorText,
  actualContextSize,
  highlightInfo = { pre: new Set(), post: new Set() }
) {
  if (
    allTokens === null ||
    allTokens === undefined ||
    !Array.isArray(allTokens)
  ) {
    console.error(
      "[getContextTokens] `allTokens` is null, undefined, or not an array."
    );
    return {
      preContextTokens: [],
      postContextTokens: [],
      preContextText: "",
      postContextText: "",
      keyToken: null,
      separator: contextSeparatorText || "",
    };
  }

  if (
    typeof tokenId !== "number" ||
    tokenId < 0 ||
    tokenId >= allTokens.length
  ) {
    console.error(
      `[getContextTokens] Invalid tokenId: ${tokenId}. It must be a number within the bounds of allTokens.`
    );
    return {
      preContextTokens: [],
      postContextTokens: [],
      preContextText: "",
      postContextText: "",
      keyToken: null,
      separator: contextSeparatorText || "",
    };
  }

  const currentToken = allTokens[tokenId];
  if (!currentToken) {
    console.error(
      `[getContextTokens] Token not found for tokenId: ${tokenId}. currentToken is undefined or null.`
    );
    return {
      preContextTokens: [],
      postContextTokens: [],
      preContextText: "",
      postContextText: "",
      keyToken: null,
      separator: contextSeparatorText || "",
    };
  }

  const currentFileId = currentToken.ファイル名;

  const preContextTokens = [];
  const preContextTextParts = [];
  for (
    let i = tokenId - 1;
    i >= 0 && preContextTokens.length < actualContextSize;
    i--
  ) {
    const token = allTokens[i];
    if (!token || token.ファイル名 !== currentFileId) {
      break;
    }

    preContextTokens.unshift(token);
    const surface = escapeHtml(token.書字形出現形 || "");
    const isHighlighted =
      highlightInfo &&
      highlightInfo.pre instanceof Set &&
      highlightInfo.pre.has(i);
    const wordSpan = `<span class="context-word" data-token-id="${i}">${surface}</span>`;
    preContextTextParts.unshift(
      isHighlighted ? `<span class="highlight">(${wordSpan})</span>` : wordSpan
    );
  }

  const postContextTokens = [];
  const postContextTextParts = [];
  for (
    let i = tokenId + 1;
    i < allTokens.length && postContextTokens.length < actualContextSize;
    i++
  ) {
    const token = allTokens[i];
    if (!token || token.ファイル名 !== currentFileId) {
      break;
    }

    postContextTokens.push(token);
    const surface = escapeHtml(token.書字形出現形 || "");
    const isHighlighted =
      highlightInfo &&
      highlightInfo.post instanceof Set &&
      highlightInfo.post.has(i);
    const wordSpan = `<span class="context-word" data-token-id="${i}">${surface}</span>`;
    postContextTextParts.push(
      isHighlighted ? `<span class="highlight">(${wordSpan})</span>` : wordSpan
    );
  }

  const preContextText = preContextTextParts.join(contextSeparatorText);
  const postContextText = postContextTextParts.join(contextSeparatorText);

  return {
    preContextTokens,
    postContextTokens,
    preContextText,
    postContextText,
    keyToken: currentToken,
    separator: contextSeparatorText,
  };
}
