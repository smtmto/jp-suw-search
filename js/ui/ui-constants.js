export const columnOrderInternalKeys = [
  "ファイル名",
  "開始文字位置",
  "終了文字位置",
  "前文脈",
  "キー",
  "後文脈",
  "語彙素",
  "品詞",
  "活用型",
  "活用形",
  "書字形出現形",
  "発音形",
  "語種",
  "成立年",
  "形式",
  "作者",
  "性別",
  "作品名",
  "サブコーパス名",
  "話者数",
  "話者ID",
  "年齢",
  "職業",
  "permalink",
];

export const columnDisplayNames = {
  // use this definition for both demo and upload data
  upload: {
    ファイル名: "ファイル名",
    開始文字位置: "開始文字位置",
    終了文字位置: "終了文字位置",
    前文脈: "前文脈",
    キー: "キー",
    後文脈: "後文脈",
    語彙素: "語彙素",
    品詞: "品詞",
    活用型: "活用型",
    活用形: "活用形",
    書字形出現形: "書字形出現形",
    発音形: "発音形",
    語種: "語種",
    成立年: "成立年",
    形式: "形式",
    作者: "作者",
    性別: "性別",
    作品名: "作品名",
    サブコーパス名: "サブコーパス名",
    話者数: "話者数", // hidden
    話者ID: "話者ID", // hidden
    年齢: "年齢", // hidden
    職業: "職業", // hidden
    permalink: "permalink", // hidden
  },
};

export const columnNameToIdMap = {
  // Set the checkbox ID to match the HTML element's id
  ファイル名: "file-name",
  開始文字位置: "position",
  終了文字位置: "end-position",
  前文脈: "pre-context",
  キー: "key",
  後文脈: "post-context",
  語彙素: "lemma",
  品詞: "pos",
  活用型: "conj-type",
  活用形: "conj-form",
  書字形出現形: "surface",
  発音形: "pronunciation",
  語種: "word-type",
  成立年: "year",
  形式: "format",
  作者: "speaker",
  性別: "gender",
  作品名: "title",
  サブコーパス名: "sub-corpus-name",
  話者数: "speaker-count",
  話者ID: "speaker-id",
  年齢: "age",
  職業: "occupation",
  permalink: "permalink",
};

export const uploadHiddenInternalKeys = [
  "話者数",
  "話者ID",
  "年齢",
  "職業",
  "permalink",
];
