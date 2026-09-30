# 没心机

桌面风格的 **角色扮演 / 聊天 PWA**：主屏应用、密谈 IM、晤面、论坛、关系网、世界书、生图与语音等。  
**对话与档案数据保存在浏览器本机**（IndexedDB），需自行配置大模型 API Key（仅存本设备）。

本仓库为 **开源版**：可直接使用主功能；**不含云账号登录**（QQ / Discord / 激活码等仅正式版提供）。

**作者：Ruiya**

---

## 许可与二改

本项目采用 **[GNU AGPL-3.0](LICENSE)**。

- 你可以使用、修改、再发布本软件。
- **任何修改版、衍生版、基于本代码提供在线服务的版本，都必须以相同许可证开源**，并向用户提供对应源代码（AGPL 第 13 条等对网络服务有要求）。
- 若不同意上述义务，请勿分发或公开部署修改后的版本。

---

## 快速开始

### 1. 获取代码

在 GitHub 仓库页点击 **Code**，复制 HTTPS 地址后：

```bash
git clone <仓库 HTTPS 地址>
cd meixinji
```

### 2. 开源版入口已配置

此分支直接使用仓库内的 `auth.stub.js`、`oauth-bootstrap.stub.js`（本地模式，无云登录）。
**无需执行 PowerShell，也无需生成或上传 `auth.js`、`oauth-bootstrap.js`。**

### 3. 运行

- 用任意 **静态服务器** 打开本目录（不要只靠 `file://` 打开，以免 PWA / 模块异常）。
- 浏览器访问 `index.html`。
- 在设置中填写你的 **OpenAI 兼容 API**（或其它已支持的接口）后即可使用。

**部署示例**：GitHub Pages、Cloudflare Pages、Vercel 静态托管等，发布目录即本项目根目录（无 `dist` 构建步骤）。  
若对外提供可访问的部署实例，请遵守 AGPL 提供源代码获取方式。

### GitHub Pages（手机也能打开）

本仓库已经配置好静态入口，启用一次 Pages 即可：

1. 打开仓库 **Settings → Pages**。
2. 在 **Build and deployment → Source** 选择 **Deploy from a branch**。
3. **Branch** 选择 **main**，文件夹选择 **/(root)**，点击 **Save**。
4. 等待 GitHub 部署成功后，打开 <https://kanamememe.github.io/meixinji/>。

iPhone 可在 Safari 中打开网址，再使用「分享 → 添加到主屏幕」。
首次聊天前，在应用「设置」中填写自己的 API 地址、API Key 和模型。
聊天和角色资料保存在当前浏览器内，不会自动在手机与电脑之间同步；更换设备前请使用应用内备份。
应用「设置 → About」提供本分支的源码链接。

---

## 开源版与正式版

| | 开源版（本仓库） | 正式版 |
|--|------------------|--------|
| 密谈 / 角色 / 论坛等 | ✅ | ✅ |
| 云账号登录 | ❌ | ✅ |
| ST 验证卡导入解锁 | ❌ | ✅（需登录） |

---

## 开发与安全

- 发布前可运行：`node scripts/check-publish.js --staged`
- **切勿**将含 Supabase 配置、真实 `auth.js`、`.env` 等提交到公开仓库。
