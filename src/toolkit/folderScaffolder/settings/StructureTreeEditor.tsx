import { LL } from "@src/i18n/i18n";
import { useEffect, useRef, useState } from "react";
import { flatPathsFromTree, TreeNode } from "../service/StructureBuilder";
import { Icon } from "./Icon";

/**
 * 可编辑树节点。相比 service 层的纯 TreeNode，多一个稳定 id（用于 React key）。
 * path 是派生量（每次树变更后由 recomputePaths 重算），不作为身份。
 */
export interface EditableNode {
	id: string;
	name: string;
	/** 相对根的完整路径（派生，变更后重算）；根节点为 "" */
	path: string;
	children: EditableNode[];
}

interface Props {
	/** 模板的 flat 相对路径快照 */
	snapshot: string[];
	/** 编辑后回写新的 flat 快照 */
	onChange: (snapshot: string[]) => void;
}

/**
 * 模板结构的可视化树编辑器（React 岛），outliner 式交互：
 * - 整棵树拍平为「单一有序列表 + 每行的 depth」渲染。缩进纯属视觉（depth × 缩进量），
 *   移动逻辑仍基于树。
 * - 四件事全部用显式按钮 + 键盘快捷键，一键确定、无层级歧义：
 *   · 创建       ——「添加子文件夹」（行内）/「添加根文件夹」（头部）
 *   · 创建子集   ——同上
 *   · 移动层级   ——缩进（Indent）/ 外缩（Outdent）
 *   · 移动顺序   ——上移 / 下移（仅当前父内换序，不跨层）
 *   缩进：成为「上一个同级兄弟」的末子节点；外缩：提到父节点的下一个同级。
 * - 双态交互（选中态 / 编辑态）：
 *   · 单击行 → 选中该行（input 变只读并聚焦，快捷键立即可用，无需进入编辑）
 *   · 双击 input / Enter（选中态）→ 进入重命名编辑态
 *   · Enter（编辑态）→ 提交并回到选中态；Esc → 还原并回到选中态
 *   · 快捷键（只读或可编辑 input 聚焦时）：Tab=缩进、Shift+Tab=外缩、
 *     Alt+↑/↓=上下移。结构操作后保持焦点，连续操作不打断。
 *
 * 数据流：root 集中在顶层组件，所有变更经纯 helper（接收 root + id）产出新 root，
 * 子组件只负责派发动作，不持有树状态。selectedId/editingId 同样集中在顶层。
 */

/** 树 → 拍平有序列表（前序遍历，父先于子），记录每行深度用于缩进 */
interface FlatRow {
	node: EditableNode;
	depth: number;
}

function flattenTree(root: EditableNode): FlatRow[] {
	const out: FlatRow[] = [];
	const walk = (node: EditableNode, depth: number) => {
		for (const child of node.children) {
			out.push({ node: child, depth });
			if (child.children.length > 0) walk(child, depth + 1);
		}
	};
	walk(root, 0);
	return out;
}

