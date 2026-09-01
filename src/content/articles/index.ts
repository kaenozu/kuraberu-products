/**
 * 記事レジストリ（単一情報源）
 *
 * 個別記事ファイルから再エクスポートし、
 * 消費者コードはここだけを import する。
 */
// Type re-exports
export type {
  ArticleChangeLogEntry,
  ArticleMetadata,
  ArticleMetadataBase,
  ComparisonSide,
  ComparisonRow,
  GuideArticleMetadata,
  ComparisonArticleMetadata,
} from "./types";
export { defineArticleMetadata } from "./types";

// Individual article exports
export { pampersNewbornArticle } from "./pampers-newborn";
export { merriesNewbornArticle } from "./merries-newborn";
export { pigeonBottle240Article } from "./pigeon-bottle-240";
export { pigeonSlim240Article } from "./pigeon-slim-240";
export { moonyMArticle } from "./moony-m";
export { merriesPantsArticle } from "./merries-pants";
export { shupotArticle } from "./shupot";
export { babybjornArticle } from "./babybjorn";
export { babybjornOnekaiArticle } from "./babybjorn-onekai";
export { babybjornBouncerArticle } from "./babybjorn-bouncer";
export { cradleArticle } from "./babybjorn-cradle";
export { pottyArticle } from "./babybjorn-potty";
export { pigeonBottleSizeArticle } from "./pigeon-bottle-160-240";
export { combiTheSArticle } from "./combi-the-s-plus-vs-premium";
export { tigerRiceArticle } from "./tiger-jpv-l100-vs-jpv-m100";
export { tigerPctA120VsPctA150Article } from "./tiger-pct-a120-vs-pct-a150";
export { zojirushiCoffeeArticle } from "./zojirushi-ec-kv50-vs-ec-ma60";
export { zojirushiEqSb22VsAh22Article } from "./zojirushi-eq-sb22-vs-eq-ah22";
export { zojirushiToasterArticle } from "./zojirushi-eq-aa22-vs-eq-sa22";
export { panasonicVacuumArticle } from "./panasonic-mc-sb55k-vs-mc-sb35k";
export { panasonicHairDryerArticle } from "./panasonic-eh-ne7m-vs-eh-ne5m";
export { tefalKettleArticle } from "./tefal-ko5901jp-vs-ko8601j0";
export { sharpKcS50VsFuS50Article } from "./sharp-kc-s50-vs-fu-s50";
export { panasonicNeFl1aVsNeFl1cArticle } from "./panasonic-ne-fl1a-vs-ne-fl1c";
export { panasonicAirCleanerArticle } from "./panasonic-f-px60c-vs-f-px70c";
export { panasonicShaverEsLt4bVsEsLv7jArticle } from "./panasonic-es-lt4b-vs-es-lv7j";
export { thermosTigerBottleArticle } from "./thermos-tiger-bottle";
export { yamazakiTowerDeskPanelArticle } from "./yamazaki-tower-desk-panel-vs-pen-stand";
export { yamazakiFreeBroomArticle } from "./yamazaki-free-broom-32-vs-45";
export { yamazakiCondorWagonArticle } from "./yamazaki-condor-wagon-vs-self-wagon";
export { yamazakiDustWagonArticle } from "./yamazaki-dust-wagon-45l-2division-vs-3division";
export { yamazakiLaundryWireBasketArticle } from "./yamazaki-laundry-wire-basket-m-vs-l";
export { yamazakiOfudaStandArticle } from "./yamazaki-ofuda-stand-rin-vs-single";
export { yamazakiDishwasherRackArticle } from "./yamazaki-dishwasher-rack-241925-vs-241926";
export { zojirushiElectricKettleArticle } from "./zojirushi-ck-pa08-vs-ck-dc08";
export { tefalGarmentSteamerArticle } from "./tefal-dv4030j0-vs-dv8070j0";
export { kingjimTepraArticle } from "./kingjim-tepra-sr-r2500p-vs-sr-mk1";
export { panasonicMcNx810kmVsMcNx700kArticle } from "./panasonic-mc-nx810km-vs-mc-nx700k";
export { panasonicFyhvx120VsFyhvx90Article } from "./panasonic-f-yhvx120-vs-f-yhvx90";
export { panasonicBabyMonitorArticle } from "./panasonic-baby-monitor-kx-hc705";
export { panasonicEhNa9mGuideArticle } from "./panasonic-eh-na9m-guide";
export { thermosKfm020VsKfi020Article } from "./thermos-kfm-020-vs-kfi-020";
export { tigerMtaJ050GuideArticle } from "./tiger-mta-j050-guide";
export { panasonicEhNa9mVsEhNa7mArticle } from "./panasonic-eh-na9m-vs-eh-na7m";
export { tigerKettlePcjVsPcmArticle } from "./tiger-pcj-a080-vs-pcm-a080";
export { yamajitsuFilmHolderArticle } from "./yamajitsu-film-holder-242286-vs-242287";

