import {
	DndContext,
	DragEndEvent,
	DragOverlay,
	DragStartEvent,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LL } from "@src/i18n/i18n";
import { useEffect, useRef, useState } from "react";
import { flatPathsFromTree, TreeNode } from "../service/StructureBuilder";
import { Icon } from "./Icon";

/**
 * 可编辑树节点。相比 service 层的纯 TreeNode，多一个稳定 id（用于 DnD 与 React key）。
 * path 是派生量（每次树变更后由 recomputePaths 重算），不作为身份。
 */
export interface EditableNode {
	id: string;
	name: string;
	/** 相对根的完整路径（派生，变更后重算）；根节点为 "" */
	path: string;
	children: EditableNode[];
}

/** 拖拽落点三态：成为目标的同级（前/后）或子节点 */
export type DropPosition = "before" | "after" | "inside";

interface DropIndicator {
	id: string;
	position: DropPosition;
}

interface Props {
	/** 模板的 flat 相对路径快照 */
	snapshot: string[];
	/** 编辑后回写新的 flat 快照 */
	onChange: (snapshot: string[]) => void;
}

/**
 * 模板结构的可视化树编辑器（React 岛）：
 * - 嵌套树形展示（竖向引导线 + 横向连接线，纯 CSS）；
 * - 每个节点名称为常驻输入框，失焦/回车即重命名；每节点可加子文件夹、删除；
 * - 拖拽手柄移动节点，支持三态落点：
 *   · before / after —— 与目标成为同级，插到目标前/后（调整顺序）；
 *   · inside        —— 成为目标的子节点（调整层级）；
 *   禁止拖入自身或自身后代（否则形成环）。
 *
 * 内部以带 id 的 EditableNode 树为唯一状态来源；每次变更后 flatPathsFromTree
 * 回写 snapshot。snapshot 外部变化时重建树（id 重新生成）。
 *
 * 数据流：root 集中在顶层组件，所有变更经纯 helper（接收 root + id）产出新 root，
 * 子组件只负责派发动作（onRename/onAddChild/onRemove），不持有树状态。
 */
export function StructureTreeEditor({ snapshot, onChange }: Props) {
	const [root, setRoot] = useState<EditableNode>(() =>
		buildEditableTree(snapshot)
	);
	/**
	 * 最近一次由本组件回写出去的 flat 快照。用于区分「自己的编辑回流」与
	 * 「外部改动」（如从 vault 导入刷新）：只有当传入 snapshot 与之不同，
	 * 才认为是外部改动并重建树，避免每次按键都重建、打断编辑态。
	 */
	const lastEmitted = useRef<string[]>(snapshot);
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
	);
	const T = LL.settings.folder_scaffolder.templateCard;

	// 拖拽过程态：当前落点指示（用于高亮）、被拖节点（用于 DragOverlay）
	const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(
		null
	);
	const [activeId, setActiveId] = useState<string | null>(null);

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

	/** 由拖拽事件解析落点（over 节点 + before/after/inside） */
	const resolveDrop = (
		event: DragEndEvent
	): { overId: string; position: DropPosition } | null => {
		const { active, over } = event;
		if (!over || active.id === over.id) return null;
		const overRect = over.rect;
		const activator = event.activatorEvent as PointerEvent;
		// 光标真实 Y = 抓取点 Y + 位移；PointerSensor 的 activatorEvent 即按下时的指针事件
		const pointerY =
			typeof activator?.clientY === "number"
				? activator.clientY + event.delta.y
				: overRect.top + overRect.height / 2;
		// 上半 25% → before；下半 25% → after；中间 50% → inside
		const threshold = overRect.height * 0.25;
		const relativeY = pointerY - overRect.top;
		let position: DropPosition;
		if (relativeY < threshold) position = "before";
		else if (relativeY > overRect.height - threshold) position = "after";
		else position = "inside";
		return { overId: String(over.id), position };
	};

	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(String(event.active.id));
	};

	const handleDragOver = (event: DragEndEvent) => {
		const drop = resolveDrop(event);
		setDropIndicator(drop ? { id: drop.overId, position: drop.position } : null);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const drop = resolveDrop(event);
		const activeIdStr = String(event.active.id);
		setActiveId(null);
		setDropIndicator(null);
		if (!drop) return;
		// 禁止拖入自身或自身后代（否则形成环）
		if (isDescendant(root, activeIdStr, drop.overId)) return;
		const next = moveNode(
			cloneEditable(root),
			activeIdStr,
			drop.overId,
			drop.position
		);
		if (next) apply(next);
	};

	const handleDragCancel = () => {
		setActiveId(null);
		setDropIndicator(null);
	};

	const activeNode = activeId ? findNode(root, activeId) : undefined;

	return (
		<div className="rht-fs-tree">
			<div className="rht-fs-tree-head">
				<span className="rht-fs-tree-title">{T.structure.name()}</span>
				<button
					className="rht-fs-text-btn mod-cta"
					type="button"
					onClick={addRootChild}
				>
					<Icon name="plus" />
					{T.addRootFolder()}
				</button>
			</div>

			{root.children.length === 0 ? (
				<div className="rht-fs-tree-empty">{T.structure.empty()}</div>
			) : (
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragStart={handleDragStart}
					onDragOver={handleDragOver}
					onDragEnd={handleDragEnd}
					onDragCancel={handleDragCancel}
				>
					<NodeList
						parent={root}
						dropIndicator={dropIndicator}
						onRename={(id, name) => apply(renameNode(root, id, name))}
						onAddChild={(id) => apply(addChild(root, id))}
						onRemove={(id) => apply(removeNode(root, id))}
					/>
					<DragOverlay>
						{activeNode ? (
							<div className="rht-fs-tree-line rht-fs-tree-overlay">
								<Icon name="folder" />
								<span className="rht-fs-tree-overlay-name">
									{activeNode.name}
								</span>
							</div>
						) : null}
					</DragOverlay>
				</DndContext>
			)}
		</div>
	);
}