export function StructureTreeEditor({ snapshot, onChange }: Props) {
	const [root, setRoot] = useState<EditableNode>(() =>
		buildEditableTree(snapshot),
	);
	/** 当前选中行（只读 input 聚焦即选中，快捷键针对此行生效） */
	const [selectedId, setSelectedId] = useState<string | null>(null);
	/** 当前处于重命名编辑态的行（双击/Enter 进入，Enter 提交 / Esc 还原退出） */
	const [editingId, setEditingId] = useState<string | null>(null);
	/**
	 * 最近一次由本组件回写出去的 flat 快照。用于区分「自己的编辑回流」与
	 * 「外部改动」（如从 vault 导入刷新）：只有当传入 snapshot 与之不同，
	 * 才认为是外部改动并重建树，避免每次按键都重建、打断编辑态。
	 */
	const lastEmitted = useRef<string[]>(snapshot);
	const T = LL.settings.folder_scaffolder.templateCard;

	useEffect(() => {
		if (!sameFlatPaths(snapshot, lastEmitted.current)) {
			lastEmitted.current = snapshot;
			setRoot(buildEditableTree(snapshot));
		}
	}, [snapshot]);

	/** 产出新 root、重算路径、回写 snapshot */
	const apply = (next: EditableNode) => {
		recomputePaths(next);
		setRoot(next);
		const flat = flatPathsFromTree(toPlainTree(next));
		lastEmitted.current = flat;
		onChange(flat);
	};

	const addRootChild = () => {
		const next = cloneEditable(root);
		next.children.push(newChild());
		apply(next);
	};

	// 拍平后统一渲染
	const rows = flattenTree(root);

	return (
		<div className="rht-fs-tree">
			<div className="rht-fs-tree-head">
				<div className="rht-fs-tree-head-text">
					<span className="rht-fs-tree-title">
						{T.structure.name()}
					</span>
					<span className="rht-fs-tree-hint">{T.dragHint()}</span>
				</div>
				<button
					className="rht-fs-text-btn mod-cta"
					type="button"
					onClick={addRootChild}
				>
					<Icon name="plus" />
					{T.addRootFolder()}
				</button>
			</div>

			{rows.length === 0 ? (
				<div className="rht-fs-tree-empty">
					<span>{T.structure.empty()}</span>
				</div>
			) : (
					<ul className="rht-fs-tree-list">
						{rows.map(({ node, depth }) => (
							<TreeRow
								key={node.id}
								node={node}
								depth={depth}
								root={root}
								selected={selectedId === node.id}
								editing={editingId === node.id}
								onSelect={(id) => {
									setSelectedId(id);
									setEditingId(null);
								}}
								onStartRename={(id) => {
									setSelectedId(id);
									setEditingId(id);
								}}
								onEndRename={() => setEditingId(null)}
								onRename={(id, name) => {
									apply(renameNode(root, id, name));
									setEditingId(null);
								}}
								onAddChild={(id) => apply(addChild(root, id))}
								onRemove={(id) => {
									if (selectedId === id) setSelectedId(null);
									if (editingId === id) setEditingId(null);
									apply(removeNode(root, id));
								}}
								onIndent={(id) =>
									apply(indentNode(root, id) ?? root)
								}
								onOutdent={(id) =>
									apply(outdentNode(root, id) ?? root)
								}
								onMoveUp={(id) =>
									apply(moveSiblingUp(root, id) ?? root)
								}
								onMoveDown={(id) =>
									apply(moveSiblingDown(root, id) ?? root)
								}
							/>
						))}
					</ul>
			)}
		</div>
	);
}

// ---- 单个节点行（拍平渲染，depth 控制缩进） ----

interface TreeRowProps {
	node: EditableNode;
	depth: number;
	root: EditableNode;
	/** 是否处于选中态（只读 input 聚焦，快捷键针对此行生效） */
	selected: boolean;
	/** 是否处于重命名编辑态（input 可编辑） */
	editing: boolean;
	/** 单击行：选中此行（退出其它行的编辑态） */
	onSelect: (id: string) => void;
	/** 双击 / Enter（选中态）：进入重命名编辑态 */
	onStartRename: (id: string) => void;
	/** 编辑态因失焦退出（非提交）：回到选中态 */
	onEndRename: () => void;
	onRename: (id: string, name: string) => void;
	onAddChild: (id: string) => void;
	onRemove: (id: string) => void;
	onIndent: (id: string) => void;
	onOutdent: (id: string) => void;
	onMoveUp: (id: string) => void;
	onMoveDown: (id: string) => void;
}

