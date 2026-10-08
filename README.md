# Player2 汉化

针对 `D:\ruanjian\player2\player2.exe`（Tauri v2 + WebView2），把内嵌前端资源（brotli 压缩）里的英文界面文案替换为中文。文件总大小不变。

- 当前对应版本：**0.10.84**（2026-10-06 官方更新版 exe，大小 90,643,760 字节，SHA256 `9FFA732E…DDE88`）
- 上一版本：0.10.83（2026-10-01）
- 词库规模：`zh-CN.json` 1412 条、`zh-CN.context.json` 32 条
- 0.10.84 本轮命中：精确替换 1936 处 + 前缀替换 2 处 + 上下文替换 47 处

## 目录
- `tools/extract-assets.mjs`   从 exe 解出内嵌前端资源（brotli）
- `tools/extract-strings.mjs`  从解出的前端提取英文界面文案清单（输出 `i18n/strings.en.json`；旧工具的简易词法器会提前失步，对新版本不敏感，判断新增文案请用 `_delta2.mjs` / `_added_lits` / `_scan*` 系列）
- `tools/patch-exe.mjs`        按词库把中文写回 exe（原地替换，先 context 后精确匹配）
- `tools/scan-all.mjs`         全量扫描：解出前端 JS，列出仍未被词库覆盖的界面字符串
- `tools/shot.ps1`             截取 Player2 窗口截图（核验用）
- `tools/_dumpjs.mjs`          解出主 JS 到文件（配合 `node --check` 做语法校验）
- `tools/_delta2.mjs`          新旧版本 JS 对比：列出新增属性文案 / 新增字面量 / 消失文案
- `tools/_keycounts.mjs`       统计词库每条在新旧 exe 里的实际命中次数（找出失效条目）
- `tools/_merge.mjs`           合并新增词条与上下文条目，并逐条校验英文原文确实存在
- `tools/_verify.mjs`          断言检查：应翻译项已消失、内部枚举未被破坏
- `i18n/zh-CN.json`            主词库（纯字符串精确替换）
- `i18n/zh-CN.context.json`    上下文词表（只替换展示用出现位置，避开内部枚举）
- `i18n/_new_entries.json`     本版本新增词条（0.10.84 新增 46 条，供下次复用/审计）
- `i18n/_new_context.json`     本版本新增上下文条目（15 条）
- `i18n/_assert.json`          回归断言清单
- `frontend/`                  最近一次解包出的前端资源（供下次做版本对比）
- `out/player2.orig.exe`       未修改的原版
- `out/player2.zh.exe`         汉化版
- `shots/`                     核验截图

## 一次性重新汉化流程
```powershell
# 1) 保存新版原版并解包
Copy-Item "D:\ruanjian\player2\player2.exe" out\player2.orig.exe -Force
node tools\extract-assets.mjs out\player2.orig.exe frontend

# 2) 对比上一版前端，找出新增/改动的文案
node tools\_delta2.mjs frontend.old\assets_index-*.js frontend\assets_index-*.js i18n\zh-CN.json i18n
node tools\_keycounts.mjs out\player2.orig.exe i18n\zh-CN.json i18n\_counts_new.json   # zero-hit 应保持 9 条左右

# 3) 翻译新增文案 -> i18n\_new_entries.json / _new_context.json，校验并合并
node tools\_merge.mjs frontend\assets_index-*.js i18n\zh-CN.json i18n\_new_entries.json i18n\zh-CN.context.json i18n\_new_context.json

# 4) 打补丁 + 自检 + 断言 + 回归扫描
node tools\patch-exe.mjs out\player2.orig.exe i18n\zh-CN.json out\player2.zh.exe
node tools\_dumpjs.mjs out\player2.zh.exe tmp\zh.mjs ; node --check tmp\zh.mjs
node tools\_verify.mjs out\player2.zh.exe i18n\_assert.json
node tools\scan-all.mjs i18n\zh-CN.json out\player2.zh.exe i18n\_scan_zh.txt

# 5) 先退出 Player2，再覆盖安装目录
Get-Process player2 | Stop-Process -Force
Copy-Item "D:\ruanjian\player2\player2.exe" "D:\ruanjian\player2\player2.exe.$(Get-Date -Format yyyyMMdd-HHmm).bak"
Copy-Item out\player2.zh.exe "D:\ruanjian\player2\player2.exe" -Force
```

