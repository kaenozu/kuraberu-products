import { entry as babybjorn } from './babybjorn';
import { entry as babybjorn_bouncer } from './babybjorn-bouncer';
import { entry as babybjorn_cradle } from './babybjorn-cradle';
import { entry as babybjorn_onekai } from './babybjorn-onekai';
import { entry as babybjorn_potty } from './babybjorn-potty';
import { entry as hitachi_bd_sx130k_vs_bd_stx130k } from './hitachi-bd-sx130k-vs-bd-stx130k';
import { entry as kingjim_tepra_sr_r2500p_vs_sr_mk1 } from './kingjim-tepra-sr-r2500p-vs-sr-mk1';
import { entry as merries_newborn } from './merries-newborn';
import { entry as merries_pants } from './merries-pants';
import { entry as moony_m } from './moony-m';
import { entry as pampers_newborn } from './pampers-newborn';
import { entry as panasonic_es_lt4b_vs_es_lv7j } from './panasonic-es-lt4b-vs-es-lv7j';
import { entry as panasonic_ne_fl1a_vs_ne_fl1c } from './panasonic-ne-fl1a-vs-ne-fl1c';
import { entry as panasonic_nt_t501_vs_nt_d700 } from './panasonic-nt-t501-vs-nt-d700';
import { entry as pigeon_bottle_160_240 } from './pigeon-bottle-160-240';
import { entry as pigeon_bottle_240 } from './pigeon-bottle-240';
import { entry as pigeon_slim_240 } from './pigeon-slim-240';
import { entry as shupot } from './shupot';
import { entry as tiger_mta_j050_guide } from './tiger-mta-j050-guide';
import { entry as yamajitsu_film_holder_242286_vs_242287 } from './yamajitsu-film-holder-242286-vs-242287';

/** レジストリ本体。キーは記事スラグ。 */
export const comparisonV2 = Object.freeze({
  "babybjorn": babybjorn,
  "babybjorn-bouncer": babybjorn_bouncer,
  "babybjorn-cradle": babybjorn_cradle,
  "babybjorn-onekai": babybjorn_onekai,
  "babybjorn-potty": babybjorn_potty,
  "hitachi-bd-sx130k-vs-bd-stx130k": hitachi_bd_sx130k_vs_bd_stx130k,
  "kingjim-tepra-sr-r2500p-vs-sr-mk1": kingjim_tepra_sr_r2500p_vs_sr_mk1,
  "merries-newborn": merries_newborn,
  "merries-pants": merries_pants,
  "moony-m": moony_m,
  "pampers-newborn": pampers_newborn,
  "panasonic-es-lt4b-vs-es-lv7j": panasonic_es_lt4b_vs_es_lv7j,
  "panasonic-ne-fl1a-vs-ne-fl1c": panasonic_ne_fl1a_vs_ne_fl1c,
  "panasonic-nt-t501-vs-nt-d700": panasonic_nt_t501_vs_nt_d700,
  "pigeon-bottle-160-240": pigeon_bottle_160_240,
  "pigeon-bottle-240": pigeon_bottle_240,
  "pigeon-slim-240": pigeon_slim_240,
  "shupot": shupot,
  "tiger-mta-j050-guide": tiger_mta_j050_guide,
  "yamajitsu-film-holder-242286-vs-242287": yamajitsu_film_holder_242286_vs_242287,
});

/** レジストリのキー型。articleId の typo はコンパイルエラーになる。 */
export type ComparisonV2ArticleId = keyof typeof comparisonV2;

/** 型安全にレジストリエントリを取り出すヘルパー。 */
export function getComparisonV2Entry(
  articleId: ComparisonV2ArticleId,
) {
  return comparisonV2[articleId];
}