function TreeRow({
	node,
	depth,
	root,
	selected,
	editing,
	onSelect,
	onStartRename,
	onEndRename,
	onRename,
	onAddChild,
	onRemove,
	onIndent,
	onOutdent,
	onMoveUp,
	onMoveDown,
}: TreeRowProps) {
	const T = LL.settings.folder_scaffolder.templateCard;
	// 常驻输入框：本地草稿驱动输入，仅在失焦/回车时回写树，避免每次按键重建树打断焦点
	const [draft, setDraft] = useState(node.name);
	const inputRef = useRef<HTMLInputElement>(null);

	// 外部改动（结构操作、导入刷新等）导致的 name 变化同步进草稿
	useEffect(() => {
		setDraft(node.name);
	}, [node.name]);

	// 进入编辑态时主动聚焦 input 并全选，便于整体替换
	useEffect(() => {
		if (editing) {
			const el = inputRef.current;
			if (el) {
				el.focus();
				el.select();
			}
		}
	}, [editing]);

	// 一次性结构操作（缩进/外缩/移动）后，node.name 不变 → 草稿不变；
	// 但 React 重渲后 input DOM 可能失焦，故操作后主动回焦，保证连续键盘操作流畅。
	const keepFocus = () => {
		window.requestAnimationFrame(() => inputRef.current?.focus());
	};

	const style = {
		// 把 depth 透传为 CSS 变量，供缩进 / 连接线定位使用
		"--row-depth": depth,
	} as React.CSSProperties;

	const commitName = () => {
		const trimmed = draft.trim();
		if (trimmed && trimmed !== node.name) {
			onRename(node.id, trimmed);
		} else {
			if (!trimmed) setDraft(node.name); // 空名回退到原值
			onEndRename(); // 无变更也退出编辑态
		}
	};

	// 四项操作的可用性（用于按钮 disabled 灰显）
	const ctx = siblingContext(root, node.id);
	const canIndent = !!ctx && ctx.index > 0;
	const canOutdent = !!ctx && ctx.parent.id !== "__root__";
	const canMoveUp = !!ctx && ctx.index > 0;
	const canMoveDown = !!ctx && ctx.index < ctx.parent.children.length - 1;

	/**
	 * 键盘快捷键（input 聚焦时即生效，不区分只读/可编辑，对齐 Logseq/Workflowy 肌肉记忆）：
	 * - 选中态（只读）：Tab/Shift+Tab 缩进外缩，Alt+↑/↓ 上下移，Enter 进入重命名，Esc 取消选中。
	 * - 编辑态：Enter 提交重命名，Esc 还原并回到选中态；Tab/Alt+↑↓ 同样可做结构操作。
	 * 只读态下 Tab 必须 preventDefault，否则会触发浏览器默认焦点跳转。
	 * 结构操作后 keepFocus() 让连续操作不打断。
	 */
	const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			if (editing) {
				commitName();
			} else {
				onStartRename(node.id);
			}
			return;
		}
		if (e.key === "Escape") {
			e.preventDefault();
			if (editing) {
				setDraft(node.name);
				onEndRename();
			}
			return;
		}
		if (e.key === "Tab") {
			e.preventDefault();
			if (e.shiftKey) {
				if (canOutdent) {
					onOutdent(node.id);
					keepFocus();
				}
			} else {
				if (canIndent) {
					onIndent(node.id);
					keepFocus();
				}
			}
			return;
		}
		if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
			e.preventDefault();
			if (e.key === "ArrowUp" && canMoveUp) {
				onMoveUp(node.id);
				keepFocus();
			} else if (e.key === "ArrowDown" && canMoveDown) {
				onMoveDown(node.id);
				keepFocus();
			}
		}
	};

	return (
		<li
			className={`rht-fs-tree-row${selected ? " is-selected" : ""}${editing ? " is-editing" : ""}`}
			style={style}
		>
			<div
				className={`rht-fs-tree-line${depth > 0 ? " is-nested" : ""}`}
				/* 单击行任意位置：选中此行（若在编辑态则先提交） */
				onMouseDown={(e) => {
					// 点击按钮/输入框自身不触发行选中（由其各自 handler 处理）
					const target = e.target as HTMLElement;
					if (
						target.closest("button") ||
						target === inputRef.current
					)
						return;
					if (!selected) onSelect(node.id);
				}}
			>
				<Icon name="folder" />
				<input
					ref={inputRef}
					className={`rht-fs-tree-input${editing ? " is-editing" : ""}`}
					spellCheck={false}
					/* 选中态：input 只读，显示名称但聚焦后即可用快捷键调整层级/顺序；
					 * 编辑态：可编辑名称。readOnly 让光标不闪、不响应字符输入。 */
					readOnly={!editing}
					value={draft}
					aria-label={T.renameHint()}
					onChange={(e) => setDraft(e.target.value)}
					onFocus={() => {
						if (!editing) onSelect(node.id);
					}}
					onBlur={() => {
						if (editing) commitName();
					}}
					onKeyDown={onKeyDown}
					/* 双击进入重命名编辑态 */
					onDoubleClick={() => onStartRename(node.id)}
				/>
				<span className="rht-fs-tree-move">
					<button
						className="rht-fs-icon-btn clickable-icon"
						type="button"
						onClick={() => {
							onIndent(node.id);
							keepFocus();
						}}
						disabled={!canIndent}
						aria-label={T.indent()}
						title={T.indent()}
					>
						<Icon name="corner-down-right" />
					</button>
					<button
						className="rht-fs-icon-btn clickable-icon"
						type="button"
						onClick={() => {
							onOutdent(node.id);
							keepFocus();
						}}
						disabled={!canOutdent}
						aria-label={T.outdent()}
						title={T.outdent()}
					>
						<Icon name="corner-up-left" />
					</button>
					<button
						className="rht-fs-icon-btn clickable-icon"
						type="button"
						onClick={() => {
							onMoveUp(node.id);
							keepFocus();
						}}
						disabled={!canMoveUp}
						aria-label={LL.common.moveUp()}
						title={LL.common.moveUp()}
					>
						<Icon name="arrow-up" />
					</button>
					<button
						className="rht-fs-icon-btn clickable-icon"
						type="button"
						onClick={() => {
							onMoveDown(node.id);
							keepFocus();
						}}
						disabled={!canMoveDown}
						aria-label={LL.common.moveDown()}
						title={LL.common.moveDown()}
					>
						<Icon name="arrow-down" />
					</button>
				</span>
				<span className="rht-fs-tree-actions">
					<button
						className="rht-fs-icon-btn clickable-icon"
						type="button"
						onClick={() => onAddChild(node.id)}
						aria-label={T.addFolder()}
						title={T.addFolder()}
					>
						<Icon name="folder-plus" />
					</button>
					<button
						className="rht-fs-icon-btn clickable-icon rht-fs-danger"
						type="button"
						onClick={() => onRemove(node.id)}
						aria-label={LL.common.delete()}
						title={LL.common.delete()}
					>
						<Icon name="trash" />
					</button>
				</span>
			</div>
		</li>
	);
}