## 核验方法
WebView2 界面无法用普通截图判读时，可用 UI Automation 读回渲染后的文本（需在沙箱外启动，并先设置环境变量）：
```powershell
$env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS="--force-renderer-accessibility"
Start-Process "D:\ruanjian\player2\player2.exe"
# 之后用 System.Windows.Automation 从主窗口句柄递归取 Name，即可读到“主页 / AI 请求 / 角色 …”
```

## 还原
把安装目录里的 `player2.exe.*.bak` 复制覆盖回 `player2.exe` 即可（最近一次原版备份为 `player2.exe.20261008-1345.bak`）。

## 说明
- 词库按「纯字符串 split/join」精确替换；`zh-CN.context.json` 会在精确替换之前先按原样 JS 片段替换，用于只改展示位置、避开同一字符串的内部标识用法。
- **不能进主词库、只能用上下文词表替换的字符串**（同一字面量同时被当作枚举值/属性名/比较对象）：
  `Character`、`Game`、`Other`、`Chat`、`Images`、`Assistant`、`fallback`、`Home`、`Default`、`Custom`、`Avatar`、`Male`、`Female`、`Delete`、`Back`、`Patron`。
  （`Message` 已在主词库，属历史遗留，会顺带改到 MUI 的 slot 名，实测无影响。）
- 内部枚举/标识一律不翻译，否则会破坏功能。当前保留英文的关键字包括：
  `Patron`、`Patron MIP`、`Off`、`Open`、`Preset`、`Custom`、`Default`、`Input`、`Select`、
  `Delete`、`Back`、`Male`、`Female`、`Volume`、`Skin`、`Stream`、`System`、`Tool`、`Error`、`Info`、`Warn`、
  `Failed to fetch`、`Load failed`、`Server`、`Logout`、`Unknown` 等。
- 游戏分类标签（`Minecraft`、`Kenshi`、`Rimworld`、`Mantle`、`Desktop Assistant`、`Indie Games` 等）会与服务器返回的 tag 比较，不能翻译；`Mods` 标签同样保留。
- 语音语言名称（`English`、`Japanese`…）只用于下拉框显示，传给接口的是语言代码，可以安全翻译。
- 官方自动更新会覆盖 exe，更新后需要重跑上面的流程。

## 0.10.84 变化摘要
- 新增「AI 请求」页面（侧边栏第 5 项，路由 `/requests`）：对话 / 图像两个标签页、请求记录开关、记录列表（时间 / 来源 / 模型 / Token 数 / 延迟）、全部清除与复制 JSON、请求详情弹窗（你的提示词 / 游戏 MOD / 请求提示词 / 输入图像 / 用户 / 助手 / 回退 等标签）。本轮 46 条主词条 + 15 条上下文条目主要覆盖该功能，已用 UI Automation 实测渲染结果。
- 模型回退预设新增两处提示文案（「系统默认」只会尝试更便宜的模型 / 所选模型最便宜没有备选）。
- 侧边栏新增「AI 请求」；同时把原先遗留英文的 `Character` 修正为「角色」（只改展示位，TTS 模式枚举 `Character` 未受影响）。

## 已知限制
- 会员套餐卡片上的标题、价格与权益条目（如 `Pay as you go`、`Best for burst usage…`）由服务器接口下发，前端包里没有，无法通过改 exe 汉化。
- 请求记录列表的表格表头（时间 / 来源 / 模型 / Token 数 / 延迟）与「全部清除 / 复制 JSON / 已记录的请求」等只在真的抓到请求记录后才会渲染，本轮仅做静态断言校验，未做界面实测。
- 第三方库内部日志、three.js / Sentry 的报错文本保持英文（不面向用户）。
