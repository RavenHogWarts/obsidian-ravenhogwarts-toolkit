import { safeEvaluate } from "./expressionEvaluator";

export interface IVariableContext {
	[key: string]: unknown;
}

/** 兼容 obsidian moment 的最小接口，便于纯单元测试注入 */
export interface IMomentLike {
	format(fmt?: string): string;
}

/**
 * 把求值结果转成可写入文本的字符串；无意义的值返回 null，
 * 由调用方原样保留占位符。
 */
function stringifyValue(value: unknown): string | null {
	if (value === undefined || value === null) return null;
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	if (typeof value === "object") {
		// Auto-generated objects may not have meaningful toString - converting to string for backward compatibility
		// eslint-disable-next-line @typescript-eslint/no-base-to-string -- Intentional conversion for template rendering
		const str = String(value);
		return str === "[object Object]" ? null : str;
	}
	return null;
}

/**
 * 模板渲染引擎：
 * 1. 先处理旧语法 {{date}} / {{time}} / {{date:FMT}} / {{time:FMT}} / {{title}}
 *    （保持对既有模板文件的兼容）；
 * 2. 再处理 ${...} 变量表达式（受控求值，失败原样保留占位符）。
 */
export class VariableEngine {
	constructor(private readonly context: IVariableContext) {}

	render(input: string): string {
		if (!input) return input;
		return this.renderExpressions(this.renderLegacy(input));
	}

	private get now(): IMomentLike | undefined {
		const now = this.context.now;
		if (
			now &&
			typeof (now as { format?: unknown }).format === "function"
		) {
			return now as IMomentLike;
		}
		return undefined;
	}

	private renderLegacy(input: string): string {
		const now = this.now;
		let res = input;
		if (now) {
			res = res.replace(/{{date:(.*?)}}/g, (_m, fmt: string) =>
				now.format(fmt?.trim() || "YYYY-MM-DD")
			);
			res = res.replace(/{{time:(.*?)}}/g, (_m, fmt: string) =>
				now.format(fmt?.trim() || "HH:mm")
			);
			res = res.replace(/{{date}}/g, () => now.format("YYYY-MM-DD"));
			res = res.replace(/{{time}}/g, () => now.format("HH:mm"));
		}
		const notename = this.context.notename;
		if (typeof notename === "string" && notename.length > 0) {
			res = res.replace(/{{title}}/g, notename);
		}
		return res;
	}

	private renderExpressions(input: string): string {
		return input.replace(/\${(.*?)}/g, (match, expr: string) => {
			const value = safeEvaluate(expr.trim(), this.context);
			return stringifyValue(value) ?? match;
		});
	}
}
