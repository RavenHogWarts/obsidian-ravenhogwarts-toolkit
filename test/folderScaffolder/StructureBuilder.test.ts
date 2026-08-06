import {
	buildTargetPaths,
	filterNonExistent,
	flatPathsFromTree,
	normalize,
	treeFromFlatPaths,
	__walkForTest,
	TreeNode,
} from "@src/toolkit/folderScaffolder/service/StructureBuilder";

/** 构造树节点便利函数 */
function node(name: string, path: string, children: TreeNode[] = []): TreeNode {
	return { name, path, children };
}

describe("normalize", () => {
	it("折叠重复斜杠", () => {
		expect(normalize("a//b///c")).toBe("a/b/c");
	});
	it("去首尾斜杠", () => {
		expect(normalize("/a/b/")).toBe("a/b");
	});
	it("反斜杠转正斜杠", () => {
		expect(normalize("a\\b\\c")).toBe("a/b/c");
	});
	it("空串保持空", () => {
		expect(normalize("")).toBe("");
	});
});

describe("walkSubPaths (collectSubPaths 的纯内核)", () => {
	it("空目录返回空数组", () => {
		const root = node("tpl", "tpl", []);
		expect(__walkForTest(root)).toEqual([]);
	});

	it("扁平子目录", () => {
		const root = node("tpl", "tpl", [
			node("材料", "tpl/材料"),
			node("复盘", "tpl/复盘"),
			node("标准笔记", "tpl/标准笔记"),
		]);
		// 同层按 name 的 localeCompare 排序：标准笔记 < 材料 < 复盘
		expect(__walkForTest(root)).toEqual(["标准笔记", "材料", "复盘"]);
	});

	it("嵌套子目录：父先于子", () => {
		const root = node("tpl", "tpl", [
			node("材料", "tpl/材料", [
				node("原始", "tpl/材料/原始"),
				node("整理", "tpl/材料/整理"),
			]),
			node("复盘", "tpl/复盘"),
		]);
		// 广度优先 + 同层 localeCompare：材料 < 复盘；下一层 原始 < 整理
		expect(__walkForTest(root)).toEqual([
			"材料",
			"复盘",
			"材料/原始",
			"材料/整理",
		]);
		// 父先于子约束
		const paths = __walkForTest(root);
		const parentIdx = paths.indexOf("材料");
		const childIdx = paths.indexOf("材料/原始");
		expect(parentIdx).toBeLessThan(childIdx);
	});

	it("vault 根目录作为源（path 为空）", () => {
		const root = node("", "", [
			node("A", "A", [node("B", "A/B")]),
		]);
		expect(__walkForTest(root)).toEqual(["A", "A/B"]);
	});

	it("不含 root 自身", () => {
		const root = node("tpl", "tpl", [node("a", "tpl/a")]);
		expect(__walkForTest(root)).not.toContain("tpl");
	});
});

describe("buildTargetPaths", () => {
	it("拼接 targetParent 前缀", () => {
		expect(
			buildTargetPaths(["材料", "材料/原始", "复盘"], "proj")
		).toEqual(["proj/材料", "proj/材料/原始", "proj/复盘"]);
	});

	it("透传父先于子的顺序", () => {
		const paths = buildTargetPaths(["a", "a/b", "a/b/c"], "root");
		expect(paths).toEqual(["root/a", "root/a/b", "root/a/b/c"]);
		expect(paths.indexOf("root/a")).toBeLessThan(paths.indexOf("root/a/b"));
	});

	it("targetParent 为空（vault 根）", () => {
		expect(buildTargetPaths(["a", "a/b"], "")).toEqual(["a", "a/b"]);
	});

	it("折叠多余斜杠", () => {
		expect(buildTargetPaths(["a"], "x//")).toEqual(["x/a"]);
		expect(buildTargetPaths(["a"], "/x/")).toEqual(["x/a"]);
	});

	it("空输入返回空", () => {
		expect(buildTargetPaths([], "proj")).toEqual([]);
	});
});

describe("filterNonExistent", () => {
	it("过滤掉 exists 返回 true 的路径", () => {
		const existing = new Set(["proj/复盘"]);
		const result = filterNonExistent(
			["proj/材料", "proj/复盘", "proj/标准笔记"],
			(p) => existing.has(p)
		);
		expect(result).toEqual(["proj/材料", "proj/标准笔记"]);
	});

	it("全部不存在时原样返回", () => {
		const result = filterNonExistent(["a", "b"], () => false);
		expect(result).toEqual(["a", "b"]);
	});

	it("全部已存在时返回空", () => {
		const result = filterNonExistent(["a", "b"], () => true);
		expect(result).toEqual([]);
	});

	it("空输入返回空", () => {
		expect(filterNonExistent([], () => false)).toEqual([]);
	});
});