// ---- 纯树操作 helper（接收当前 root + id，返回新 root；均不修改入参）----

/** 在 id 节点下新增一个子文件夹 */
function addChild(root: EditableNode, id: string): EditableNode {
	const next = cloneEditable(root);
	const target = findNode(next, id);
	target?.children.push(newChild());
	return next;
}

/** 删除 id 节点（及其子树） */
function removeNode(root: EditableNode, id: string): EditableNode {
	const next = cloneEditable(root);
	removeFromParent(next, id);
	return next;
}

/** 重命名 id 节点 */
function renameNode(
	root: EditableNode,
	id: string,
	name: string,
): EditableNode {
	const next = cloneEditable(root);
	const target = findNode(next, id);
	if (target) target.name = name;
	return next;
}

/**
 * id 的「兄弟上下文」：直接父、在父中的下标、祖父、父在祖父中的下标。
 * 所有缩进/外缩/换序操作的判定与执行都以此为统一基础，避免重复遍历。
 * 找不到（id 不在树中）返回 null。
 */
interface SiblingContext {
	parent: EditableNode;
	index: number;
	grandparent: EditableNode | null;
	parentIndex: number;
}

function siblingContext(root: EditableNode, id: string): SiblingContext | null {
	const parent = findParent(root, id);
	if (!parent) return null;
	const index = parent.children.findIndex((c) => c.id === id);
	if (index < 0) return null;
	let grandparent: EditableNode | null = null;
	let parentIndex = -1;
	if (parent.id !== "__root__") {
		grandparent = findParent(root, parent.id);
		if (grandparent) {
			parentIndex = grandparent.children.findIndex(
				(c) => c.id === parent.id,
			);
		}
	}
	return { parent, index, grandparent, parentIndex };
}

/**
 * 缩进：成为「上一个同级兄弟」的末子节点。
 * index === 0（没有上一个兄弟）→ 返回 null（不可缩进）。
 */
function indentNode(root: EditableNode, id: string): EditableNode | null {
	const next = cloneEditable(root);
	const ctx = siblingContext(next, id);
	if (!ctx || ctx.index <= 0) return null;
	const subtree = ctx.parent.children.splice(ctx.index, 1)[0];
	const prevSibling = ctx.parent.children[ctx.index - 1];
	prevSibling.children.push(subtree);
	return next;
}

/**
 * 外缩：成为父节点的下一个同级兄弟（提到父级一层）。
 * 父为根 → 返回 null（不可外缩）。
 */
function outdentNode(root: EditableNode, id: string): EditableNode | null {
	const next = cloneEditable(root);
	const ctx = siblingContext(next, id);
	if (!ctx || !ctx.grandparent || ctx.parentIndex < 0) return null;
	const subtree = ctx.parent.children.splice(ctx.index, 1)[0];
	ctx.grandparent.children.splice(ctx.parentIndex + 1, 0, subtree);
	return next;
}

/** 上移：在当前父的 children 内与前一个兄弟交换。已在最前 → null。 */
function moveSiblingUp(root: EditableNode, id: string): EditableNode | null {
	const next = cloneEditable(root);
	const ctx = siblingContext(next, id);
	if (!ctx || ctx.index <= 0) return null;
	const arr = ctx.parent.children;
	[arr[ctx.index - 1], arr[ctx.index]] = [arr[ctx.index], arr[ctx.index - 1]];
	return next;
}

