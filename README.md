# Player2 汉化

针对 `D:\ruanjian\player2\player2.exe`（Tauri v2 + WebView2），把内嵌前端资源（brotli 压缩）里的英文界面文案替换为中文。文件总大小不变。

## 目录
- `tools/extract-assets.mjs`   从 exe 解出内嵌前端资源（brotli）
- `tools/extract-strings.mjs`  从解出的前端提取英文界面文案清单
- `tools/patch-exe.mjs`        按词库把中文写回 exe（原地替换）
- `tools/scan-all.mjs`         全量扫描：解出前端 JS，列出仍未被词库覆盖的界面字符串
- `tools/shot.ps1`             截取 Player2 窗口截图（核验用）
- `i18n/zh-CN.json`            主词库（约 1366 条，纯字符串精确替换）
- `i18n/zh-CN.context.json`    上下文词表（只替换展示用出现位置，避开内部枚举）
- `out/player2.orig.exe`       未修改的原版
- `out/player2.zh.exe`         汉化版

## 重新打包
```powershell
node tools/patch-exe.mjs "out\player2.orig.exe" "i18n\zh-CN.json" "out\player2.zh.exe"
node tools/scan-all.mjs "i18n\zh-CN.json" "out\player2.zh.exe" "i18n\_scan.txt"
# 先关掉 Player2 进程，再把 out\player2.zh.exe 复制覆盖到 D:\ruanjian\player2\player2.exe
```

## 还原
把安装目录里的 `player2.exe.*.bak` 复制覆盖回 `player2.exe` 即可。

## 说明
- 词库按“纯字符串 split/join”精确替换；`zh-CN.context.json` 会在精确替换之前先按原样 JS 片段替换，用于只改展示位置、避开同一字符串的内部标识用法。
- 内部枚举/标识一律不翻译，否则会破坏功能。当前保留英文的关键字包括：
  `Patron`、`Patron MIP`、`Off`、`Open`、`Preset`、`Custom`、`Default`、`Input`、`Select`、
  `Home`、`Delete`、`Back`、`Male`、`Female`、`Chat`、`Credits`、`Volume`、`Skin`、`Avatar`、
  `Stream`、`System`、`Tool`、`Error`、`Info`、`Warn`、`Failed to fetch`、`Load failed`、`Server` 等。
  （其中 `Back`/`Default`/`Delete`/`Home`/`Male`/`Female`/`Avatar`/`Patron` 的展示位置由 context 词表单独处理。）
- 游戏分类标签（`Minecraft`、`Kenshi`、`Rimworld`、`Mantle`、`Desktop Assistant`、`Indie Games` 等）会与服务器返回的 tag 比较，不能翻译。
- 语音语言名称（`English`、`Japanese`…）只用于下拉框显示，传给接口的是语言代码，可以安全翻译。
- 官方自动更新会覆盖 exe，更新后需要重跑上面的命令。

## 已知限制
- 会员套餐卡片上的标题、价格与权益条目（如 `Pay as you go`、`Best for burst usage…`）由服务器接口下发，前端包里没有，无法通过改 exe 汉化。
- 第三方库内部日志、three.js / Sentry 的报错文本保持英文（不面向用户）。
