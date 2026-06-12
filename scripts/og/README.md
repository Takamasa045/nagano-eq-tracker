# OGP画像・アイコンの再生成

`og.html` / `icon.html` をheadless Chromeで撮影して `public/` に書き出す。

```bash
# puppeteer-core が必要（例: ~/.cache/shot-tool に npm i puppeteer-core）
NODE_PATH=~/.cache/shot-tool/node_modules node .claude/shot.cjs "file://$PWD/scripts/og/og.html"   public/og.png 1200 630
NODE_PATH=~/.cache/shot-tool/node_modules node .claude/shot.cjs "file://$PWD/scripts/og/icon.html" public/apple-touch-icon.png 180 180
```

- `og.png`: 1200x630。index.html の og:image から絶対URLで参照される
- `apple-touch-icon.png`: 180x180
- ベクター版ブランドマークは `public/favicon.svg`