// ---- 递归渲染：一层子节点列表 ----

interface NodeListProps {
	parent: EditableNode;
	dropIndicator: DropIndicator | null;
	onRename: (id: string, name: string) => void;
	onAddChild: (id: string) => void;
	onRemove: (id: string) => void;
}

function NodeList({
	parent,
	dropIndicator,
	onRename,
	onAddChild,
	onRemove,
}: NodeListProps) {
	const ids = parent.children.map((c) => c.id);
	return (
		<SortableContext items={ids} strategy={verticalListSortingStrategy}>
			<ul className="rht-fs-tree-list">
				{parent.children.map((child) => (
					<NodeRow
						key={child.id}
						node={child}
						dropIndicator={
							dropIndicator?.id === child.id
								? dropIndicator.position
								: null
						}
						onRename={onRename}
						onAddChild={onAddChild}
						onRemove={onRemove}
					/>
				))}
			</ul>
		</SortableContext>
	);
}

// ---- 递归渲染：单个节点行 ----

interface NodeRowProps {
	node: EditableNode;
	dropIndicator: DropPosition | null;
	onRename: (id: string, name: string) => void;
	onAddChild: (id: string) => void;
	onRemove: (id: string) => void;
}

function NodeRow({
	node,
	dropIndicator,
	onRename,
	onAddChild,
	onRemove,
}: NodeRowProps) {
	const T = LL.settings.folder_scaffolder.templateCard;
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: node.id });
	// 常驻输入框：本地草稿驱动输入，仅在失焦/回车时回写树，避免每次按键重建树打断焦点
	const [draft, setDraft] = useState(node.name);

	// 外部改动（拖拽、导入刷新等）导致的 name 变化同步进草稿
	useEffect(() => {
		setDraft(node.name);
	}, [node.name]);

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const commitName = () => {
		const trimmed = draft.trim();
		if (trimmed && trimmed !== node.name) {
			onRename(node.id, trimmed);
		} else if (!trimmed) {
			setDraft(node.name); // 空名回退到原值
		}
	};

	const dropClass = dropIndicator
		? ` drop-${dropIndicator}`
		: "";

	return (
		<li ref={setNodeRef} className="rht-fs-tree-row" style={style}>
			<div
				className={`rht-fs-tree-line${isDragging ? " is-dragging" : ""}${dropClass}`}
			>
				<button
					className="rht-fs-tree-handle"
					type="button"
					aria-label={T.dragHint()}
					title={T.dragHint()}
					{...attributes}
					{...listeners}
				>
					<Icon name="grip-vertical" />
				</button>
				<Icon name="folder" />
				<input
					className="rht-fs-tree-input"
					spellCheck={false}
					value={draft}
					aria-label={T.renameHint()}
					onChange={(e) => setDraft(e.target.value)}
					onBlur={commitName}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							commitName();
							e.currentTarget.blur();
						}
						if (e.key === "Escape") {
							setDraft(node.name);
							e.currentTarget.blur();
						}
					}}
				/>
				<span className="rht-fs-tree-actions">
					<button
						className="rht-fs-icon-btn"
						type="button"
						onClick={() => onAddChild(node.id)}
						aria-label={T.addFolder()}
						title={T.addFolder()}
					>
						<Icon name="folder-plus" />
					</button>
					<button
						className="rht-fs-icon-btn rht-fs-danger"
						type="button"
						onClick={() => onRemove(node.id)}
						aria-label={LL.common.delete()}
						title={LL.common.delete()}
					>
						<Icon name="trash" />
					</button>
				</span>
			</div>
			{node.children.length > 0 && (
				<NodeList
					parent={node}
					dropIndicator={null}
					onRename={onRename}
					onAddChild={onAddChild}
					onRemove={onRemove}
				/>
			)}
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
function renameNode(root: EditableNode, id: string, name: string): EditableNode {
	const next = cloneEditable(root);
	const target = findNode(next, id);
	if (target) target.name = name;
	return next;
}

