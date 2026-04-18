# 長野県北部 余震活動トラッカー

2025年4月18日（M5.1 震度5弱）と 2026年4月18日（M5.0 震度5強）、ちょうど1年違いに同じ震源域で発生した本震の余震活動を、**経過時間軸を揃えて**比較するWebアプリ。

## 機能

- 累積件数の重ね描き（本震時刻=0）
- M-T 図（時間×マグニチュード散布）
- 発生頻度ヒストグラム + 大森-宇津則 `n(t)=K/(t+c)^p` フィット（参考線）
- 震央マップ（MapLibre GL + OSM）
- 表示期間プリセット: 6時間 / 24時間 / 3日 / 7日 / 30日 / 1年

## データ

- 出典: [P2P地震情報 API v2](https://www.p2pquake.net/secondary_use/)（気象庁発表の有感地震を再配布）
- 震源域フィルタ: 緯度 36.4–36.7 / 経度 137.7–138.1 / 深さ ≤ 30km、震央名「長野県北部」、M ≥ 2.0
- 本震速報値で抽出（後の確定値で上書きされ得る）

## 開発

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm build        # 本番ビルド
python3 scripts/fetch.py   # データ更新（P2P APIから取得→public/data/events.json）
```

## デプロイ（GitHub Pages）

1. このリポジトリを GitHub に push
2. Settings → Pages → Source を **GitHub Actions** に変更
3. `.github/workflows/deploy.yml` が毎時データ更新＋デプロイを実行

Vercel に置く場合はそのまま import で動きます（base path 不要）。

## 注意

- 速報値は時刻・規模が後で修正されることがあります。完全性・即時性は保証しません。
- 大森則フィットは2025系列のビン頻度に対する参考フィット。減衰傾向の比較目的のみで、予測には使えません。
- OSMタイルは個人プロジェクト用途を想定。アクセスが増えたら別タイルプロバイダ（MapTiler / Stadia 等）に切り替えてください。

## ライセンス

MIT