describe("treeFromFlatPaths", () => {
	it("空数组 → 仅根节点", () => {
		const root = treeFromFlatPaths([]);
		expect(root.path).toBe("");
		expect(root.name).toBe("");
		expect(root.children).toEqual([]);
	});

	it("扁平路径 → 同层子节点（按 name 排序）", () => {
		const root = treeFromFlatPaths(["复盘", "材料", "标准笔记"]);
		expect(root.children.map((c) => c.path)).toEqual([
			"标准笔记",
			"材料",
			"复盘",
		]);
	});

	it("嵌套路径 → 正确父子关系", () => {
		const root = treeFromFlatPaths(["材料/原始", "材料", "复盘"]);
		const 材料 = root.children.find((c) => c.name === "材料");
		expect(材料).toBeDefined();
		expect(材料!.children.map((c) => c.path)).toEqual(["材料/原始"]);
		expect(材料!.path).toBe("材料");
		expect(材料!.children[0].path).toBe("材料/原始");
	});

	it("节点 path 字段为相对根的完整路径", () => {
		const root = treeFromFlatPaths(["a/b/c"]);
		expect(root.children[0].path).toBe("a");
		expect(root.children[0].children[0].path).toBe("a/b");
		expect(root.children[0].children[0].children[0].path).toBe("a/b/c");
	});

	it("乱序输入仍正确建树（子先于父）", () => {
		const root = treeFromFlatPaths(["a/b/c", "a", "a/b"]);
		expect(flatPathsFromTree(root).sort()).toEqual(["a", "a/b", "a/b/c"]);
	});

	it("重复路径自动去重", () => {
		const root = treeFromFlatPaths(["a", "a", "a/b", "a/b"]);
		expect(flatPathsFromTree(root)).toEqual(["a", "a/b"]);
	});

	it("空串路径被跳过", () => {
		const root = treeFromFlatPaths(["", "a", ""]);
		expect(root.children.map((c) => c.path)).toEqual(["a"]);
	});
});

describe("flatPathsFromTree", () => {
	it("空树 → 空数组", () => {
		expect(flatPathsFromTree(treeFromFlatPaths([]))).toEqual([]);
	});

	it("父先于子（前序）", () => {
		const paths = flatPathsFromTree(treeFromFlatPaths(["a/b/c", "a", "a/b"]));
		const aIdx = paths.indexOf("a");
		const abIdx = paths.indexOf("a/b");
		const abcIdx = paths.indexOf("a/b/c");
		expect(aIdx).toBeLessThan(abIdx);
		expect(abIdx).toBeLessThan(abcIdx);
	});
});

describe("tree ↔ flat round-trip", () => {
	/**
	 * 计算一个路径数组的「父闭包」：每个路径的所有祖先段都被补全。
	 * 这是 round-trip 的正确契约——snapshot 是 flat 列表，父文件夹隐含存在
	 * （克隆时 createFolder(a/b) 自动建出 a），故 tree 重建后会把隐含父节点显式化。
	 */
	function parentClosure(paths: string[]): string[] {
		const set = new Set<string>();
		for (const p of paths) {
			const segs = p.split("/").filter(Boolean);
			let acc = "";
			for (const s of segs) {
				acc = acc === "" ? s : `${acc}/${s}`;
				set.add(acc);
			}
		}
		return [...set].sort();
	}

	const cases: string[][] = [
		[],
		["材料", "复盘", "标准笔记"],
		["材料/原始", "材料", "复盘"],
		["a/b/c", "a", "a/b", "x/y"],
		["项目/材料/原始", "项目/材料", "项目", "项目/复盘"],
		["x/y"], // 仅叶子 → round-trip 后补出 x
	];

	for (const [idx, input] of cases.entries()) {
		it(`round-trip = 父闭包 #${idx}: ${JSON.stringify(input)}`, () => {
			const tree = treeFromFlatPaths(input);
			const back = flatPathsFromTree(tree);
			expect([...back].sort()).toEqual(parentClosure(input));
		});
	}

	it("父闭包幂等：二次 round-trip 稳定", () => {
		const input = ["a/b/c", "x/y"];
		const once = flatPathsFromTree(treeFromFlatPaths(input));
		const twice = flatPathsFromTree(treeFromFlatPaths(once));
		expect([...twice].sort()).toEqual([...once].sort());
	});
});
