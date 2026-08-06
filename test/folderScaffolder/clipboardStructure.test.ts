import {
	FOLDER_STRUCTURE_FENCE,
	parseStructure,
	serializeStructure,
} from "@src/toolkit/folderScaffolder/service/clipboardStructure";

describe("serializeStructure", () => {
	it("生成带专属语言标识的围栏代码块", () => {
		const out = serializeStructure(["材料", "材料/原始", "复盘"]);
		expect(out).toBe(
			"```" +
				FOLDER_STRUCTURE_FENCE +
				"\n材料\n材料/原始\n复盘\n```"
		);
	});

	it("过滤空串与空白路径", () => {
		const out = serializeStructure(["", "  ", "材料/原始"]);
		expect(out).toContain("材料/原始");
		expect(out).not.toContain("`````\n\n```");
	});

	it("剔除路径中的非法文件名字符", () => {
		const out = serializeStructure(["a:b*c", 'd?e']);
		expect(out).not.toContain(":");
		expect(out).not.toContain("*");
		expect(out).not.toContain("?");
	});
});

describe("parseStructure", () => {
	it("往返：serialize 再 parse 得到相同数组", () => {
		const paths = ["材料", "材料/原始", "材料/复盘", "复盘"];
		const parsed = parseStructure(serializeStructure(paths));
		expect(parsed).toEqual(paths);
	});

	it("从带噪音的文本中提取结构（代码块前后有其它内容）", () => {
		const text =
			"这是我的笔记\n\n```" +
			FOLDER_STRUCTURE_FENCE +
			"\n材料\n复盘\n```\n\n其它文字";
		expect(parseStructure(text)).toEqual(["材料", "复盘"]);
	});

	it("裁剪每行首尾空白", () => {
		const block = "```" + FOLDER_STRUCTURE_FENCE + "\n  材料/原始  \n复盘\n```";
		expect(parseStructure(block)).toEqual(["材料/原始", "复盘"]);
	});

	it("非本插件格式返回 null", () => {
		expect(parseStructure("```json\n{}\n```")).toBeNull();
		expect(parseStructure("随便一段文字没有代码块")).toBeNull();
		expect(parseStructure("")).toBeNull();
	});

	it("有标识但内容为空返回 null", () => {
		expect(parseStructure("```" + FOLDER_STRUCTURE_FENCE + "\n\n```")).toBeNull();
	});
});
