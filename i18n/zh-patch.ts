// TUI 中文补丁引擎（bun/TS）—— omp-zh2.py 的等价实现。
// 供 tui-zh.ts 扩展在每次启动时自愈调用：官方 bundle 升级后英文串回归，
// 本模块检测并重新打补丁（仅改字符串字面量，不碰逻辑）。
import { copyFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join as joinPath } from "node:path";

// Auto-detect paths: works on Windows, macOS, Linux; survives bun reinstall.
const HOME = homedir();
const BUN_GLOBAL = joinPath(HOME, ".bun", "install", "global", "node_modules");
const OMP_AGENT = joinPath(HOME, ".omp");

export const BUNDLE_PATH = joinPath(BUN_GLOBAL, "@oh-my-pi", "pi-coding-agent", "dist", "cli.js");
export const BACKUP_PATH = joinPath(BUN_GLOBAL, "@oh-my-pi", "pi-coding-agent", "dist", "cli.js.en.bak");
export const MAPPING_PATH = joinPath(OMP_AGENT, "i18n", "zh-tui.json");

type Style = "dq" | "sq" | "bt";

function uniEscape(s: string): string {
	return s.replace(/[\u0080-\uffff]/g, ch => `\\u${ch.codePointAt(0)!.toString(16).padStart(4, "0")}`);
}

// minifier may encode U+0080–U+00FF as \xNN and everything above as \uXXXX
function mixedEscape(s: string): string {
	let out = "";
	for (const ch of s) {
		const cp = ch.codePointAt(0)!;
		if (cp <= 0x7f) out += ch;
		else if (cp <= 0xff) out += `\\x${cp.toString(16).padStart(2, "0")}`;
		else out += `\\u${cp.toString(16).padStart(4, "0")}`;
	}
	return out;
}

function escapeRe(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const alt = (lst: readonly string[]): string =>
	[...new Set(lst)].sort((a, b) => b.length - a.length).map(escapeRe).join("|");

function encodeValue(text: string, style: Style): string {
	let out = "";
	for (const ch of text) {
		const cp = ch.codePointAt(0)!;
		if (cp > 0x7e) {
			// The bundle declares `// @bun`; bun decodes raw non-ASCII source
			// bytes in such files as Latin-1 → double-encoding mojibake at
			// runtime. Emit \uXXXX escapes, the same form every original
			// non-ASCII literal in the bundle uses.
			for (const unit of ch) out += `\\u${unit.codePointAt(0)!.toString(16).padStart(4, "0")}`;
			continue;
		}
		if (ch === "\\") out += "\\\\";
		else if (ch === '"' && style === "dq") out += '\\"';
		else if (ch === "'" && style === "sq") out += "\\'";
		else if (ch === "`" && style === "bt") out += "\\`";
		else if (ch === "\n") out += "\\n";
		else if (ch === "\r") out += "\\r";
		else if (ch === "\t") out += "\\t";
		else out += ch;
	}
	if (style === "bt") out = out.replace(/\$\{/g, "\\${");
	return out;
}
// lookup: byte form inside the bundle quotes (single backslashes) → mapping key
let lookup: Record<string, string> | undefined;
let regexes: Record<Style, RegExp> | undefined;

function compile(mapping: Record<string, string>): void {
	lookup = Object.create(null);
	const dqKeys: string[] = [];
	const sqKeys: string[] = [];
	const btKeys: string[] = [];
	for (const k of Object.keys(mapping).sort((a, b) => b.length - a.length)) {
		const forms = new Set<string>([k]);
		if (/[^\x00-\x7f]/.test(k)) forms.add(uniEscape(k));
		if (/[^\x00-\x7f]/.test(k)) forms.add(mixedEscape(k));
		for (const f of forms) {
			// bytes inside the quotes in the bundle: only the quote char gets escaped
			const dqForm = f.replace(/"/g, '\\"');
			const sqForm = f.replace(/'/g, "\\'");
			dqKeys.push(dqForm);
			sqKeys.push(sqForm);
			btKeys.push(f);
			lookup[f] = k;
			lookup[dqForm] = k;
			lookup[sqForm] = k;
		}
	}
	// capture group keeps every alternation branch anchored inside its quotes
	regexes = {
		dq: new RegExp('"(' + alt(dqKeys) + ')"', "g"),
		sq: new RegExp("'(" + alt(sqKeys) + ")'", "g"),
		bt: new RegExp("(?<=[`}])(" + alt(btKeys) + ")(?=[`$])", "g"),
	};
}

export interface PatchResult {
	total: number;
	changed: boolean;
}

/** Applies the zh mapping to the bundle. Idempotent: 0 hits → no write. */
export function applyZhPatch(): PatchResult {
	if (!existsSync(MAPPING_PATH)) return { total: 0, changed: false };
	const mapping = JSON.parse(readFileSync(MAPPING_PATH, "utf8")) as Record<string, string>;
	if (!regexes) compile(mapping);
	const rx = regexes!;
	const table = lookup!;
	let text = readFileSync(BUNDLE_PATH, "utf8");
	let total = 0;

	const pass = (style: Style): void => {
		text = text.replace(rx[style], (match: string, group: string) => {
			const key = table[group ?? match];
			const value = key !== undefined ? mapping[key] : undefined;
			if (value === undefined) return match;
			total++;
			const enc = encodeValue(value, style);
			return style === "dq" ? `"${enc}"` : style === "sq" ? `'${enc}'` : enc;
		});
	};

	pass("dq");
	pass("sq");
	pass("bt");
	if (total === 0) return { total: 0, changed: false };
	if (!existsSync(BACKUP_PATH)) copyFileSync(BUNDLE_PATH, BACKUP_PATH);
	const tmp = BUNDLE_PATH + ".zh.tmp";
	writeFileSync(tmp, text);
	renameSync(tmp, BUNDLE_PATH); // atomic swap
	return { total, changed: true };
}

export function revertZhPatch(): boolean {
	if (!existsSync(BACKUP_PATH)) return false;
	const tmp = BUNDLE_PATH + ".en.tmp";
	copyFileSync(BACKUP_PATH, tmp);
	renameSync(tmp, BUNDLE_PATH);
	return true;
}
