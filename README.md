# omp-tui-zh

OMP TUI 中文自愈补丁。升级 omp 后自动恢复，无需重装。

## 原理

OMP 没有官方 i18n，但 `dist/cli.js` 里的 UI 字符串在压缩后原样保留。
本方案在文件层做精确字面量替换（只动字符串，不碰逻辑），升级 omp 后扩展自动重新打补丁。

## 覆盖范围

- 设置面板标签/分组/描述（1510 条）
- 对话提示/错误/通知
- 模型选择器（/model hub）
- 目标/规划/循环/记忆/分享等 slash 命令反馈
- 会话管理（分支/删除/导出/恢复）

## 安装

```powershell
# Windows
git clone https://github.com/<your-username>/omp-tui-zh.git
cd omp-tui-zh
powershell -ExecutionPolicy Bypass -File install.ps1
```

```sh
# macOS / Linux
git clone https://github.com/<your-username>/omp-tui-zh.git
cd omp-tui-zh
sh install.sh
```

## 使用

重启 omp。首次英文界面 + 通知"下次启动完全生效"，第二次起全中文。
升级 omp 后自动恢复，无需重装本补丁。

## 卸载

```sh
rm -f ~/.omp/agent/extensions/tui-zh.ts
rm -rf ~/.omp/i18n
```

还原 bundle（在删除 i18n 目录之前）：
```sh
cd ~/.omp/i18n && bun -e "const m = await import('./zh-patch.ts'); console.log(m.revertZhPatch())"
```

## 文件结构

```
extensions/tui-zh.ts    # OMP 扩展（自愈入口）
i18n/zh-patch.ts        # 补丁引擎（自动检测路径）
i18n/zh-tui.json        # 1510 条 EN→ZH 映射表
install.ps1             # Windows 安装脚本
install.sh              # Unix 安装脚本
```

## 限制

- 只支持 `bun install -g` 安装的 omp，原生二进制安装无效
- 模板插值句（如 `"${n} ..."`）无法整句匹配，保持英文
- 单 token 标签页名（Model/Memory/Files 等）与逻辑键同形，未翻译
- 首次启动需两次（补丁写入 + 进程加载），升级后同理
- 兼容 omp 18.x，大版本升级后新字符串可能回到英文，需更新映射表

## 许可

MIT