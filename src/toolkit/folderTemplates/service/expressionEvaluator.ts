/**
 * 受控表达式求值器，用于替代 eval 解析 `${...}` 占位符。
 * 移植自 obsidian-attachment-pro（含安全加固）。
 *
 * 仅支持两种语法：
 *   1. 属性访问：  a.b.c
 *   2. 方法调用：  a.b('x') / a.b().c(1, true)
 *
 * 方法调用的参数只允许字符串/数字/布尔字面量；其余一切 JS 语法
 * （运算符、下标访问、模板字符串、new、分号等）都会在词法或语法
 * 阶段被拒绝，求值返回 undefined，由调用方保留原始占位符。
 */

type Token =
	| { kind: "ident"; value: string }
	| { kind: "string"; value: string }
	| { kind: "number"; value: number }
	| { kind: "boolean"; value: boolean }
	| { kind: "dot" }
	| { kind: "lparen" }
	| { kind: "rparen" }
	| { kind: "comma" };

// 空白单独成 token 以便跳过；字符串字面量整体捕获，内部空白不受影响
const TOKEN_PATTERN =
	/\s+|'[^']*'|"[^"]*"|\d+(?:\.\d+)?|[A-Za-z_$][\w$]*|[.(),]/g;

// 阻断原型链逃逸（如 file.constructor.constructor('...')）
const BLOCKED_PROPERTIES = new Set(["__proto__", "constructor", "prototype"]);

function tokenize(expr: string): Token[] | null {
	const tokens: Token[] = [];
	TOKEN_PATTERN.lastIndex = 0;
	let last = 0;
	let m: RegExpExecArray | null;
	while ((m = TOKEN_PATTERN.exec(expr)) !== null) {
		if (m.index !== last) {
			return null; // 出现无法识别的字符，整体拒绝
		}
		last += m[0].length;
		const s = m[0];
		if (/^\s/.test(s)) continue;
		if (s === ".") tokens.push({ kind: "dot" });
		else if (s === "(") tokens.push({ kind: "lparen" });
		else if (s === ")") tokens.push({ kind: "rparen" });
		else if (s === ",") tokens.push({ kind: "comma" });
		else if (s === "true" || s === "false")
			tokens.push({ kind: "boolean", value: s === "true" });
		else if (s[0] === "'" || s[0] === '"')
			tokens.push({ kind: "string", value: s.slice(1, -1) });
		else if (/^\d/.test(s))
			tokens.push({ kind: "number", value: Number(s) });
		else tokens.push({ kind: "ident", value: s });
	}
	return last === expr.length ? tokens : null;
}

function evaluate(tokens: Token[], root: Record<string, unknown>): unknown {
	let i = 0;

	function parseLiteral(): unknown {
		const t = tokens[i++];
		if (!t) throw new Error("unexpected end of expression");
		if (t.kind === "string" || t.kind === "number" || t.kind === "boolean") {
			return t.value;
		}
		throw new Error("method arguments must be literals");
	}

	// 用 isCall 区分「空参调用 f()」与「属性访问 f」，二者 args 都为空数组
	function parseArgs(): { isCall: boolean; args: unknown[] } {
		if (tokens[i]?.kind !== "lparen") return { isCall: false, args: [] };
		i++;
		const args: unknown[] = [];
		if (tokens[i]?.kind === "rparen") {
			i++;
			return { isCall: true, args };
		}
		for (;;) {
			args.push(parseLiteral());
			const next = tokens[i++];
			if (next?.kind === "rparen") return { isCall: true, args };
			if (next?.kind !== "comma") throw new Error("expected , or )");
		}
	}

	const first = tokens[0];
	if (!first || first.kind !== "ident") {
		throw new Error("expression must start with an identifier");
	}
	// 根变量必须是上下文自身的属性，杜绝 ${constructor} 这类继承属性
	if (!Object.prototype.hasOwnProperty.call(root, first.value)) {
		throw new Error(`unknown variable: ${first.value}`);
	}
	let current: unknown = root[first.value];
	i = 1;

	while (i < tokens.length) {
		if (tokens[i]?.kind !== "dot") throw new Error("expected .");
		i++;
		const id = tokens[i++];
		if (!id || id.kind !== "ident") {
			throw new Error("expected property name after .");
		}
		if (BLOCKED_PROPERTIES.has(id.value)) {
			throw new Error(`blocked property: ${id.value}`);
		}
		const { isCall, args } = parseArgs();
		if (current === undefined || current === null) return undefined;
		const receiver = current as Record<string, unknown>;
		if (isCall) {
			const fn = receiver[id.value];
			if (typeof fn !== "function") {
				throw new Error(`${id.value} is not a function`);
			}
			current = (fn as (...fnArgs: unknown[]) => unknown).apply(
				receiver,
				args
			);
		} else {
			current = receiver[id.value];
		}
	}
	return current;
}

/**
 * 求值失败（语法越界、未知变量、运行时异常）统一返回 undefined，
 * 由调用方决定兜底行为（原样保留占位符）。
 */
export function safeEvaluate(
	expr: string,
	root: Record<string, unknown>
): unknown {
	const tokens = tokenize(expr);
	if (!tokens || tokens.length === 0) return undefined;
	try {
		return evaluate(tokens, root);
	} catch {
		return undefined;
	}
}
