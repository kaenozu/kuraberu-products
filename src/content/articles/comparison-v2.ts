/**
 * comparison-v2.ts — 手書き比較記事の比較シェル（Article Layout v3）レジストリ。
 *
 * かつて各 src/pages/articles/<slug>/index.astro に直書きされていた
 * ArticleComparisonV2 の props（左右の商品・主な違い・FAQ）を articleId 引きの
 * レジストリへ一元化する。ページは {@link comparisonV2Articles} のエントリと
 * ArticleComparisonV2Section コンポーネントだけで比較シェルを構成し、公式URL・
 * 画像パスは本文（情報源一覧・PurchaseCard など）からも同じエントリを参照する。
 *
 * - purchaseHref / checkedAt / purchaseLinkStatus はセクション側で
 *   lib/products の articlePurchaseLinks と記事メタデータから自動解決されるため、
 *   ここには宣言しない（購入URLの単一情報源を維持する）。
 * - 検証は defineComparisonV2Article（defineArticleMetadata と同じ検証付き
 *   ヘルパーパターン）で行う。
 * - 本文が商品仕様（仕様ページURL・寸法など）を参照する記事は、片側オブジェクトに
 *   追加フィールドを持たせてよい（defineComparisonV2Article が構造的部分型で受け入れる）。
 *
 * 注意: `import ... from "../content/articles"` はファイル優先でモノリス
 * src/content/articles.ts に解決されるため、本モジュールは monolith 側からも
 * 再エクスポートしている。
 */
import { tigerMtaJ050 } from "../../lib/products";
import { defineComparisonV2Article, type ComparisonV2Article } from "./types";

/** 日立 ドラム式洗濯乾燥機ペアの本文共有仕様（specs 表と rows の共通データ）。 */
const hitachiSpecs = {
  left: {
    capacity: "洗濯・脱水13kg／洗濯～乾燥・乾燥7kg",
    panel: "プッシュボタン式操作パネル",
    weight: "約92kg",
  },
  right: {
    capacity: "洗濯・脱水13kg／洗濯～乾燥・乾燥7kg",
    panel: "ワイドカラー液晶タッチパネル",
    weight: "約93kg",
  },
};

/** パナソニック 単機能レンジペアの本文共有仕様（specs 表と rows の共通データ）。 */
const microwaveSpecs = {
  left: {
    capacity: "22L",
    weight: "9.5kg",
    cavity: "幅321mm×奥行365mm×高さ206mm",
    output: "最高出力1000W（最大1分30秒）",
    menus: "自動メニュー数2",
    care: "フッ素コート無し、白熱球庫内灯",
  },
  right: {
    capacity: "22L",
    weight: "8.9kg",
    cavity: "幅332mm×奥行365mm×高さ206mm",
    output: "最高出力1000W（最大1分30秒）",
    menus: "自動メニュー数3",
    care: "フッ素コート無し、庫内灯あり",
  },
};

