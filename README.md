# 🚄 高铁五七班

> 一句话，开启你的高铁之旅。AI 生成个性化驾驶场景，沉浸式模拟高铁驾驶体验。

## 功能特性

- 🎮 **一句话AI生成** — 输入任意描述，AI生成专属驾驶场景
- 🚄 **沉浸式驾驶** — 2.5D 视差滚动，加速/刹车/事件调度
- ⛰️ **8条经典线路** — 青藏高原、京沪线、武夷山隧道、跨海线等
- 🌧️ **动态天气** — 晴/雨/雪/雾，昼夜交替
- 🚆 **列车交汇** — 对向列车高速交汇的视觉冲击
- 🏆 **成绩系统** — 评分/排行榜/分享

## 技术栈

| 模块 | 技术 |
|------|------|
| 前端 | 微信小程序原生 + Canvas 2D |
| 渲染 | 自研视差滚动引擎（6层图层） |
| 后端 | 腾讯云开发（云函数 + 数据库） |
| AI | 腾讯混元 API |
| 数据库 | 云开发 MongoDB |

## 快速开始

### 1. 导入项目

1. 下载 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开开发者工具 → 导入项目
3. 项目目录选择本仓库根目录
4. AppID 填写你自己的小程序 AppID（或使用测试号）

### 2. 开通云开发

1. 在开发者工具中点击「云开发」
2. 创建云开发环境（免费版即可）
3. 复制环境 ID
4. 修改 `app.js` 中的 `env` 值：
   ```js
   wx.cloud.init({
     env: '你的环境ID',  // ← 替换这里
   })
   ```

### 3. 创建数据库集合

在云开发控制台 → 数据库中创建以下集合：

| 集合名 | 权限 | 说明 |
|--------|------|------|
| `scores` | 所有用户可读写 | 驾驶成绩记录 |

### 4. 部署云函数

在开发者工具中右键每个云函数文件夹 → 「上传并部署」：

- `cloudfunctions/aiGenerate` — AI场景生成
- `cloudfunctions/saveScore` — 保存成绩
- `cloudfunctions/getRanking` — 排行榜

### 5. 配置AI（可选）

如果要使用AI生成功能，在云开发控制台 → 设置 → 环境变量中添加：

| 变量名 | 值 |
|--------|-----|
| `HUNYUAN_SECRET_ID` | 腾讯云 SecretId |
| `HUNYUAN_SECRET_KEY` | 腾讯云 SecretKey |

> 💡 不配置AI也能玩，直接选择热门线路即可

### 6. 运行

点击开发者工具的「编译」按钮即可预览。

## 项目结构

```
fuxing-simulator/
├── app.js                      # 小程序入口
├── app.json                    # 页面配置
├── app.wxss                    # 全局样式
├── project.config.json         # 项目配置
├── cloudfunctions/             # 云函数
│   ├── aiGenerate/             # AI场景生成
│   ├── saveScore/              # 保存成绩
│   └── getRanking/             # 排行榜
├── pages/
│   ├── index/                  # 首页（选线路+AI输入）
│   ├── scene/                  # 场景介绍页
│   ├── drive/                  # 驾驶界面（核心）
│   │   └── engine/
│   │       └── renderer.js     # Canvas 2D 渲染引擎
│   └── result/                 # 结果复盘页
└── utils/
    ├── routes.js               # 预制线路数据
    ├── config.js               # 全局配置
    ├── audio.js                # 音效引擎
    └── storage.js              # 本地存储
```

## 渲染引擎

Canvas 2D 视差滚动引擎，6层图层：

```
Layer 0: 天空（渐变+云朵+天气效果）
Layer 1: 远景（山脉/城市/海面剪影）
Layer 2: 中景（树木/路灯/电线杆）
Layer 3: 轨道（透视汇聚铁轨+枕木）
Layer 4: 特效（隧道/对向列车/速度线）
Layer 5: 驾驶舱（A柱+仪表台遮罩）
```

## 开发计划

- [x] MVP V1.0 — 基础驾驶 + 8条线路 + AI生成
- [ ] V1.1 — 真实音效 + 分享截图
- [ ] V1.2 — 排行榜 + 成就系统
- [ ] V2.0 — 抖音小程序版本
- [ ] V2.1 — 多人接龙 + 更多线路

## License

MIT
