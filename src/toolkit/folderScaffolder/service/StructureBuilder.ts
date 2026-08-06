import { TFolder } from "obsidian";

/**
 * 归一化路径：折叠重复斜杠、去首尾斜杠（obsidian normalizePath 的纯实现）。
 * 让本模块的纯字符串逻辑可脱离 Obsidian 单测。
 */
export function normalize(path: string): string {
	return path
		.replace(/\\/g, "/")
		.replace(/\/+/g, "/")
		.replace(/^\/|\/$/g, "");
}

/**
 * 计算 fullPath 相对 rootPath 的子路径（去前缀）。
 * rootPath 为空（vault 根）时直接返回 fullPath。
 * 两者之间必须以 rootPath 为前缀；否则原样返回 fullPath。
 */
function relativeTo(rootPath: string, fullPath: string): string {
	if (rootPath === "") return fullPath;
	const prefix = `${rootPath}/`;
	return fullPath.startsWith(prefix) ? fullPath.slice(prefix.length) : fullPath;
}

/** 可遍历的文件夹树节点（鸭子类型，便于单测构造 stub 而不依赖 obsidian 运行时） */
export interface TreeNode {
	name: string;
	path: string;
	children: TreeNode[];
}

/**
 * 纯树遍历：收集所有子节点的相对路径（去 rootPath 前缀）。
 * 广度优先 + 同层按 name 排序，保证「父先于子」且输出稳定可测。
 * 不含 root 自身。
 */
function walkSubPaths(root: TreeNode): string[] {
	const result: string[] = [];
	const queue: TreeNode[] = [root];
	while (queue.length > 0) {
		const current = queue.shift()!;
		const subs = [...current.children].sort((a, b) =>
			a.name.localeCompare(b.name)
		);
		for (const sub of subs) {
			result.push(relativeTo(root.path, sub.path));
			queue.push(sub);
		}
	}
	return result;
}

/**
 * 收集一个文件夹下所有子文件夹的相对路径（含嵌套）。
 * 只收集目录，不收集文件（首期范围）。
 *
 * 返回顺序保证「父目录先于子目录」：广度优先遍历，
 * 使调用方逐个 createFolder 时嵌套目录的父级总是已存在。
 * 不含 folder 自身。
 *
 * @param folder 源模板文件夹
 */
export function collectSubPaths(folder: TFolder): string[] {
	return walkSubPaths({
		name: folder.name,
		path: folder.path,
		// 仅 TFolder 子节点进入遍历，TFile 被过滤；用 path 区分相对路径
		children: folder.children
			.filter((child): child is TFolder => child instanceof TFolder)
			.map((child) => toTreeNode(child)),
	});
}

/** 递归把 TFolder 转成 TreeNode（过滤文件，仅保留文件夹） */
function toTreeNode(folder: TFolder): TreeNode {
	return {
		name: folder.name,
		path: folder.path,
		children: folder.children
			.filter((child): child is TFolder => child instanceof TFolder)
			.map((child) => toTreeNode(child)),
	};
}

/**
 * 把源子路径拼接到目标父目录下，得到实际要创建的 vault 路径列表。
 * 透传输入顺序（父先于子）。
 *
 * @param subPaths collectSubPaths 的返回
 * @param targetParent 目标父目录（vault 绝对路径，空串表示 vault 根）
 */
export function buildTargetPaths(
	subPaths: string[],
	targetParent: string
): string[] {
	const parent = normalize(targetParent);
	return subPaths.map((sub) => normalize(`${parent}/${sub}`));
}

/**
 * 过滤掉目标父目录下已存在的路径，返回真正需要创建的列表。
 * 冲突策略：默认跳过（安全且幂等）。
 *
 * @param targetPaths buildTargetPaths 的返回
 * @param exists 判断路径是否已存在的谓词（注入，便于单测 + 解耦 vault）
 */
export function filterNonExistent(
	targetPaths: string[],
	exists: (path: string) => boolean
): string[] {
	return targetPaths.filter((p) => !exists(p));
}

/** 供单测直接驱动纯树遍历（绕过 obsidian 运行时） */
export const __walkForTest = walkSubPaths;

// ---- flat 路径数组 ↔ 嵌套树（可视化编辑用）----

/**
 * 把 flat 相对路径数组重建为嵌套树（用于设置页可视化编辑）。
 * - 空串路径跳过；空数组 → 仅含根节点。
 * - root 节点 name=""、path=""，其 children 为顶层文件夹。
 * - 同层按 name 的 localeCompare 排序，输出稳定。
 * - 重复路径自动去重（同一路径只建一个节点）。
 *
 * @param paths 相对路径数组（如 ["材料", "材料/原始", "复盘"]）
 */
export function treeFromFlatPaths(paths: string[]): TreeNode {
	const root: TreeNode = { name: "", path: "", children: [] };
	const seen = new Set<string>();

	for (const raw of paths) {
		const path = normalize(raw);
		if (path === "" || seen.has(path)) {
			continue;
		}
		seen.add(path);
		insertPath(root, path);
	}
	sortTree(root);
	return root;
}

/** 沿 path 各段在 root 下逐层建节点（已存在则复用） */
function insertPath(root: TreeNode, path: string): void {
	const segments = path.split("/");
	let current = root;
	let acc = "";
	for (const seg of segments) {
		acc = acc === "" ? seg : `${acc}/${seg}`;
		let next = current.children.find((c) => c.name === seg);
		if (!next) {
			next = { name: seg, path: acc, children: [] };
			current.children.push(next);
		}
		current = next;
	}
}

/** 同层按 name 排序（递归），保证 flatPathsFromTree 输出稳定可测 */
function sortTree(node: TreeNode): void {
	node.children.sort((a, b) => a.name.localeCompare(b.name));
	for (const c of node.children) {
		sortTree(c);
	}
}

/**
 * 把嵌套树拍平为相对路径数组（不含 root 自身）。
 * 前序遍历：父先于子，满足 buildTargetPaths 的顺序约束。
 *
 * @param root treeFromFlatPaths 的返回（或手动构造的树）
 */
export function flatPathsFromTree(root: TreeNode): string[] {
	const result: string[] = [];
	const visit = (node: TreeNode) => {
		for (const child of node.children) {
			result.push(child.path);
			visit(child);
		}
	};
	visit(root);
	return result;
}