/** 下移：在当前父的 children 内与后一个兄弟交换。已在最后 → null。 */
function moveSiblingDown(root: EditableNode, id: string): EditableNode | null {
	const next = cloneEditable(root);
	const ctx = siblingContext(next, id);
	if (!ctx || ctx.index >= ctx.parent.children.length - 1) return null;
	const arr = ctx.parent.children;
	[arr[ctx.index], arr[ctx.index + 1]] = [arr[ctx.index + 1], arr[ctx.index]];
	return next;
}

// ---- 底层树工具 ----

function newChild(): EditableNode {
	return {
		id: crypto.randomUUID(),
		name: LL.settings.folder_scaffolder.templateCard.newFolderName(),
		path: "",
		children: [],
	};
}

/** 两个 flat 路径数组是否等价（去重 + 排序后逐项相等，顺序无关） */
function sameFlatPaths(a: string[], b: string[]): boolean {
	const norm = (xs: string[]) => [...new Set(xs)].sort();
	const sa = norm(a);
	const sb = norm(b);
	if (sa.length !== sb.length) return false;
	return sa.every((v, i) => v === sb[i]);
}

/** 深拷贝（结构变更前的统一入口，保证不修改当前 state） */
function cloneEditable(node: EditableNode): EditableNode {
	return {
		id: node.id,
		name: node.name,
		path: node.path,
		children: node.children.map(cloneEditable),
	};
}

function findNode(root: EditableNode, id: string): EditableNode | undefined {
	if (root.id === id) return root;
	for (const c of root.children) {
		const found = findNode(c, id);
		if (found) return found;
	}
	return undefined;
}

/** 返回 children 中包含 id 的直接父节点（找不到返回 null） */
function findParent(root: EditableNode, id: string): EditableNode | null {
	for (const c of root.children) {
		if (c.id === id) return root;
		const found = findParent(c, id);
		if (found) return found;
	}
	return null;
}

function removeFromParent(root: EditableNode, id: string): void {
	const idx = root.children.findIndex((c) => c.id === id);
	if (idx >= 0) {
		root.children.splice(idx, 1);
		return;
	}
	for (const c of root.children) removeFromParent(c, id);
}

/** 递归重算每个节点的 path（相对 root） */
function recomputePaths(root: EditableNode): void {
	const visit = (node: EditableNode, acc: string) => {
		node.path = acc;
		for (const c of node.children) {
			visit(c, acc === "" ? c.name : `${acc}/${c.name}`);
		}
	};
	for (const c of root.children) visit(c, c.name);
}

/** EditableNode → service 层纯 TreeNode（仅用于 flatPathsFromTree） */
function toPlainTree(node: EditableNode): TreeNode {
	return {
		name: node.name,
		path: node.path,
		children: node.children.map(toPlainTree),
	};
}

// ---- flat snapshot ↔ EditableNode 树 ----

/**
 * flat 路径数组 → 带稳定 id 的可编辑树。
 * 用 path 作 seed 生成确定性 id（同一模板每次重建 id 一致，避免无谓 diff）。
 */
function buildEditableTree(paths: string[]): EditableNode {
	const root: EditableNode = {
		id: "__root__",
		name: "",
		path: "",
		children: [],
	};
	const insert = (path: string) => {
		const segments = path.split("/").filter(Boolean);
		if (segments.length === 0) return;
		let current = root;
		let acc = "";
		for (const seg of segments) {
			acc = acc === "" ? seg : `${acc}/${seg}`;
			let next = current.children.find((c) => c.name === seg);
			if (!next) {
				next = {
					id: deterministicId(acc),
					name: seg,
					path: acc,
					children: [],
				};
				current.children.push(next);
			}
			current = next;
		}
	};
	for (const p of paths) insert(p);
	// 同层排序，输出稳定
	const sortRec = (n: EditableNode) => {
		n.children.sort((a, b) => a.name.localeCompare(b.name));
		n.children.forEach(sortRec);
	};
	sortRec(root);
	return root;
}

/** 基于 path 生成确定性 id（同一结构重建得到相同 id） */
function deterministicId(path: string): string {
	// crypto.randomUUID 是随机的，不适合确定性需求；
	// 用 path 前缀 + 简短 hash 保证唯一且稳定
	return `node-${path}`;
}