// Commercial article exports
export { commercialArticleSeeds, createCommercialArticle } from "./commercial";

// Re-import for computed values
import type { ArticleMetadata } from "./types";
import { pampersNewbornArticle } from "./pampers-newborn";
import { merriesNewbornArticle } from "./merries-newborn";
import { pigeonBottle240Article } from "./pigeon-bottle-240";
import { pigeonSlim240Article } from "./pigeon-slim-240";
import { moonyMArticle } from "./moony-m";
import { merriesPantsArticle } from "./merries-pants";
import { shupotArticle } from "./shupot";
import { babybjornArticle } from "./babybjorn";
import { babybjornOnekaiArticle } from "./babybjorn-onekai";
import { babybjornBouncerArticle } from "./babybjorn-bouncer";
import { cradleArticle } from "./babybjorn-cradle";
import { pottyArticle } from "./babybjorn-potty";
import { pigeonBottleSizeArticle } from "./pigeon-bottle-160-240";
import { combiTheSArticle } from "./combi-the-s-plus-vs-premium";
import { tigerRiceArticle } from "./tiger-jpv-l100-vs-jpv-m100";
import { tigerPctA120VsPctA150Article } from "./tiger-pct-a120-vs-pct-a150";
import { zojirushiCoffeeArticle } from "./zojirushi-ec-kv50-vs-ec-ma60";
import { zojirushiEqSb22VsAh22Article } from "./zojirushi-eq-sb22-vs-eq-ah22";
import { zojirushiToasterArticle } from "./zojirushi-eq-aa22-vs-eq-sa22";
import { panasonicVacuumArticle } from "./panasonic-mc-sb55k-vs-mc-sb35k";
import { panasonicHairDryerArticle } from "./panasonic-eh-ne7m-vs-eh-ne5m";
import { tefalKettleArticle } from "./tefal-ko5901jp-vs-ko8601j0";
import { sharpKcS50VsFuS50Article } from "./sharp-kc-s50-vs-fu-s50";
import { panasonicNeFl1aVsNeFl1cArticle } from "./panasonic-ne-fl1a-vs-ne-fl1c";
import { panasonicAirCleanerArticle } from "./panasonic-f-px60c-vs-f-px70c";
import { panasonicShaverEsLt4bVsEsLv7jArticle } from "./panasonic-es-lt4b-vs-es-lv7j";
import { thermosTigerBottleArticle } from "./thermos-tiger-bottle";
import { yamazakiTowerDeskPanelArticle } from "./yamazaki-tower-desk-panel-vs-pen-stand";
import { yamazakiFreeBroomArticle } from "./yamazaki-free-broom-32-vs-45";
import { yamazakiCondorWagonArticle } from "./yamazaki-condor-wagon-vs-self-wagon";
import { yamazakiDustWagonArticle } from "./yamazaki-dust-wagon-45l-2division-vs-3division";
import { yamazakiLaundryWireBasketArticle } from "./yamazaki-laundry-wire-basket-m-vs-l";
import { yamazakiOfudaStandArticle } from "./yamazaki-ofuda-stand-rin-vs-single";
import { yamazakiDishwasherRackArticle } from "./yamazaki-dishwasher-rack-241925-vs-241926";
import { zojirushiElectricKettleArticle } from "./zojirushi-ck-pa08-vs-ck-dc08";
import { tefalGarmentSteamerArticle } from "./tefal-dv4030j0-vs-dv8070j0";
import { kingjimTepraArticle } from "./kingjim-tepra-sr-r2500p-vs-sr-mk1";
import { panasonicMcNx810kmVsMcNx700kArticle } from "./panasonic-mc-nx810km-vs-mc-nx700k";
import { panasonicFyhvx120VsFyhvx90Article } from "./panasonic-f-yhvx120-vs-f-yhvx90";
import { panasonicBabyMonitorArticle } from "./panasonic-baby-monitor-kx-hc705";
import { panasonicEhNa9mGuideArticle } from "./panasonic-eh-na9m-guide";
import { thermosKfm020VsKfi020Article } from "./thermos-kfm-020-vs-kfi-020";
import { tigerMtaJ050GuideArticle } from "./tiger-mta-j050-guide";
import { panasonicEhNa9mVsEhNa7mArticle } from "./panasonic-eh-na9m-vs-eh-na7m";
import { tigerKettlePcjVsPcmArticle } from "./tiger-pcj-a080-vs-pcm-a080";
import { yamajitsuFilmHolderArticle } from "./yamajitsu-film-holder-242286-vs-242287";
import { commercialArticleSeeds, createCommercialArticle } from "./commercial";