/**
 * 把 activeId 节点移动到 overId 处。
 * - position === "inside"：作为 overId 的最后一个子节点；
 * - position === "before"/"after"：作为 overId 的同级，插到其前/后。
 * 调用方需先保证 activeId 不是 overId 的后代（避免成环）。
 */
function moveNode(
	root: EditableNode,
	activeId: string,
	overId: string,
	position: DropPosition
): EditableNode | null {
	// 从原父摘除（原地修改 root，返回被摘除子树）
	const subtree = detach(root, activeId);
	if (!subtree) return null;
	const target = findNode(root, overId);
	if (!target) return null; // overId 已被摘除（属于 active 子树）→ 不移动

	if (position === "inside") {
		target.children.push(subtree);
		return root;
	}

	// before / after：找到 overId 的父节点与下标，插入同级
	const parent = findParent(root, overId);
	if (!parent) return null; // 理论上不会发生（root 不会被拖拽）
	const idx = parent.children.findIndex((c) => c.id === overId);
	if (idx < 0) return null;
	const insertAt = position === "before" ? idx : idx + 1;
	parent.children.splice(insertAt, 0, subtree);
	return root;
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

function findNode(
	root: EditableNode,
	id: string
): EditableNode | undefined {
	if (root.id === id) return root;
	for (const c of root.children) {
		const found = findNode(c, id);
		if (found) return found;
	}
	return undefined;
}

/** 返回 children 中包含 id 的直接父节点（找不到返回 null） */
function findParent(
	root: EditableNode,
	id: string
): EditableNode | null {
	for (const c of root.children) {
		if (c.id === id) return root;
		const found = findParent(c, id);
		if (found) return found;
	}
	return null;
}

/** 从树中摘除 id 节点（返回被摘除的子树），原地修改 root */
function detach(
	root: EditableNode,
	id: string
): EditableNode | null {
	for (let i = 0; i < root.children.length; i++) {
		if (root.children[i].id === id) {
			return root.children.splice(i, 1)[0];
		}
	}
	for (const c of root.children) {
		const found = detach(c, id);
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

/** overId 是否是 activeId 的（含自身）后代 —— 用于禁止循环拖拽 */
function isDescendant(
	root: EditableNode,
	activeId: string,
	overId: string
): boolean {
	const active = findNode(root, activeId);
	if (!active) return false;
	if (activeId === overId) return true;
	const contains = (node: EditableNode, id: string): boolean =>
		node.id === id || node.children.some((c) => contains(c, id));
	return contains(active, overId);
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
