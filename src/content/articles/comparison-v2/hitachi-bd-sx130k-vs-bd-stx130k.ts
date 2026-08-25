import { defineComparisonV2 } from './_base';

export const entry = defineComparisonV2(
    "hitachi-bd-sx130k-vs-bd-stx130k",
    {
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
      },
      rows: [
        {
          label: "操作パネル",
          left: "プッシュボタン式操作パネル",
          right: "ワイドカラー液晶タッチパネル",
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
        { label: "本体質量", left: "約92kg", right: "約93kg" },
        {
          label: "洗濯・乾燥容量",
          left: "洗濯・脱水13kg／洗濯～乾燥・乾燥7kg",
          right: "洗濯・脱水13kg／洗濯～乾燥・乾燥7kg",
        },
      ],
    },
  );