/** 全記事の配列（商業記事を含む） */
const commercialIds = new Set(commercialArticleSeeds.map((seed) => seed.id));

export const additionalCommercialArticles: readonly ArticleMetadata[] =
  Object.freeze(
    commercialArticleSeeds.map((seed) => createCommercialArticle(seed)),
  );

export const additionalCommercialArticleSeeds = commercialArticleSeeds;

export const articleMetadata: readonly ArticleMetadata[] = Object.freeze([
  pampersNewbornArticle,
  merriesNewbornArticle,
  merriesPantsArticle,
  pigeonBottle240Article,
  pigeonSlim240Article,
  moonyMArticle,
  shupotArticle,
  babybjornArticle,
  babybjornOnekaiArticle,
  babybjornBouncerArticle,
  cradleArticle,
  pottyArticle,
  pigeonBottleSizeArticle,
  combiTheSArticle,
  tigerRiceArticle,
  tigerPctA120VsPctA150Article,
  zojirushiCoffeeArticle,
  panasonicVacuumArticle,
  panasonicHairDryerArticle,
  tefalKettleArticle,
  panasonicNeFl1aVsNeFl1cArticle,
  panasonicAirCleanerArticle,
  panasonicShaverEsLt4bVsEsLv7jArticle,
  sharpKcS50VsFuS50Article,
  thermosTigerBottleArticle,
  yamazakiTowerDeskPanelArticle,
  yamazakiCondorWagonArticle,
  yamazakiFreeBroomArticle,
  yamazakiDustWagonArticle,
  zojirushiElectricKettleArticle,
  zojirushiEqSb22VsAh22Article,
  zojirushiToasterArticle,
  tefalGarmentSteamerArticle,
  kingjimTepraArticle,
  panasonicMcNx810kmVsMcNx700kArticle,
  panasonicFyhvx120VsFyhvx90Article,
  panasonicBabyMonitorArticle,
  panasonicEhNa9mGuideArticle,
  thermosKfm020VsKfi020Article,
  tigerMtaJ050GuideArticle,
  panasonicEhNa9mVsEhNa7mArticle,
  tigerKettlePcjVsPcmArticle,
  yamajitsuFilmHolderArticle,
  yamazakiLaundryWireBasketArticle,
  yamazakiOfudaStandArticle,
  yamazakiDishwasherRackArticle,
  ...additionalCommercialArticles,
]);

const publicArticleMetadata = Object.freeze(
  articleMetadata.filter(
    (article) =>
      !commercialIds.has(article.id) || Boolean(article.productInfoCheckedAt),
  ),
);
export { publicArticleMetadata };