export const comparisonV2Articles = {
  babybjorn: defineComparisonV2Article({
    left: {
      brand: "ベビービョルン",
      line: "HARMONY",
      tagline: "新生児から長く使えて多彩な抱き方をしたい人の候補",
      image: "/products/babybjorn-harmony.jpg",
      imageAlt: "ベビービョルン HARMONY",
      officialHref:
        "https://www.babybjorn.jp/products/baby-carriers/baby-carrier-harmony/grey-beige-3d-mesh/",
      guidePoints: ["新生児から長く使えて多彩な抱き方をしたい人の候補"],
      productId: "babybjorn-harmony",
    },
    right: {
      brand: "ベビービョルン",
      line: "MINI",
      tagline: "新生児期の手軽さと価格を優先したい人の候補",
      image: "/products/babybjorn-mini.jpg",
      imageAlt: "ベビービョルン MINI",
      officialHref:
        "https://www.babybjorn.jp/products/baby-carriers/baby-carrier-mini/",
      guidePoints: ["新生児期の手軽さと価格を優先したい人の候補"],
      productId: "babybjorn-mini",
    },
    rows: [
      {
        label: "対象月齢・対象体重",
        left: "0カ月〜約36ヶ月。体重3.2〜15kg、ヒップ約〜160cm。",
        right: "0カ月〜約12ヶ月。体重3.2〜11kg、ヒップ約〜120cm。",
      },
      {
        label: "抱っこの種類",
        left: "4通り：対面抱っこ（ハイポジション）・対面抱っこ（ローポジション）・前向き抱っこ・おんぶ。",
        right: "2通り。対面と前向きを中心としたシンプル設計。",
      },
      {
        label: "肩と腰のサポート",
        left: "幅広なパッド入りショルダーベルト＋エルゴノミックランバーサポート付き幅広ウエストベルト。腰に荷重を分散し肩の負担を軽減。",
        right: "パッド入りショルダーベルト。ウエストベルトなし。",
      },
      {
        label: "製品重量",
        left: "約892g。",
        right: "約500g。",
      },
      {
        label: "素材",
        left: "メッシュ・3Dジャージー。",
        right: "コットン・メッシュ。",
      },
      {
        label: "保証期間",
        left: "2年（正規保証1年＋ユーザー登録1年）。",
        right: "2年（正規保証1年＋ユーザー登録1年）。",
      },
      {
        label: "公式ショップ価格（2026-08-10確認）",
        left: "27,280円〜。",
        right: "9,680円〜。",
      },
    ],
    faqEntries: [
      {
        question: "HARMONYとMINI、どっちを選べばいい？",
        answer:
          "ベビービョルン公式の比較表によると、HARMONY は新生児から約36ヶ月まで使える4WAY（対面ハイ・ロー、前向き、おんぶ）のモデルで、幅広なパッド入りショルダーベルトとランバーサポート付きウェストベルトを備えています。MINI は新生児から約12ヶ月までが対象で、ショルダーベルトと本体が別々のシンプル設計でウェストベルトがありません。長く使える機能性を重視するなら HARMONY、新生児期の手軽さと価格を重視するなら MINI という違いがあります。実際の着け心地や赤ちゃんの好みは、公式情報だけでは判断できません。",
      },
      {
        question: "HARMONYは新生児から使える？",
        answer:
          "公式の比較表では、HARMONY の対象月齢は0カ月〜約36ヶ月、対象体重は3.2〜15kgと案内されています。ベビービョルン公式は「全ての抱っこひもが新生児から抱っこ可能」としています。",
      },
      {
        question: "MINIはどこまで使える？",
        answer:
          "公式の比較表では、MINI の対象月齢は0カ月〜約12ヶ月、対象体重は3.2〜11kg、対象ヒップサイズは約〜120cmと案内されています。新生児・乳児期中心のモデルです。",
      },
      {
        question: "HARMONYとMINIの価格はいくら？",
        answer:
          "ベビービョルン公式楽天市場店の表示価格（2026-08-10確認）は、HARMONY が27,280円〜、MINI が9,680円〜です。在庫やキャンペーンにより変動するため、購入時点の販売ページで確認してください。",
      },
      {
        question: "MINIにウェストベルトはある？",
        answer:
          "ありません。MINI はショルダーベルトと本体が別々のシンプル設計で、公式の比較表でもウェストベルトの項目は「ー」となっています。HARMONY はエルゴノミックランバーサポート付きの幅広ウェストベルトを備え、腰に荷重を分散して肩の負担を軽減すると案内されています。",
      },
      {
        question: "HARMONYとMINIの保証期間は？",
        answer:
          "ベビービョルン公式は保証期間について「2年（正規保証1年＋ユーザー登録1年）」と案内しています。",
      },
    ],
  }),

  "babybjorn-cradle": defineComparisonV2Article({
    left: {
      brand: "ベビービョルン",
      line: "クレードル",
      tagline: "新生児期の揺らして寝かしつけを重視する人の候補",
      image: "/products/babybjorn-cradle.jpg",
      imageAlt: "ベビービョルン クレードル",
      officialHref:
        "https://www.babybjorn.jp/products/baby-cradle-and-travel-crib/",
      guidePoints: ["新生児期の揺らして寝かしつけを重視する人の候補"],
      productId: "babybjorn-cradle",
    },
    right: {
      brand: "アップリカ",
      line: "ココネルエアー AB",
      tagline: "長く使えて折りたためるベビーベッドを探す人の候補",
      image: "/products/aprica-coconel-air.jpg",
      imageAlt: "アップリカ ココネルエアー AB",
      officialHref: "https://www.aprica.jp/products/home/bed/coconel_air/",
      guidePoints: ["長く使えて折りたためるベビーベッドを探す人の候補"],
      productId: "aprica-coconel-air",
    },
    rows: [
      {
        label: "使用できる期間",
        left: "新生児〜生後6か月（体重8kgまで）。使用期間は短めのゆりかご型。",
        right:
          "新生児（2.5kg）〜24カ月（13kgまで）。上段・下段の2段階で長く使える。",
      },
      {
        label: "揺れ（ゆりかご機能）",
        left: "両親が手や足で簡単に優しく揺らせることができる。「制御された、やさしい、はずみのある動き」を作り出す構造。",
        right: "公式案内に揺れ機能の記載なし（固定式）。",
      },
      {
        label: "サイズ",
        left: "本体 幅約79×奥行約58×高さ約65cm。マットレス 幅約71×奥行き約36×厚さ約3cm。",
        right:
          "開いた状態 幅約1052×奥行約704×高さ約951mm。閉じた状態 幅約260×奥行約260×高さ約951mm。",
      },
      {
        label: "重量・持ち運び",
        left: "約6kg。「軽量で女性でも簡単に移動させることができます」（公式案内）。",
        right:
          "約14.5kg（収納袋を除く）。キャスター付きで移動できるが、クレードルより大きく重い。",
      },
      {
        label: "折りたたみ・収納",
        left: "公式案内に折りたたみ・収納袋の記載なし（据え置き型）。",
        right:
          "カンタンに折りたたんで持ち運べる。収納袋付き。帰省・旅行にも使える。",
      },
      {
        label: "多用途（サークル兼用など）",
        left: "新生児期のベッド用途のみ。キャノピー（天蓋）は別売り。",
        right:
          "大きくなったらベビーサークルとしても使える。おむつ替えやお掃除のときの一時置きにも。",
      },
      {
        label: "安全基準・価格（2026-08-10確認）",
        left: "49,500円（送料無料）。",
        right:
          "PSCマーク・乳幼児用ベッドSG合格品。29,700円（他店26,000円台〜）。",
      },
    ],
    faqEntries: [
      {
        question: "ベビービョルン クレードルは新生児から使える？",
        answer:
          "ベビービョルン公式の案内によると、クレードルは「新生児から生後6か月（8kg）までご利用いただけます」。メッシュ素材とキャノピー（別売り）で透けて見えるデザインで、両親が手や足で簡単に優しく揺らせます。対象範囲は購入前に公式ページで確認してください。",
      },
      {
        question: "クレードルとココネルエアー、どっちを選べばいい？",
        answer:
          "各メーカー公式の案内によると、クレードルは新生児〜生後6か月（8kgまで）の手動ゆりかご型ベビーベッドで、揺らして寝かしつけられるのが特長です。ココネルエアー AB は新生児（2.5kg）〜24カ月（13kgまで）まで使える折りたたみ式で、大きくなったらベビーサークルとしても使えます。使用期間の長さと揺れ機能の有無が最大の違いです。実際の使い心地は、公式情報だけでは判断できません。",
      },
      {
        question: "クレードルのサイズと重量は？",
        answer:
          "ベビービョルン公式商品ページの案内によると、本体は幅約79×奥行約58×高さ約65cm、重量は約6kgです。公式は「軽量で女性でも簡単に移動させることができます」と案内しています。",
      },
      {
        question: "ココネルエアー AB は折りたためる？",
        answer:
          "アップリカ公式楽天市場店の案内によると、ココネルエアー AB は「カンタンに折りたたんで持ち運ぶことができる」構造で、閉じた状態は幅約260×奥行約260×高さ約951mm、収納袋付きです。帰省先や旅行先でも使えます。",
      },
      {
        question: "クレードルとココネルエアーの価格はいくら？",
        answer:
          "2026-08-10時点の確認では、ベビービョルン公式楽天市場店でクレードルが49,500円（送料無料）、アップリカ公式楽天市場店でココネルエアー AB が29,700円でした（他店では26,000円台〜の出品あり）。在庫やキャンペーンにより変動するため、購入時点の販売ページで確認してください。",
      },
      {
        question: "ココネルエアーは安全基準を取得している？",
        answer:
          "アップリカ公式楽天市場店の案内によると、ココネルエアー AB は PSCマーク取得品・製品安全協会乳幼児用ベッドSG合格品です。マットレス等を組み合わせて使用する場合は、周囲に隙間を生じないミニベッド用（サイズ60×90cm）のものを使用するよう案内されています。",
      },
    ],
  }),

  "babybjorn-bouncer": defineComparisonV2Article({
    left: {
      brand: "ベビービョルン",
      line: "Bliss",
      tagline: "最新モデルでデザインのバリエーションから選びたい人の候補",
      image: "/products/babybjorn-bouncer-bliss.jpg",
      imageAlt: "ベビービョルン Bliss",
      officialHref:
        "https://www.babybjorn.jp/products/baby-bouncers/bouncer-bliss/",
      guidePoints: ["最新モデルでデザインのバリエーションから選びたい人の候補"],
      productId: "babybjorn-bouncer-bliss",
    },
    right: {
      brand: "ベビービョルン",
      line: "バランスソフト",
      tagline: "2トーンの落ち着いたデザインを好む人の候補",
      image: "/products/babybjorn-bouncer-balance.jpg",
      imageAlt: "ベビービョルン バランスソフト",
      officialHref:
        "https://www.babybjorn.jp/products/baby-bouncers/bouncer-balance-soft/sky-blue-white-mesh-light-grey/",
      guidePoints: ["2トーンの落ち着いたデザインを好む人の候補"],
      productId: "babybjorn-bouncer-balance",
    },
    rows: [
      {
        label: "シートの素材とデザイン",
        left: "最新モデル。シートカバーをより柔らかく仕上げたモデル。3Dジャージー（放熱効果）・コットン・Air（メッシュ）・ウーブンの素材展開で20種類以上のバリエーション。",
        right:
          "2トーンの生地が特長。コットン・Air（メッシュ）・ウーブン/ジャージーの素材展開。直近カラーバリエーションが増加中。",
      },
      {
        label: "対象月齢・対象体重",
        left: "生後約1ヶ月〜2才くらい（最大体重13kg）。バウンサーとしての使用は体重9kgまで。",
        right:
          "生後約1ヶ月〜2才くらい（最大体重13kg）。バウンサーとしての使用は体重9kgまで。",
      },
      {
        label: "リクライニング",
        left: "3段階リクライニング。",
        right: "3段階リクライニング。「快適に長く使える」と案内。",
      },
      {
        label: "独自機能",
        left: "セルフバウンシング構造（赤ちゃん自身の動きでゆらゆら揺れる構造）。",
        right: "セルフバウンシング構造。",
      },
      {
        label: "製品サイズ・重量",
        left: "幅約39×奥行約89×高さ46〜58cm。約2.1kg。",
        right: "幅約39×奥行約89×高さ46〜58cm。約2.1kg。",
      },
      {
        label: "安全基準・保証",
        left: "SG認証。ASTM・ENに準拠。2年保証（公式楽天市場店の案内）。",
        right: "SG認証。ASTM・ENに準拠。2年保証（公式楽天市場店の案内）。",
      },
      {
        label: "公式ショップ価格（2026-08-10確認）",
        left: "カラー限定SALE 17,600円〜19,800円（カラー・素材により変動）。",
        right: "カラー限定SALE 17,600円〜19,800円（カラー・素材により変動）。",
      },
    ],
    faqEntries: [
      {
        question: "バウンサー Blissとバランスソフト、どっちを選べばいい？",
        answer:
          "ベビービョルン公式の案内によると、Bliss とバランスソフトはどちらも「セルフバウンシング構造」を備えたバウンサーで、対象は生後約1ヶ月〜2才（バウンサーとしての使用は体重9kgまで）です。主な違いはシートの素材とデザインです。Bliss は最新モデルでシートカバーをより柔らかく仕上げたモデルとされ、20種類以上のバリエーションがあります。バランスソフトは2トーンの生地が特長です。実際の肌触りの好みは、公式情報だけでは判断できません。",
      },
      {
        question: "バウンサー Blissは新生児から使える？",
        answer:
          "公式の商品ページでは、Bliss の対象は「生後約1ヶ月〜2才くらい（最大体重13kg）」と案内されています。また「バウンサーとしてのご使用は体重9kgまで」と記載されています。対象月齢・体重は購入前に公式ページで確認してください。",
      },
      {
        question: "バランスソフトはどこまで使える？",
        answer:
          "公式の商品ページでは、バランスソフトの対象は「生後約1ヶ月〜2才くらい（最大体重13kg）」、バウンサーとしての使用は体重9kgまでと案内されています。公式は「1ヶ月から2歳まで使えるロングユースタイプ」と案内しています。",
      },
      {
        question: "Blissとバランスソフトの価格はいくら？",
        answer:
          "ベビービョルン公式楽天市場店では、カラー限定SALEとして Bliss・バランスソフトとも 17,600円〜19,800円（カラー・素材により変動・2026-08-10確認）で販売されていました。在庫やキャンペーンにより変動するため、購入時点の販売ページで確認してください。",
      },
      {
        question: "Blissとバランスソフトの違いで一番大きいのは？",
        answer:
          "公式の案内では、機能面（セルフバウンシング構造・3段階リクライニング・対象月齢）に大きな違いはなく、違いは主にシートの素材とデザインです。Bliss は最新モデルでシートカバーをより柔らかく仕上げたモデル、バランスソフトは2トーンの生地が特長です。",
      },
      {
        question: "Blissとバランスソフトの保証は？",
        answer:
          "ベビービョルン公式楽天市場店の商品ページでは、両モデルとも2年保証（SG認証）と案内されています。",
      },
    ],
  }),

  "babybjorn-potty": defineComparisonV2Article({
    left: {
      brand: "ベビービョルン",
      line: "スマートポッティ",
      tagline: "コンパクトに収納できるおまるを探す人の候補",
      image: "/products/babybjorn-smart-potty.jpg",
      imageAlt: "ベビービョルン スマートポッティ",
      officialHref: "https://www.babybjorn.jp/products/bathroom/smart-potty/",
      guidePoints: ["コンパクトに収納できるおまるを探す人の候補"],
      productId: "babybjorn-smart-potty",
    },
    right: {
      brand: "ベビービョルン",
      line: "ポッティチェア",
      tagline: "長い時間座れるイス型おまるを探す人の候補",
      image: "/products/babybjorn-potty-chair.jpg",
      imageAlt: "ベビービョルン ポッティチェア",
      officialHref: "https://www.babybjorn.jp/products/bathroom/potty-chair/",
      guidePoints: ["長い時間座れるイス型おまるを探す人の候補"],
      productId: "babybjorn-potty-chair",
    },
    rows: [
      {
        label: "形状",
        left: "収納式のコンパクトなポッティ。公式の案内では「スペースの限られたバスルームに必要なデザインと機能をコンパクトにまとめた」と記載。",
        right:
          "イス型オマル。公式の案内では「お子さまが長い時間オマルに座る場合、イス型オマルが最適」と記載。柔らかいフォルムの人間工学デザイン。",
      },
      {
        label: "サイズ",
        left: "幅約25.5×奥行き約32×高さ約17.5cm。",
        right: "幅約32×奥行き約33×高さ約33cm。",
      },
      {
        label: "重量・素材",
        left: "約540g。素材はポリプロピレン。",
        right: "約870g。素材はポリプロピレン。",
      },
      {
        label: "中桶",
        left: "収納式の構造（中桶の有無は公式商品ページで確認）。",
        right: "中桶付き。中桶を取り外してそのまま流せる。",
      },
      {
        label: "公式ショップ価格（2026-08-10確認）",
        left: "3,080円。",
        right: "4,180円。",
      },
    ],
    faqEntries: [
      {
        question: "スマートポッティとポッティチェア、どっちを選べばいい？",
        answer:
          "ベビービョルン公式の案内によると、スマートポッティは「スペースの限られたバスルームに必要なデザインと機能をコンパクトにまとめた」収納式のポッティです。ポッティチェアは「お子さまが長い時間オマルに座る場合、イス型オマルが最適」と案内されています。使わない時にコンパクトに収納したい場合はスマートポッティ、長く座らせたい場合はポッティチェアが候補です。実際の使いやすさは、公式情報だけでは判断できません。",
      },
      {
        question: "スマートポッティのサイズと重さは？",
        answer:
          "ベビービョルン公式商品ページの案内によると、スマートポッティは幅約25.5×奥行き約32×高さ約17.5cm、製品重量は約540g、素材はポリプロピレンです。小さめサイズで足裏がしっかり床につく設計とされています。",
      },
      {
        question: "ポッティチェアは何歳から使える？",
        answer:
          "ベビービョルン公式の案内では、ポッティチェアはイス型オマルで、柔らかいフォルムの人間工学デザインとされています。対象年齢は公式の商品ページで確認してください。公式楽天市場店では、幅約32×奥行き約33×高さ約33cm・約870g・中桶付きと案内されています。",
      },
      {
        question: "スマートポッティとポッティチェアの価格はいくら？",
        answer:
          "2026-08-10時点の確認では、ベビービョルン公式楽天市場店でスマートポッティが3,080円、ポッティチェアが4,180円でした。在庫やキャンペーンにより変動するため、購入時点の販売ページで確認してください。",
      },
      {
        question: "トイレトレーニングシート（補助便座）との違いは？",
        answer:
          "ベビービョルン公式楽天市場店の案内によると、トイレトレーニングシートは2〜6才くらいまで使える便座直付けの補助便座（幅約29×奥行き約35×高さ約10cm・約400g・壁掛け用フック付き・ダイヤル調節機能）です。スマートポッティ・ポッティチェアは自立するおまるで、シートは大人用便座に取り付けて使うタイプと、使い方が異なります。",
      },
    ],
  }),

  "babybjorn-onekai": defineComparisonV2Article({
    left: {
      brand: "ベビービョルン",
      line: "ONE KAI",
      tagline: "新生児から長く使えて4WAYで多彩な抱き方をしたい人の候補",
      image: "/products/babybjorn-onekai.jpg",
      imageAlt: "ベビービョルン ONE KAI",
      officialHref:
        "https://www.babybjorn.jp/products/baby-carriers/baby-carrier-one-air/",
      guidePoints: ["新生児から長く使えて4WAYで多彩な抱き方をしたい人の候補"],
      productId: "babybjorn-onekai",
    },
    right: {
      brand: "ベビービョルン",
      line: "MOVE",
      tagline: "通気性を重視して長めに使いたい人の候補",
      image: "/products/babybjorn-move.jpg",
      imageAlt: "ベビービョルン MOVE",
      officialHref:
        "https://www.babybjorn.jp/products/baby-carriers/baby-carrier-move/navy-blue-3d-mesh/",
      guidePoints: ["通気性を重視して長めに使いたい人の候補"],
      productId: "babybjorn-move",
    },
    rows: [
      {
        label: "対象月齢・対象体重",
        left: "0カ月〜約36ヶ月。体重3.5〜15kg、ヒップ約〜160cm。",
        right: "0カ月〜約15ヶ月。体重3.2〜12kg、ヒップ約〜120cm。",
      },
      {
        label: "抱っこの種類",
        left: "4通り：対面抱っこ（ハイポジション）・対面抱っこ（ローポジション）・前向き抱っこ・おんぶ。",
        right: "2通り。",
      },
      {
        label: "ショルダーとウエストのサポート",
        left: "パッド入りショルダーベルト（スッキリ見え・肩にぴったりフィット）＋幅広ウエストベルト（おんぶ時にもスマート）。",
        right: "ショルダーパッド・ウェストベルトの項目は公式比較表で「ー」。",
      },
      {
        label: "素材",
        left: "メッシュ・コットン。",
        right: "メッシュ（フルメッシュ素材で通気性抜群）。",
      },
      {
        label: "製品重量",
        left: "約1000g。",
        right: "約860g。",
      },
      {
        label: "ヘッドサポート",
        left: "○",
        right: "○",
      },
      {
        label: "保証期間",
        left: "2年（正規保証1年＋ユーザー登録1年）。",
        right: "2年（正規保証1年＋ユーザー登録1年）。",
      },
      {
        label: "公式ショップ価格（2026-08-10確認）",
        left: "27,500円。",
        right: "22,000円。",
      },
    ],
    faqEntries: [
      {
        question: "ONE KAIとMOVE、どっちを選べばいい？",
        answer:
          "ベビービョルン公式の比較表によると、ONE KAI は新生児から約36ヶ月まで使える4WAY（対面ハイ・ロー、前向き、おんぶ）のモデルで、赤ちゃんの身体に沿った3D構造と幅広ウエストベルトを備えています。MOVE は新生児から約15ヶ月までが対象の2WAYモデルで、フルメッシュ素材で通気性を重視しています。長く使えて多彩な抱き方をしたいなら ONE KAI、通気性の良さと軽やかさを重視するなら MOVE という違いがあります。実際の着け心地や赤ちゃんの好みは、公式情報だけでは判断できません。",
      },
      {
        question: "ONE KAIは新生児から使える？",
        answer:
          "公式の比較表では、ONE KAI の対象月齢は0カ月〜約36ヶ月、対象体重は3.5〜15kgと案内されています。ベビービョルン公式は「全ての抱っこひもが新生児から抱っこ可能」としています。",
      },
      {
        question: "MOVEはどこまで使える？",
        answer:
          "公式の比較表では、MOVE の対象月齢は0カ月〜約15ヶ月、対象体重は3.2〜12kg、対象ヒップサイズは約〜120cmと案内されています。MINI（約12ヶ月）より長く使えるちょうどよいモデルと位置づけられています。",
      },
      {
        question: "ONE KAIとMOVEの価格はいくら？",
        answer:
          "ベビービョルン公式楽天市場店の表示価格（2026-08-10確認）は、ONE KAI が27,500円、MOVE が22,000円です。在庫やキャンペーンにより変動するため、購入時点の販売ページで確認してください。",
      },
      {
        question: "ONE KAIとMOVEの違いで一番大きいのは？",
        answer:
          "公式の比較表では、使える期間（約36ヶ月 vs 約15ヶ月）と抱っこの種類（4WAY vs 2WAY）が大きな違いです。ONE KAI は幅広ウエストベルト付き（おんぶ時にもスマート）で4通りの抱っこができます。MOVE はショルダーパッド・ウェストベルトの項目が「ー」のスッキリ設計で、フルメッシュ素材です。",
      },
      {
        question: "ONE KAIとMOVEの保証期間は？",
        answer:
          "ベビービョルン公式は保証期間について「2年（正規保証1年＋ユーザー登録1年）」と案内しています。",
      },
    ],
  }),
  "hitachi-bd-sx130k-vs-bd-stx130k": defineComparisonV2Article({
    left: {
      brand: "日立",
      line: "BD-SX130K",
      tagline: "ボタン操作を選ぶなら",
      image: "/products/hitachi-bd-sx130k.png",
      imageAlt: "日立 ビッグドラム BD-SX130K",
      officialHref: "https://kadenfan.hitachi.co.jp/wash/lineup/bd-sx130k/",
      guidePoints: [
        "プッシュボタン式操作パネルを確認したい",
        "温水機能を使わない構成を選びたい",
      ],
      specHref:
        "https://kadenfan.hitachi.co.jp/wash/lineup/bd-sx130k/spec.html",
      ...hitachiSpecs.left,
    },
    right: {
      brand: "日立",
      line: "BD-STX130K",
      tagline: "温水・タッチ操作なら",
      image: "/products/hitachi-bd-stx130k.png",
      imageAlt: "日立 ビッグドラム BD-STX130K",
      officialHref: "https://kadenfan.hitachi.co.jp/wash/lineup/bd-stx130k/",
      guidePoints: [
        "ワイドカラー液晶タッチパネルを使いたい",
        "温水やスチームアイロンコースを確認したい",
      ],
      specHref:
        "https://kadenfan.hitachi.co.jp/wash/lineup/bd-stx130k/spec.html",
      ...hitachiSpecs.right,
    },
    rows: [
      {
        label: "操作パネル",
        left: hitachiSpecs.left.panel,
        right: hitachiSpecs.right.panel,
        highlight: "right",
        highlightNote: "カラー液晶タッチパネル",
      },
      {
        label: "温水機能",
        left: "ー",
        right: "60℃・40℃・30℃など",
        highlight: "right",
        highlightNote: "温水コースあり",
      },
      {
        label: "シワ伸ばし",
        left: "ー",
        right: "スチームアイロンコース",
        highlight: "right",
        highlightNote: "コースあり",
      },
      {
        label: "本体質量",
        left: hitachiSpecs.left.weight,
        right: hitachiSpecs.right.weight,
      },
      {
        label: "洗濯・乾燥容量",
        left: hitachiSpecs.left.capacity,
        right: hitachiSpecs.right.capacity,
      },
    ],
    faqEntries: [
      {
        question: "日立 BD-SX130KとBD-STX130Kはどっちがいい？",
        answer:
          "どちらも洗濯・脱水容量13kg、洗濯～乾燥・乾燥容量7kgです。BD-SX130Kはプッシュボタン式、BD-STX130Kはワイドカラー液晶タッチパネルで、温水やスチームアイロンコースなどの搭載内容にも違いがあります。",
      },
      {
        question: "BD-SX130KとBD-STX130Kの容量は違う？",
        answer:
          "日立公式の仕様では、どちらも洗濯・脱水容量13kg、洗濯～乾燥・乾燥容量7kgです。",
      },
      {
        question: "BD-SX130KとBD-STX130Kの違いは？",
        answer:
          "BD-SX130Kはプッシュボタン式操作パネルで、BD-STX130Kはワイドカラー液晶タッチパネルです。BD-STX130Kには温水コースやスチームアイロンコースが案内されています。",
      },
    ],
  }),

  "kingjim-tepra-sr-r2500p-vs-sr-mk1": defineComparisonV2Article({
    left: {
      brand: "キングジム テプラ PRO",
      line: "SR-R2500P",
      tagline: "軽さとコンパクトさなら",
      image: "/products/kingjim-sr-r2500p.jpg",
      imageAlt: "キングジム テプラ PRO SR-R2500P",
      officialHref: "https://www.kingjim.co.jp/products/tepra/sr-r2500p.html",
      guidePoints: ["コンパクトさと軽さ、18mmまでのテープ幅で使いたい人向け"],
    },
    right: {
      brand: "キングジム テプラ PRO",
      line: "SR-MK1",
      tagline: "24mm幅とAC電源なら",
      image: "/products/kingjim-sr-mk1.jpg",
      imageAlt: "キングジム テプラ PRO SR-MK1",
      officialHref: "https://www.kingjim.co.jp/products/tepra/sr-mk1.html",
      guidePoints: ["24mmまでの幅広いテープとACアダプター対応を使いたい人向け"],
    },
    rows: [
      {
        label: "対応テープ幅",
        left: "4〜18mm",
        right: "4〜24mm",
        highlight: "right",
        highlightNote: "24mmまで",
      },
      {
        label: "質量（電池・テープ除く）",
        left: "約420g",
        right: "約470g",
        highlight: "left",
        highlightNote: "約50g軽い",
      },
      {
        label: "電源",
        left: "単3形電池×6本",
        right: "ACアダプター／単3形電池×6本",
        highlight: "right",
      },
      {
        label: "本体寸法",
        left: "約54×134×145mm",
        right: "約55×133×146mm",
        highlight: null,
      },
      {
        label: "カッター",
        left: "オートカッター",
        right: "オートカッター",
        highlight: null,
      },
    ],
    faqEntries: [
      {
        question: "SR-R2500PとSR-MK1の違いは？",
        answer:
          "公式仕様で確認できる主な違いは、対応テープ幅がSR-R2500Pは4〜18mm、SR-MK1は4〜24mmであること、質量がSR-R2500P約420g、SR-MK1約470gであることです。SR-MK1は別売ACアダプターにも対応します。",
      },
      {
        question: "軽いのはどちら？",
        answer:
          "電池とテープを除く質量は、SR-R2500Pが約420g、SR-MK1が約470gです。公式記載ではSR-R2500Pが約50g軽くなっています。",
      },
      {
        question: "どちらもスマホから印刷できる？",
        answer:
          "キングジム公式ページでは、両機種ともBluetooth接続に対応し、テプラPRO用アプリからラベルを作れると案内されています。",
      },
      {
        question: "楽天市場の価格は掲載していますか？",
        answer:
          "価格・在庫・送料・ポイントは販売先で変わるため、型番検索ページで購入時点の表示を確認してください。",
      },
    ],
  }),

  "merries-newborn": defineComparisonV2Article({
    diagnosisHref: "/tools/product-finder/diaper/",
    left: {
      brand: "メリーズ 新生児用",
      line: "ファーストプレミアム",
      tagline: "肌へのやさしさに関する機能を確認したい人の候補",
      image: "/products/merries-fp-newborn.jpg",
      imageAlt: "メリーズ 新生児用 ファーストプレミアム",
      officialHref: "https://www.kao.co.jp/merries/products/fp/",
      guidePoints: ["肌へのやさしさに関する機能を確認したい人の候補"],
      productId: "merries-fp-newborn",
    },
    right: {
      brand: "メリーズ 新生児用",
      line: "ずっと肌さらエアスルー",
      tagline: "ムレ・おしっこ対策の機能を確認したい人の候補",
      image: "/products/merries-airsle-newborn.jpg",
      imageAlt: "メリーズ 新生児用 ずっと肌さらエアスルー",
      officialHref: "https://www.kao.co.jp/merries/products/air/",
      guidePoints: ["ムレ・おしっこ対策の機能を確認したい人の候補"],
      productId: "merries-airsle-newborn",
    },
    rows: [
      {
        label: "公式が案内する主な機能",
        left: "カシミヤタッチの肌ざわり、吸収面を抗菌、アルガンオイル配合（肌に触れるシート）",
        right:
          "シート表面に目に見えない穴が50億個以上（通気）、おしっこロック、縦横の溝で瞬間吸収",
      },
      {
        label: "新生児サイズ",
        left: "3,000gまで・5,000gまでの2展開。S・Mサイズもあり",
        right: "お誕生（5,000gまで）。S・Mサイズもあり",
      },
    ],
    faqEntries: [
      {
        question: "メリーズの新生児用テープはどっちがいい？",
        answer:
          "肌ざわり・肌へのやさしさに関する機能（カシミヤタッチ・吸収部の抗菌・アルガンオイル）を重視するなら「ファーストプレミアム」、ムレ・おしっこ対策の機能（シートの穴50億個・おしっこロック）を重視するなら「ずっと肌さらエアスルー」が候補になります。新生児の小さめ（3,000g前後）ならファーストプレミアムに「3,000gまで」のサイズがあります。",
      },
      {
        question: "ファーストプレミアムとエアスルーは何が違う？",
        answer:
          "公式情報では、ファーストプレミアムは肌ざわり（カシミヤタッチ）と肌へのやさしさをうたう機能が中心、エアスルーはおむつ内のムレやおしっこに着目した機能（通気穴50億個・瞬間吸収・おしっこロック）が中心です。新生児サイズはファーストプレミアムが3,000g・5,000gの2択、エアスルーが5,000gまでの1択です。",
      },
      {
        question: "新生児用のサイズ選びの目安は？",
        answer:
          "花王公式ではファーストプレミアムが新生児用に「3,000gまで」と「5,000gまで」の2展開、エアスルーが「お誕生から5,000gまで」の1展開です。新生児の体重は個人差が大きいため、体重だけでなく足まわりや腰まわりのフィット感も販売ページやパッケージで確認してください。",
      },
      {
        question: "価格はどっちが安い？",
        answer:
          "この記事では価格を保証していません。楽天市場の販売ページで、1枚あたりの単価（内容枚数と価格）を比較して確認してください。販売ページで価格・在庫・送料・セット内容を確認してください。",
      },
    ],
  }),

  "merries-pants": defineComparisonV2Article({
    diagnosisHref: "/tools/product-finder/diaper/",
    left: {
      brand: "メリーズ パンツタイプ",
      line: "ファーストプレミアム",
      tagline: "肌へのやさしさに関する機能を確認したい人の候補",
      image: "/products/merries-fp-newborn.jpg",
      imageAlt: "メリーズ パンツタイプ ファーストプレミアム",
      officialHref: "https://www.kao.co.jp/merries/products/fp/",
      guidePoints: ["肌へのやさしさに関する機能を確認したい人の候補"],
      productId: "merries-fp-pants",
    },
    right: {
      brand: "メリーズ パンツタイプ",
      line: "ずっと肌さらエアスルー",
      tagline: "ムレ・おしっこ対策の機能を確認したい人の候補",
      image: "/products/merries-airsle-newborn.jpg",
      imageAlt: "メリーズ パンツタイプ ずっと肌さらエアスルー",
      officialHref: "https://www.kao.co.jp/merries/products/air/",
      guidePoints: ["ムレ・おしっこ対策の機能を確認したい人の候補"],
      productId: "merries-airsle-pants",
    },
    rows: [
      {
        label: "公式が案内する主な機能",
        left: "カシミヤタッチの肌ざわり、吸収面を抗菌、アルガンオイル配合（肌に触れるシート）、100%通気素材",
        right:
          "シート表面に目に見えない穴が50億個以上（通気）、おしっこロック、縦横の溝で瞬間吸収",
      },
      {
        label: "パンツタイプのサイズ展開",
        left: "S（4〜8kg）・M（6〜12kg）・L（9〜14kg）・ビッグ（12〜22kg）",
        right: "S（4〜8kg）・M（6〜12kg）・L（9〜14kg）・ビッグ（12〜22kg）",
      },
      {
        label: "機能のサイズ別注記",
        left: "背中モレ安心のフィットギャザーはS・Mサイズで案内（足まわりガイド付き）",
        right:
          "通気穴・瞬間吸収の説明は「テープタイプ全サイズ、パンツタイプS/Mサイズ」の注記",
      },
    ],
    faqEntries: [
      {
        question: "メリーズのパンツタイプはどっちがいい？",
        answer:
          "肌ざわり・肌へのやさしさに関する機能（カシミヤタッチ・吸収部の抗菌・アルガンオイル）を重視するなら「ファーストプレミアム」、おむつ内のムレ・おしっこ対策の機能（シートの穴・瞬間吸収・おしっこロック）を重視するなら「ずっと肌さらエアスルー」が候補になります。パンツタイプのサイズは両方ともS・M・L・ビッグの4展開です。",
      },
      {
        question: "ファーストプレミアムとエアスルーのパンツは何が違う？",
        answer:
          "公式情報では、ファーストプレミアムは肌ざわり（カシミヤタッチ）と肌へのやさしさをうたう機能が中心、エアスルーはおむつ内のムレやおしっこに着目した機能（通気穴・瞬間吸収・おしっこロック）が中心です。エアスルーの通気穴・瞬間吸収の説明はパンツタイプのS・Mサイズの注記が付いています。",
      },
      {
        question: "パンツタイプのサイズ展開の目安は？",
        answer:
          "花王公式では、ファーストプレミアム・エアスルーともにパンツタイプはSサイズ（4〜8kg）・Mサイズ（6〜12kg）・Lサイズ（9〜14kg）・ビッグサイズ（12〜22kg）の4展開です。体重だけでなく足まわりや腰まわりのフィット感もパッケージや販売ページで確認してください。",
      },
      {
        question: "価格はどっちが安い？",
        answer:
          "この記事では価格を保証していません。楽天市場の販売ページで、1枚あたりの単価（内容枚数と価格）を比較して確認してください。販売ページで価格・在庫・送料・セット内容を確認してください。",
      },
    ],
  }),

  "moony-m": defineComparisonV2Article({
    diagnosisHref: "/tools/product-finder/diaper/",
    left: {
      brand: "ムーニー",
      line: "低刺激であんしん",
      tagline: "うんち水分吸収シートの機能を確認したい人の候補",
      image: "/products/moony-teishigeki-m.jpg",
      imageAlt: "ムーニー 低刺激であんしん",
      officialHref: "https://jp.moony.com/ja/products/nmn1.html",
      guidePoints: ["うんち水分吸収シートの機能を確認したい人の候補"],
      productId: "moony-teishigeki-m",
    },
    right: {
      brand: "ムーニー",
      line: "マシュマロ肌ごこちモレ安心",
      tagline: "無添加弱酸性素材とゆるうんちストッパーを確認したい人の候補",
      image: "/products/moony-mashumaro-m.jpg",
      imageAlt: "ムーニー マシュマロ肌ごこちモレ安心",
      officialHref: "https://jp.moony.com/ja/products/mn.html",
      guidePoints: [
        "無添加弱酸性素材とゆるうんちストッパーを確認したい人の候補",
      ],
      productId: "moony-mashumaro-m",
    },
    rows: [
      {
        label: "うんちへの対策",
        left: "うんち水分吸収シートで、ゆるうんちの水分を下層へ吸収し、肌への付着を抑える設計。おしりガイドも搭載。",
        right: "背中と足回りにゆるうんちストッパーを搭載。",
      },
      {
        label: "無添加の内容",
        left: "Mを含む新生児〜Mは、香料・ラテックス・合成着色料の3成分無添加。",
        right:
          "全サイズで、石油由来油剤・香料・ラテックス・合成着色料の4成分無添加。",
      },
      {
        label: "Mサイズの内容量と主な機能",
        left: "Mは6〜11kg、46枚入り。うんち水分吸収シートとおしりガイドが特徴。",
        right:
          "Mは6〜11kg、54枚入り。無添加弱酸性素材、ゆるうんちストッパー、お知らせサイン、最大12時間吸収が案内されている。",
      },
    ],
    faqEntries: [
      {
        question:
          "「低刺激であんしん」Mにはオーガニックコットンが使われていますか？",
        answer:
          "いいえ。公式には、新生児〜Mについて「オーガニックコットンは含まれておりません」と明記されています。オーガニックコットン一部配合シートが案内されているのはLサイズです。",
      },
      {
        question: "無添加成分はどう違いますか？",
        answer:
          "「低刺激であんしん」の新生児〜Mは、香料・ラテックス・合成着色料の3成分無添加です。「マシュマロ肌ごこち モレ安心」は全サイズで、石油由来油剤・香料・ラテックス・合成着色料の4成分無添加です。",
      },
      {
        question: "Mサイズはどのくらいの体重が目安ですか？",
        answer:
          "どちらもMサイズは6〜11kg向けです。共通のサイズ展開として、新生児用は〜3000gと〜5000g、Sは4〜8kg、Mは6〜11kg、Lがあります。実際に選ぶ際は、使用するサイズの公式表示を確認してください。",
      },
      {
        question: "「最大12時間吸収」なら12時間交換しなくてもよいですか？",
        answer:
          "その意味ではありません。「マシュマロ肌ごこち モレ安心」で案内されている最大12時間吸収は、吸収量の目安です。12時間の連続使用を推奨する表示として扱わないようにします。",
      },
      {
        question: "「低刺激であんしん」はいつリニューアルされましたか？",
        answer:
          "2025年秋にリニューアルされています。現在の新生児〜Mは、うんち水分吸収シートを搭載し、3成分無添加で、オーガニックコットンを含まない仕様として公式に案内されています。",
      },
    ],
  }),

  "pampers-newborn": defineComparisonV2Article({
    diagnosisHref: "/tools/product-finder/diaper/",
    left: {
      brand: "パンパース 新生児用",
      line: "肌へのいちばん",
      tagline: "肌へのやさしさに関する機能を確認したい人の候補",
      image: "/products/pampers-premium-newborn.jpg",
      imageAlt: "パンパース 新生児用 肌へのいちばん",
      officialHref:
        "https://www.jp.pampers.com/products/pampers-premium-line-tape",
      guidePoints: ["肌へのやさしさに関する機能を確認したい人の候補"],
      productId: "pampers-premium-newborn",
    },
    right: {
      brand: "パンパース 新生児用",
      line: "さらさらケア",
      tagline: "モレ・ムレ対策の機能を確認したい人の候補",
      image: "/products/pampers-sarasara-newborn.jpg",
      imageAlt: "パンパース 新生児用 さらさらケア",
      officialHref: "https://www.jp.pampers.com/products/pampers-mainline-tape",
      guidePoints: ["モレ・ムレ対策の機能を確認したい人の候補"],
      productId: "pampers-sarasara-newborn",
    },
    rows: [
      {
        label: "公式が案内する主な機能",
        left: "ゆるうんちを素早く吸収、ワセリン配合シート、ふかふか肌ざわり",
        right: "ゆるうんちモレガード、のびのびフィットテープ、進化した吸収体",
      },
      {
        label: "新生児サイズ",
        left: "5kgまで。小さめ新生児3,000gも掲載",
        right: "5kgまで",
      },
    ],
    faqEntries: [
      {
        question: "パンパースの新生児用テープはどっちがいい？",
        answer:
          "肌へのやさしさに関する機能（ゆるうんちを肌に残りにくくする設計・ワセリン配合シート・ふかふか肌ざわり）を確認するなら「肌へのいちばん」、モレ・ムレ対策の機能（360°ゆるうんちモレガード・のびのびフィットテープ・進化した吸収体）を確認するなら「さらさらケア」が候補です。どちらも新生児5kgまでのテープサイズが公式に案内されています。",
      },
      {
        question: "「肌へのいちばん」と「さらさらケア」は何が違う？",
        answer:
          "公式ページでは、肌へのいちばんは肌ざわりと肌へのやさしさ（ワセリン配合・ふかふか素材）、さらさらケアはおしっこ・ゆるうんちへの吸収とモレ対策（モレガード・吸収体）を中心に案内されています。新生児サイズはどちらも5kgまでで、小さめ新生児（3,000g）の表示もあるのは肌へのいちばんです。",
      },
      {
        question: "新生児用のサイズ選びの目安は？",
        answer:
          "公式では両方とも新生児サイズは5kgまでと案内されています。肌へのいちばんには小さめ新生児（3,000g）向けの表示もあります。実際の合いやすさは赤ちゃんの体型や肌状態でも変わるため、機能表示とサイズを確認して少量から試してください。",
      },
      {
        question: "価格や在庫はどこで確認できますか？",
        answer:
          "このサイトでは価格・在庫を保証していません。楽天市場などの販売ページで、その時点の価格・在庫・送料・セット内容を確認してください。",
      },
    ],
  }),
  "panasonic-es-lt4b-vs-es-lv7j": defineComparisonV2Article({
    left: {
      brand: "パナソニック",
      line: "ES-LT4B",
      tagline: "軽さと3枚刃なら",
      image: "/products/panasonic-es-lt4b.jpg",
      imageAlt: "パナソニック ラムダッシュ ES-LT4B",
      officialHref: "https://panasonic.jp/shaver/products/ES-LT4B.html",
      guidePoints: ["軽さと3枚刃、本体のコンパクトさを確認したい人向け"],
      specHref: "https://panasonic.jp/shaver/products/ES-LT4B/spec.html",
    },
    right: {
      brand: "パナソニック",
      line: "ES-LV7J",
      tagline: "5枚刃と洗浄充電器なら",
      image: "/products/panasonic-es-lv7j.jpg",
      imageAlt: "パナソニック ラムダッシュPRO ES-LV7J",
      officialHref: "https://panasonic.jp/shaver/products/ES-LV7J.html",
      guidePoints: ["5枚刃と全自動洗浄充電器を確認したい人向け"],
      specHref: "https://panasonic.jp/shaver/products/ES-LV7J/spec.html",
    },
    rows: [
      { label: "刃数", left: "3枚刃", right: "5枚刃", highlight: "right" },
      {
        label: "本体質量（キャップ除く）",
        left: "約155g",
        right: "約210g",
        highlight: "left",
        highlightNote: "約55g軽い",
      },
      {
        label: "本体寸法（高さ×幅×奥行）",
        left: "15.5×6.4×5.0cm",
        right: "16.7×7.2×5.9cm",
      },
      {
        label: "充電・付属品",
        left: "ACアダプター充電",
        right: "全自動洗浄充電器・ACアダプター充電",
        highlight: "right",
      },
    ],
    faqEntries: [
      {
        question: "ES-LT4BとES-LV7Jの大きな違いは？",
        answer:
          "公式ページでは、刃数・本体寸法・質量・充電方式が異なります。ES-LV7Jは5枚刃で全自動洗浄充電器が付属し、ES-LT4Bは3枚刃で約155gです。",
      },
      {
        question: "軽いのはどちら？",
        answer:
          "公式仕様では、ES-LT4Bが約155g、ES-LV7Jが約210gです。どちらもキャップを除く質量です。",
      },
      {
        question: "使用日数と防水仕様は同じ？",
        answer:
          "公式仕様では、どちらもフル充電から1日1回約3分間の使用で約14日間、防水はIPX7基準です。",
      },
      {
        question: "楽天市場の価格は比較できる？",
        answer:
          "価格・在庫・ポイント・送料は変動するため、型番検索ページで購入時点の表示を確認してください。",
      },
    ],
  }),

  "panasonic-ne-fl1a-vs-ne-fl1c": defineComparisonV2Article({
    commonNote:
      "どちらも同じ：総庫内容量22L・フラット庫内・最高出力1000W（最大1分30秒）・外形寸法 幅488mm×奥行380mm×高さ298mm。",
    left: {
      brand: "パナソニック",
      line: "NE-FL1A",
      tagline: "NE-FL1Aの仕様なら",
      image: "/products/panasonic-ne-fl1a.jpg",
      imageAlt: "パナソニック NE-FL1A",
      officialHref: "https://panasonic.jp/range/products/NE-FL1A.html",
      guidePoints: [
        "NE-FL1Aの公式仕様を確認して選びたい",
        "自動メニュー数2で足りる",
        "庫内幅321mmを確認して置きたい",
      ],
      specHref: "https://panasonic.jp/range/products/NE-FL1A/spec.html",
      ...microwaveSpecs.left,
    },
    right: {
      brand: "パナソニック",
      line: "NE-FL1C",
      tagline: "軽さ・庫内幅なら",
      image: "/products/panasonic-ne-fl1c.png",
      imageAlt: "パナソニック NE-FL1C",
      officialHref: "https://panasonic.jp/range/products/NE-FL1C.html",
      guidePoints: [
        "本体を少しでも軽くしたい（8.9kg）",
        "庫内幅332mmを確認して選びたい",
        "自動メニュー数3を使いたい",
      ],
      specHref: "https://panasonic.jp/range/products/NE-FL1C/spec.html",
      ...microwaveSpecs.right,
    },
    rows: [
      {
        label: "本体質量",
        left: microwaveSpecs.left.weight,
        right: microwaveSpecs.right.weight,
        highlight: "right",
        highlightNote: "0.6kg軽い",
        bar: { left: 9.5, right: 8.9 },
      },
      {
        label: "庫内幅",
        left: "321mm",
        right: "332mm",
        highlight: "right",
        highlightNote: "11mm広い",
        bar: { left: 321, right: 332 },
      },
      {
        label: "自動メニュー数",
        left: microwaveSpecs.left.menus,
        right: microwaveSpecs.right.menus,
        highlight: "right",
        highlightNote: "1つ多い",
        bar: { left: 2, right: 3 },
      },
      {
        label: "総庫内容量",
        left: microwaveSpecs.left.capacity,
        right: microwaveSpecs.right.capacity,
      },
    ],
    faqEntries: [
      {
        question: "パナソニック NE-FL1AとNE-FL1Cはどっちがいい？",
        answer:
          "どちらも22L・フラット庫内・最高出力1000Wの単機能レンジです。公式仕様ではNE-FL1Cの方が本体質量が8.9kgで軽く、自動メニュー数は3です。NE-FL1Aは9.5kgで、自動メニュー数は2です。",
      },
      {
        question: "NE-FL1AとNE-FL1Cで容量は違う？",
        answer:
          "公式仕様では、NE-FL1A・NE-FL1Cとも総庫内容量は22Lです。外形寸法も幅488mm×奥行380mm×高さ298mmで共通ですが、庫内寸法はNE-FL1Cの方が幅332mm、NE-FL1Aは幅321mmです。",
      },
      {
        question: "軽いのはNE-FL1AとNE-FL1Cのどっち？",
        answer:
          "公式仕様では、NE-FL1Cが8.9kg、NE-FL1Aが9.5kgです。NE-FL1Cの方が0.6kg軽い仕様です。",
      },
      {
        question: "NE-FL1AとNE-FL1Cの自動メニュー数は？",
        answer:
          "公式仕様では、NE-FL1Aは自動メニュー数2、NE-FL1Cは自動メニュー数3です。",
      },
    ],
  }),

  "panasonic-nt-t501-vs-nt-d700": defineComparisonV2Article({
    left: {
      brand: "パナソニック",
      line: "NT-T501",
      tagline: "4枚焼きなら",
      image: "/products/panasonic-nt-t501.jpg",
      imageAlt: "パナソニック オーブントースター NT-T501",
      officialHref: "https://panasonic.jp/toaster/products/NT-T501.html",
      guidePoints: ["4枚焼きと火力5段階を確認して選びたい人向け"],
    },
    right: {
      brand: "パナソニック",
      line: "NT-D700",
      tagline: "温度調節なら",
      image: "/products/panasonic-nt-d700.jpg",
      imageAlt: "パナソニック オーブントースター ビストロ NT-D700",
      officialHref: "https://panasonic.jp/toaster/products/NT-D700.html",
      guidePoints: [
        "自動メニュー・温度調節・インテリジェント制御を確認したい人向け",
      ],
    },
    rows: [
      {
        label: "トースト枚数",
        left: "4枚",
        right: "2枚",
        highlight: "left",
        highlightNote: "2枚多い",
      },
      { label: "消費電力", left: "1200W", right: "1300W" },
      {
        label: "本体寸法",
        left: "幅34.5×奥行32.9×高さ21.9cm",
        right: "幅34.1×奥行32.8×高さ26.9cm",
      },
      {
        label: "火力・温度調節",
        left: "火力5段階",
        right: "120～260℃・8段階",
        highlight: "right",
        highlightNote: "温度調節あり",
      },
      { label: "本体質量", left: "3.5kg", right: "約4.3kg" },
    ],
    faqEntries: [
      {
        question: "パナソニック NT-T501とNT-D700の違いは？",
        answer:
          "公式仕様では、NT-T501はトースト4枚・1200W・火力5段階、NT-D700はトースト2枚・1300W・120～260℃の温度調節と自動メニューを案内しています。",
      },
      {
        question: "トーストを多く焼けるのはどっち？",
        answer:
          "公式仕様では、NT-T501はトースト4枚、NT-D700はトースト2枚です。",
      },
      {
        question: "NT-D700の温度調節範囲は？",
        answer: "パナソニック公式仕様では、NT-D700の温度調節は120～260℃です。",
      },
      {
        question: "価格で比較できますか？",
        answer:
          "価格・在庫は販売先で変わるため、この記事では公式ページで確認できる仕様を比較しています。購入時点の販売ページをご確認ください。",
      },
    ],
  }),

  "pigeon-bottle-240": defineComparisonV2Article({
    diagnosisHref: "/tools/product-finder/baby-bottle/",
    left: {
      brand: "母乳実感",
      line: "耐熱ガラス製（240ml）",
      tagline: "自宅中心で、汚れの落ちやすさを重視する人",
      image: "/products/pigeon-bottle-glass240.jpg",
      imageAlt: "母乳実感 耐熱ガラス製（240ml）",
      officialHref: "https://products.pigeon.co.jp/item/index-2382.html",
      guidePoints: ["自宅中心で、汚れの落ちやすさを重視する人"],
      productId: "pigeon-glass-240",
    },
    right: {
      brand: "母乳実感",
      line: "プラスチック製（PPSU）（240ml）",
      tagline: "外出時にも使い、軽さ・割れにくさを重視する人",
      image: "/products/pigeon-bottle-ppsu240.jpg",
      imageAlt: "母乳実感 プラスチック製（PPSU）（240ml）",
      officialHref: "https://products.pigeon.co.jp/item/index-2378.html",
      guidePoints: ["外出時にも使い、軽さ・割れにくさを重視する人"],
      productId: "pigeon-ppsu-240",
    },
    rows: [
      {
        label: "びんの素材",
        left: "ほうけい酸ガラス",
        right: "ポリフェニルサルホン（PPSU）",
      },
      {
        label: "公式Q&Aで案内される長所",
        left: "汚れが落ちやすいので清潔",
        right: "軽い、落としても割れにくい",
      },
      {
        label: "公式Q&Aで案内される注意点",
        left: "重い／欠け・割れることがある",
        right: "ガラスに比べてキズがつきやすく、色やにおいなどが吸着しやすい",
      },
    ],
    faqEntries: [
      {
        question: "母乳実感の240mlはどっちがいい？",
        answer:
          "自宅中心で「汚れが落ちやすい」ことを重視するなら耐熱ガラス製、持ち運びや「軽さ・割れにくさ」を重視するならプラスチック製（PPSU）が候補です。240ml同士なら、容量・付属乳首（Mサイズ）・消毒方法は共通です。",
      },
      {
        question: "ガラス製とプラスチック製で容量は違いますか？",
        answer: "いいえ。今回比較する2商品はどちらも240mlです。",
      },
      {
        question: "付属する乳首に違いはありますか？",
        answer:
          "ありません。どちらも母乳実感のMサイズ（3ヵ月頃から）・吸い穴Y字形の乳首が付属します。",
      },
      {
        question: "新生児から240mlを使えますか？",
        answer:
          "今回の240ml商品ページはどちらも「3ヵ月頃から」と表示され、付属乳首もMサイズ（3ヵ月頃から）です。新生児期に使う場合は、乳首サイズの選び方などピジョン公式の案内を確認してください。",
      },
      {
        question: "消毒・除菌の方法は違いますか？",
        answer:
          "今回の2種類では違いません。煮沸・スチーム・薬液に対応し、電子レンジ除菌は不可です。",
      },
      {
        question: "電子レンジで除菌できますか？",
        answer:
          "現在のピジョン公式商品ページでは不可です。ピジョンは安全のため、すべての商品について順次「電子レンジ除菌」を不可とし、煮沸・薬液・スチームでの消毒・除菌を案内しています。",
      },
      {
        question: "プラスチック製の素材は何ですか？",
        answer:
          "今回の「母乳実感 哺乳びん（プラスチック製）240ml」はPPSU（ポリフェニルサルホン）です。",
      },
      {
        question: "ガラス製は割れませんか？",
        answer:
          "割れる可能性があります。ピジョンも「落としたり、ぶつけたりするなど使用状況によって割れることがある」と案内しています。割れた場合、やけど・けがにつながるため注意が必要です。",
      },
    ],
  }),
  "pigeon-slim-240": defineComparisonV2Article({
    diagnosisHref: "/tools/product-finder/baby-bottle/",
    left: {
      brand: "ピジョン",
      line: "母乳実感 240ml",
      tagline: "広口タイプで調乳しやすさを重視する人",
      image: "/products/pigeon-bottle-ppsu240.jpg",
      imageAlt: "ピジョン 母乳実感 240ml",
      officialHref: "https://products.pigeon.co.jp/item/index-2378.html",
      guidePoints: ["広口タイプで調乳しやすさを重視する人"],
      productId: "pigeon-ppsu-240",
    },
    right: {
      brand: "ピジョン",
      line: "スリムタイプ 240ml",
      tagline: "細身で持ちやすさ・転がりにくさを重視する人",
      image: "/products/pigeon-slim-pp240.jpg",
      imageAlt: "ピジョン スリムタイプ 240ml",
      officialHref: "https://products.pigeon.co.jp/item/index-1774.html",
      guidePoints: ["細身で持ちやすさ・転がりにくさを重視する人"],
      productId: "pigeon-slim-240",
    },
    rows: [
      {
        label: "ボトルの形状",
        left: "広口タイプ（公式「持ちやすい太さと使いやすい広口ボトル」）",
        right: "スリムタイプ（公式「転がりにくく、持ちやすい形」）",
      },
      {
        label: "付属乳首（240ml）",
        left: "Mサイズ・Y字形（3ヵ月頃から）",
        right: "Mサイズ・丸穴（4ヵ月頃〜）",
      },
      {
        label: "乳首のラインナップ",
        left: "6サイズ（SS・S・M・L・LL・3L）",
        right: "4サイズ（S・M・Y・L）",
      },
      {
        label: "乳首の互換性（公式の明記）",
        left: "母乳実感の乳首はスリムタイプ哺乳びんに使用不可と明記",
        right: "スリムタイプの乳首ページには母乳実感への使用可否の明記なし",
      },
    ],
    faqEntries: [
      {
        question: "母乳実感240mlとスリムタイプ240mlは同じ容量ですか？",
        answer:
          "はい。今回比較する2商品はいずれも240mlです。容量は同じですが、ボトルの形状が異なります（母乳実感は広口タイプ、スリムタイプは細身タイプ）。",
      },
      {
        question: "どちらもMサイズの乳首が付属しますが、同じ乳首ですか？",
        answer:
          "いいえ。母乳実感240mlの付属乳首は「Mサイズ・Y字形・3ヵ月頃から」、スリムタイプ240mlの付属乳首は「Mサイズ・丸穴・4ヵ月頃〜」です。サイズ名は同じでも、吸い穴の形と対象時期が異なります。",
      },
      {
        question: "母乳実感の乳首をスリムタイプに付けられますか？",
        answer:
          "ピジョン公式は母乳実感の乳首ページで「スリムタイプ哺乳びんにはお使いいただけません」と明記しています。パーツを流用する場合は必ず公式ページの注意書きを確認してください。",
      },
      {
        question: "スリムタイプの乳首を母乳実感に付けられますか？",
        answer:
          "今回確認したスリムタイプの乳首ページには、母乳実感の哺乳びんへの使用可否を明記する文章は見つかりませんでした。公式の注意書きを確認のうえ、対応を判断してください。",
      },
      {
        question: "240mlに付属する乳首は新生児から使えますか？",
        answer:
          "両シリーズとも240mlに付属する乳首は「M」です。新生児期（0ヵ月）から使える乳首は別にラインナップされています（母乳実感はSS・丸穴、スリムタイプはS・丸穴）。新生児期に240mlを使う場合は乳首を別途購入して選ぶ必要があります。",
      },
      {
        question: "6ヵ月頃の乳首はどう違いますか？",
        answer:
          "母乳実感は「L・Y字形・6ヵ月頃〜」、スリムタイプは「Y・Y字形・6ヵ月頃〜」です。吸い穴の形はどちらもY字形ですが、サイズ名と対象時期が異なります。",
      },
      {
        question: "消毒・除菌の方法は違いますか？",
        answer:
          "いいえ。今回の2商品はどちらも煮沸・スチーム・薬液に対応し、電子レンジ除菌は不可です。",
      },
      {
        question: "どちらの方が赤ちゃんが飲みやすいですか？",
        answer:
          "公式スペックだけでは判定できません。ピジョンも、同じ施策の時期でも飲み方には個人差があるとして、乳児の成長と飲み方に合わせて乳首を選ぶよう案内しています。",
      },
    ],
  }),

  "pigeon-bottle-160-240": defineComparisonV2Article({
    diagnosisHref: "/tools/product-finder/baby-bottle/",
    left: {
      brand: "母乳実感",
      line: "160ml",
      tagline: "新生児期から使う人、まず小容量を用意したい人",
      image: "/products/pigeon-bottle-160-240-160ml.jpg",
      imageAlt: "母乳実感 160ml",
      officialHref: "https://products.pigeon.co.jp/item/index-2377.html",
      guidePoints: ["新生児期から使う人、まず小容量を用意したい人"],
      productId: "pigeon-160",
    },
    right: {
      brand: "母乳実感",
      line: "240ml",
      tagline: "哺乳量が増えてきた人、大きめの容量を用意したい人",
      image: "/products/pigeon-bottle-160-240-240ml.jpg",
      imageAlt: "母乳実感 240ml",
      officialHref: "https://products.pigeon.co.jp/item/index-2378.html",
      guidePoints: ["哺乳量が増えてきた人、大きめの容量を用意したい人"],
      productId: "pigeon-ppsu-240",
    },
    rows: [
      { label: "容量", left: "160ml", right: "240ml" },
      {
        label: "付属の乳首",
        left: "母乳実感 乳首 SSサイズ・吸い穴 丸穴",
        right: "母乳実感 乳首 Mサイズ・吸い穴 Y字形",
      },
      {
        label: "対象月齢の目安",
        left: "0ヵ月から",
        right: "3ヵ月頃から",
      },
    ],
    faqEntries: [
      {
        question: "母乳実感 160ml と 240ml はどっち？",
        answer:
          "新生児期から使う場合は、公式の対象月齢目安が0ヵ月からでSSサイズ乳首（丸穴）が付属する160mlが選択肢になります。240mlは対象月齢目安が3ヵ月頃からで、Mサイズ乳首（Y字形）が付属します。どちらが個々の赤ちゃんに適しているかについて、公式商品ページに一律の判断基準は明記されていません。容量だけでなく、対象月齢目安と付属乳首も確認して選ぶ必要があります。",
      },
      {
        question: "160mlの付属乳首は何サイズ？",
        answer:
          "160mlには「母乳実感 乳首 SSサイズ」が付属します。対象月齢目安は0ヵ月からで、吸い穴は丸穴です。",
      },
      {
        question: "240mlの付属乳首は何サイズ？",
        answer:
          "240mlには「母乳実感 乳首 Mサイズ」が付属します。対象月齢目安は3ヵ月頃からで、吸い穴はY字形です。",
      },
      {
        question: "新生児に160mlは足りる？",
        answer:
          "160mlの商品ページには対象月齢目安として「0ヵ月から」と記載されています。ただし、「新生児なら160mlの容量で必ず足りる」といった哺乳量の基準は、今回確認した公式商品ページには明記されていません。必要な哺乳量は公式商品ページだけでは判断できないため、要確認です。",
      },
      {
        question: "160mlと240mlで乳首は付け替えられる？",
        answer:
          "母乳実感の乳首には、SS・S・M・L・LL・3Lの6サイズが用意されています。ただし、今回確認した160ml・240mlの商品ページの記載だけでは、「160mlと240mlの間で乳首を自由に付け替えられる」とする互換性の詳細までは明記されていないため、必要な場合はピジョン公式の乳首適合情報を確認してください。",
      },
      {
        question: "160mlと240mlの値段はいくら違う？",
        answer:
          "2026年8月11日時点の公式オンラインショップ表示価格では、160mlが2,750円（税込）、240mlが2,860円（税込）です。差額は110円で、240mlのほうが110円高くなっています。価格は変更される可能性があるため、購入時には公式ページで最新価格を確認してください。",
      },
    ],
  }),

  shupot: defineComparisonV2Article({
    diagnosisHref: "/tools/product-finder/diaper/",
    left: {
      brand: "ピジョン 電動鼻吸い器 シュポット",
      line: "電動 シュポット",
      tagline: "コンセントのある場所でパワフルに吸引したい人の候補",
      image: "/products/shupot-dendo.jpg",
      imageAlt: "ピジョン 電動鼻吸い器 シュポット 電動 シュポット",
      officialHref: "https://shop.pigeon.co.jp/products/1032018",
      guidePoints: ["コンセントのある場所でパワフルに吸引したい人の候補"],
      productId: "shupot-dendo",
    },
    right: {
      brand: "ピジョン 手動鼻吸い器 シュポットポンプ＋フィット鼻ノズル",
      line: "手動 シュポットポンプ",
      tagline: "電源不要・価格と気軽さを優先したい人の候補",
      image: "/products/shupot-shudo.jpg",
      imageAlt:
        "ピジョン 手動鼻吸い器 シュポットポンプ＋フィット鼻ノズル 手動 シュポットポンプ",
      officialHref: "https://shop.pigeon.co.jp/products/2000638s",
      guidePoints: ["電源不要・価格と気軽さを優先したい人の候補"],
      productId: "shupot-shudo",
    },
    rows: [
      {
        label: "電源と使える場所",
        left: "ACアダプター式で専用ACアダプター付属。コンセントのある水平で安定した場所で使用。",
        right:
          "電源不要。コンパクトサイズ・フード付き・チューブもなく、スッキリ収納・持ち運び便利。",
      },
      {
        label: "吸引力の調整とお手入れ",
        left: "鼻水の状態に合わせてダイヤルで吸引力を調整。鼻水キャッチャーを中心に洗い、電動部本体とACアダプターは水洗い・煮沸・レンジ消毒すべて不可。",
        right:
          "シリコーンポンプとフィット鼻ノズルで適した吸引力を再現。まるごと洗浄OK・消毒/除菌ができる。",
      },
      {
        label: "価格と安全面の注意",
        left: "公式ショップ価格13,585円（2026-08-10確認）。定格15分・1回片鼻5秒以内・弱い位置から段階的に調整を公式が案内。安全に関する重要なお知らせあり。",
        right:
          "公式ショップ価格3,762円（2026-08-10確認）。電源不要で大きな音がでない。",
      },
    ],
    faqEntries: [
      {
        question: "電動鼻吸い器 シュポットと手動、どっちを選べばいい？",
        answer:
          "公式情報から整理すると、コンセントのある場所でパワフルな吸引とダイヤル調整を重視するなら電動鼻吸い器 シュポット、電源不要・コンパクト・価格を抑えることを重視するなら手動鼻吸い器 シュポットポンプ＋フィット鼻ノズルという違いがあります。実際の吸いやすさや子どもの反応は、公式情報だけでは判断できません。",
      },
      {
        question: "シュポットの吸引力は調整できる？",
        answer:
          "電動鼻吸い器 シュポットは、鼻水の状態に合わせてダイヤルで吸引力を調整できます。公式では、弱い位置から段階的に調整するよう案内されています。手動鼻吸い器 シュポットポンプ＋フィット鼻ノズルはダイヤル式ではなく、手でシリコーンポンプを操作します。",
      },
      {
        question: "電動鼻吸い器 シュポットは新生児から使える？",
        answer:
          "付属するフィット鼻ノズルSについて、公式では「0ヵ月〜」と案内されています。Sサイズが小さいと感じる場合は別売のMサイズがあります。",
      },
      {
        question: "電動鼻吸い器 シュポットはチューブも毎回洗う？",
        answer:
          "公式では、チューブに鼻水が通らない構造とされており、通常は吸引後に鼻水キャッチャーを洗います。ただし、多量の鼻水の場合はシリコーンチューブに流れ込むおそれがあり、その場合はチューブも洗浄します。",
      },
      {
        question: "シュポットは煮沸消毒できる？",
        answer:
          "電動鼻吸い器 シュポットでは、フィット鼻ノズルS、鼻水キャッチャー本体・ふた・セパレーター、シリコーンチューブが120℃での煮沸・スチーム消毒に対応しています。一方、電動部本体と専用ACアダプターは煮沸できません。電子レンジ消毒も不可です。手動鼻吸い器 シュポットポンプ＋フィット鼻ノズルは、公式に「まるごと洗浄OK」「消毒・除菌ができる」と案内されています。",
      },
      {
        question: "電動鼻吸い器 シュポットは何秒くらい吸引していい？",
        answer:
          "公式の安全上のルールでは、1回あたり片方の鼻に5秒を超える吸引は禁止されています。また、定格時間15分を超える連続運転は禁止され、再使用するときは5分以上停止するよう案内されています。使用前には取扱説明書と公式の安全に関する重要なお知らせも確認してください。",
      },
    ],
  }),

  "tiger-mta-j050-guide": defineComparisonV2Article({
    left: {
      brand: "タイガー",
      line: "MTA-J050",
      tagline: "0.5L・軽さを優先するなら",
      image: tigerMtaJ050.imagePath,
      imageAlt: "タイガー MTA-J050",
      officialHref: tigerMtaJ050.officialUrl,
      guidePoints: [
        "容量0.5Lで持ち歩きやすい",
        "本体質量約0.26kgで軽い",
        "通勤・通学など日常の持ち歩き向け",
      ],
      productId: "tiger-mta-j050",
    },
    right: {
      brand: "タイガー",
      line: "MTA-J080",
      tagline: "0.8L・容量を優先するなら",
      image:
        "https://www.tiger-corporation.com/wp-content/uploads/2025/07/MTA-J080_750x750-d1adb21a6e79c156ac1d5d974c9b75dd.jpg",
      imageAlt: "タイガー MTA-J080",
      officialHref: tigerMtaJ050.officialUrl,
      guidePoints: [
        "容量0.8Lで多めに入れられる",
        "保冷効力7℃以下の案内",
        "長時間の外出や水分補給向け",
      ],
      productId: "tiger-mta-j080",
    },
    rows: [
      {
        label: "容量",
        left: "0.5L",
        right: "0.8L",
        highlight: "right",
        highlightNote: "大容量",
        bar: { left: 0.5, right: 0.8 },
      },
      {
        label: "本体質量",
        left: "約0.26kg",
        right: "約0.36kg",
        highlight: "left",
        highlightNote: "約100g軽い",
        bar: { left: 0.26, right: 0.36 },
      },
      {
        label: "保冷効力（6時間）",
        left: "8℃以下",
        right: "7℃以下",
        highlight: "right",
        highlightNote: "低い温度を保つ",
        bar: { left: 8, right: 7 },
      },
      {
        label: "保温効力（6時間）",
        left: "68℃以上",
        right: "75℃以上",
        highlight: "right",
        highlightNote: "高い温度を保つ",
        bar: { left: 68, right: 75 },
      },
      {
        label: "本体寸法",
        left: "幅7.5×奥行8.6×高さ23.3cm",
        right: "幅7.5×奥行8.6×高さ31.4cm",
      },
    ],
    faqEntries: [
      {
        question: "MTA-J050とMTA-J080の違いは？",
        answer:
          "容量がMTA-J050は0.5L、MTA-J080は0.8Lです。公式仕様では、MTA-J050が約0.26kg、MTA-J080が約0.36kgで、MTA-J080の方が容量と重量が大きくなっています。",
      },
      {
        question: "軽いのはどっち？",
        answer:
          "公式仕様の本体質量は、MTA-J050が約0.26kg、MTA-J080が約0.36kgです。持ち運び時の軽さを優先するなら、MTA-J050が候補になります。",
      },
      {
        question: "保冷力が高いのはどっち？",
        answer:
          "公式仕様の保冷効力（6時間）は、MTA-J050が8℃以下、MTA-J080が7℃以下です。数値だけで比較すると、MTA-J080の方が低い温度を保つ案内です。",
      },
    ],
  }),

  "yamajitsu-film-holder-242286-vs-242287": defineComparisonV2Article({
    left: {
      brand: "山崎実業 tower",
      line: "フィルムフックまな板ホルダー 242286",
      tagline: "まな板2枚を浮かせて収納するなら",
      image: "/products/yamazaki-film-holder-242286.jpg",
      imageAlt: "山崎実業 フィルムフックまな板ホルダー タワー 242286",
      officialHref: "https://www.yamajitsu.co.jp/products/242286",
      guidePoints: ["厚みの異なるまな板を2枚、壁面に浮かせて収納したい人向け"],
    },
    right: {
      brand: "山崎実業 tower",
      line: "フィルムフック鍋蓋ホルダー 242287",
      tagline: "鍋蓋を浮かせて収納するなら",
      image: "/products/yamazaki-film-holder-242287.jpg",
      imageAlt: "山崎実業 フィルムフック鍋蓋ホルダー タワー 242287",
      officialHref: "https://www.yamajitsu.co.jp/products/242287",
      guidePoints: ["直径14〜30cmの鍋蓋を壁面に収納したい人向け"],
    },
    rows: [
      {
        label: "収納するもの",
        left: "まな板2枚",
        right: "鍋蓋1枚",
        highlight: null,
      },
      {
        label: "対応サイズ",
        left: "厚み1.5cm・2.5cm以内を各1枚",
        right: "直径14〜30cm",
        highlight: null,
      },
      {
        label: "商品サイズ",
        left: "W12×D5.7×H12cm",
        right: "W13.5×D6.2×H14cm",
        highlight: null,
      },
      {
        label: "商品重量",
        left: "140g",
        right: "120g",
        highlight: "right",
        highlightNote: "20g軽い",
      },
      { label: "耐荷重", left: "2kg", right: "2kg", highlight: null },
    ],
    faqEntries: [
      {
        question: "まな板ホルダーと鍋蓋ホルダーの違いは？",
        answer:
          "まな板ホルダーは厚み1.5cmと2.5cm以内のまな板を各1枚、鍋蓋ホルダーは直径14〜30cmの鍋蓋を収納する商品です。",
      },
      {
        question: "耐荷重は同じ？",
        answer: "公式ページでは、どちらも耐荷重2kgと記載されています。",
      },
      {
        question: "取り付けられる壁面は？",
        answer:
          "どちらも光沢のある平らで油染みのない面が対象です。タイル、プラスチック、ステンレス、ガラス、金属塗装面、人工大理石などが例として案内されています。",
      },
      {
        question: "価格と在庫は確認できますか？",
        answer:
          "価格・在庫・送料・ポイントは販売先で変わるため、購入時点の販売ページで確認してください。",
      },
    ],
  }),
} satisfies Record<string, ComparisonV2Article>;
