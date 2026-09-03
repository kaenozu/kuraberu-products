/**
 * 記事レジストリ（単一情報源）
 *
 * 個別記事ファイルから再エクスポートし、
 * 消費者コードはここだけを import する。
 *
 * 注: ファイルは分割済み。このファイルはテストの raw source 読み込みとの
 * 後方互換性のために残置されている。
 */
export {
  // Type re-exports
  type ArticleChangeLogEntry,
  type ArticleMetadata,
  type ArticleMetadataBase,
  type ComparisonSide,
  type ComparisonRow,
  type GuideArticleMetadata,
  type ComparisonArticleMetadata,
  defineArticleMetadata,
  // Individual article exports (alphabetical by slug)
  babybjornArticle,
  babybjornBouncerArticle,
  babybjornOnekaiArticle,
  combiTheSArticle,
  cradleArticle,
  kingjimTepraArticle,
  merriesNewbornArticle,
  merriesPantsArticle,
  moonyMArticle,
  pampersNewbornArticle,
  panasonicAirCleanerArticle,
  panasonicBabyMonitorArticle,
  panasonicEhNa9mGuideArticle,
  panasonicEhNa9mVsEhNa7mArticle,
  panasonicFyhvx120VsFyhvx90Article,
  panasonicHairDryerArticle,
  panasonicMcNx810kmVsMcNx700kArticle,
  panasonicNeFl1aVsNeFl1cArticle,
  panasonicNeMs4cVsNeBs5cArticle,
  panasonicShaverEsLt4bVsEsLv7jArticle,
  panasonicVacuumArticle,
  pigeonBottle240Article,
  pigeonBottleSizeArticle,
  pigeonSlim240Article,
  pottyArticle,
  sharpKcS50VsFuS50Article,
  shupotArticle,
  tefalGarmentSteamerArticle,
  tefalKettleArticle,
  thermosKfm020VsKfi020Article,
  thermosTigerBottleArticle,
  tigerKettlePcjVsPcmArticle,
  tigerMtaJ050GuideArticle,
  tigerPctA120VsPctA150Article,
  tigerRiceArticle,
  yamajitsuFilmHolderArticle,
  yamazakiCondorWagonArticle,
  yamazakiDishwasherRackArticle,
  yamazakiDustWagonArticle,
  yamazakiFreeBroomArticle,
  yamazakiLaundryWireBasketArticle,
  yamazakiOfudaStandArticle,
  yamazakiTowerDeskPanelArticle,
  zojirushiCoffeeArticle,
  zojirushiElectricKettleArticle,
  zojirushiEqSb22VsAh22Article,
  zojirushiToasterArticle,
  // Commercial article exports
  additionalCommercialArticles,
  additionalCommercialArticleSeeds,
  articleMetadata,
  publicArticleMetadata,
} from "./articles/index";
