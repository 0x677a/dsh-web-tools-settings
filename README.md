# dsh-web-tools-settings

Windows 宿主机版 DeepSeek Harness 的 `web_fetch` 设置插件。

它是一个独立的 DSH plugin，不是 DSH fork：

- Host 端注册 `web-tools` 设置命名空间，并根据设置动态挂载/卸载 `web_fetch`；
- Web 端在 `Settings > Plugins > Plugin configuration` 增加设置卡片；
- bundle patch 只挂载官方的 `@deepseek-ai/dsh-web-fetch-http` provider 和本插件；
- 针对 DSH `0.1.0-rc.6`，安装脚本对 `dsh-host-apiproxy` 做一个带备份、可恢复的最小 allowlist patch。

默认值是关闭 `web_fetch`。安装后重启 DSH，在网页设置里打开它，再继续对话即可。

## 安装

在 PowerShell 中：

```powershell
git clone https://github.com/0x677a/dsh-web-tools-settings.git D:\dsh-web-tools-settings
Set-Location D:\dsh-web-tools-settings
.\install.ps1 -DshRoot D:\deepseek-harness
```

安装脚本会直接用官方 profile 管理方式安装 `github:0x677a/dsh-web-tools-settings`，不会把本机 checkout 路径写入 DSH profile。`git clone` 只是为了拿到安装脚本；插件运行包由 DSH profile 的 pnpm 管理。

也可以不 clone，直接执行：

```powershell
$env:DSH_HOME = 'D:\deepseek-harness\dsh-home'
dsh plugin --profile web add github:0x677a/dsh-web-tools-settings
```

如果你的 DSH 不在 `D:\deepseek-harness`，传入实际目录，或设置 `$env:DSH_INSTALL_ROOT`。

以后更新插件：

```powershell
$env:DSH_HOME = 'D:\deepseek-harness\dsh-home'
dsh plugin --profile web update dsh-web-tools-settings
```

然后打开：

`Settings → Plugins → Plugin configuration → Web fetch`

## 卸载与回滚

```powershell
.\uninstall.ps1 -DshRoot D:\deepseek-harness
```

脚本只恢复它自己创建的 `.dsh-web-tools-settings.bak` 备份，不会覆盖其他 patch。卸载后重启 DSH。

## 安全边界

这里使用的是 DSH 官方的匿名 HTTP(S) provider。它不携带浏览器 Cookie、登录态或本机代理身份；`web_fetch` 只返回页面文本/Markdown，不是浏览器自动化。

当前 rc.6 provider 的上游说明仍提示：私网/SSRF 防护尚未实现。因此建议只对公开网址启用，不要把它当作访问内网、登录站点或本机服务的安全浏览器。需要点击、登录、读取浏览器现有页面时，应使用独立的浏览器 MCP/plugin。

## 兼容性

当前验证目标：DSH `0.1.0-rc.6`、Windows、Node 24。

插件代码已经带 `expose: "web"` 声明，未来 DSH 支持插件自声明网页设置后，安装脚本会跳过 rc.6 allowlist patch。若 DSH 版本不是 rc.6，脚本不会修改 `node_modules`，而是提示并保持原状。
