// tui-zh — OMP TUI 中文自愈补丁扩展。
// 发布地址：https://github.com/<user>/omp-tui-zh
//
// 每次启动时静默检查官方 bundle（dist/cli.js）是否含未翻译的英文 UI 串：
// 命中即重新应用映射表的字面量替换（原子写回）。升级 OMP 后第一次启动
// 提示，此后所有启动均为中文。
//
// 彻底卸载：删除本文件与 ~/.omp/i18n/，再运行
//   bun -e "const m = await import('./zh-patch.ts'); console.log(m.revertZhPatch())"
//   （需在删除 i18n 目录之前，且当前目录为 ~/.omp/i18n）

import { homedir } from "node:os";
import { join as joinPath } from "node:path";

const HOME = homedir();
const ENGINE = joinPath(HOME, ".omp", "i18n", "zh-patch.ts");
const ENGINE_URL = `file:///${ENGINE.replace(/\\/g, "/")}`; // cross-platform, no encode needed

interface PatchResult {
	total: number;
	changed: boolean;
}

interface NotifyUi {
	notify(message: string, type?: "info" | "warning" | "error"): void;
}

interface PiLike {
	on(event: "session_start", handler: (event: unknown, ctx: { ui: NotifyUi }) => void | Promise<void>): void;
}

export default function (pi: PiLike) {
	let notice: string | undefined;

	void (async () => {
		const patcher = (await import(ENGINE_URL)) as { applyZhPatch(): PatchResult };
		const result = patcher.applyZhPatch();
		if (result.changed) {
			notice = `TUI 中文补丁已应用（${result.total} 处替换），下次启动完全生效`;
		}
	})().catch(() => {});

	pi.on("session_start", async (_event, ctx) => {
		if (!notice) return;
		try {
			ctx.ui.notify(notice, "info");
		} catch {}
		notice = undefined;
	});
}