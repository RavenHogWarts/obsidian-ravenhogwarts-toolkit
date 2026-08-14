import {
	findMatchingRule,
	normalize,
} from "@src/toolkit/folderTemplates/service/RuleMatcher";
import {
	IFolderTemplateRule,
	TemplateScope,
} from "@src/toolkit/folderTemplates/types";

let idCounter = 0;
const nextId = () => `id-${idCounter++}`;

function rule(
	scopes: TemplateScope[],
	overrides: Partial<IFolderTemplateRule> = {}
): IFolderTemplateRule {
	return {
		id: nextId(),
		enabled: true,
		scopes,
		templateFile: "tpl.md",
		renameFormat: "",
		applyMode: "empty-only",
		...overrides,
	};
}

const folderScope = (
	path: string,
	includeSubfolders = true
): TemplateScope => ({
	id: nextId(),
	type: "FOLDER",
	path,
	includeSubfolders,
});

describe("normalize", () => {
	it("strips leading/trailing slashes and collapses separators", () => {
		expect(normalize("/a/b/")).toBe("a/b");
		expect(normalize("a\\b")).toBe("a/b");
		expect(normalize("a//b")).toBe("a/b");
		expect(normalize("/")).toBe("");
	});
});

describe("findMatchingRule", () => {
	it("matches exact folder", () => {
		const r = rule([folderScope("notes")]);
		expect(
			findMatchingRule([r], { parentPath: "notes", basename: "x" })
		).toBe(r);
	});

	it("matches subfolders only when includeSubfolders", () => {
		const withSub = rule([folderScope("notes", true)]);
		const withoutSub = rule([folderScope("notes", false)]);
		const info = { parentPath: "notes/daily", basename: "x" };
		expect(findMatchingRule([withSub], info)).toBe(withSub);
		expect(findMatchingRule([withoutSub], info)).toBeNull();
	});

	it("does not match sibling folders sharing a prefix", () => {
		const r = rule([folderScope("notes")]);
		expect(
			findMatchingRule([r], { parentPath: "notes-archive", basename: "x" })
		).toBeNull();
	});

	it("respects array order as priority", () => {
		const first = rule([folderScope("notes")]);
		const second = rule([folderScope("notes/daily")]);
		expect(
			findMatchingRule([first, second], {
				parentPath: "notes/daily",
				basename: "x",
			})
		).toBe(first);
	});

	it("skips disabled rules and rules without scopes or template", () => {
		const disabled = rule([folderScope("notes")], { enabled: false });
		const noScopes = rule([]);
		const noTemplate = rule([folderScope("notes")], { templateFile: "" });
		const info = { parentPath: "notes", basename: "x" };
		expect(
			findMatchingRule([disabled, noScopes, noTemplate], info)
		).toBeNull();
	});

	it("combines scopes with AND (EXCLUDE_FOLDER)", () => {
		const r = rule([
			folderScope("notes"),
			{ id: nextId(), type: "EXCLUDE_FOLDER", path: "notes/private" },
		]);
		expect(
			findMatchingRule([r], { parentPath: "notes/daily", basename: "x" })
		).toBe(r);
		expect(
			findMatchingRule([r], {
				parentPath: "notes/private/sub",
				basename: "x",
			})
		).toBeNull();
	});

	it("matches ROOT anywhere in the vault (whole-vault fallback)", () => {
		const r = rule([{ id: nextId(), type: "ROOT" }]);
		expect(findMatchingRule([r], { parentPath: "/", basename: "x" })).toBe(
			r
		);
		expect(findMatchingRule([r], { parentPath: "", basename: "x" })).toBe(
			r
		);
		expect(
			findMatchingRule([r], { parentPath: "notes", basename: "x" })
		).toBe(r);
		expect(
			findMatchingRule([r], { parentPath: "notes/daily/2026", basename: "x" })
		).toBe(r);
	});

	it("narrows ROOT with EXCLUDE_FOLDER scopes", () => {
		const r = rule([
			{ id: nextId(), type: "ROOT" },
			{ id: nextId(), type: "EXCLUDE_FOLDER", path: "_global" },
			{ id: nextId(), type: "EXCLUDE_FOLDER", path: "Archives" },
		]);
		expect(findMatchingRule([r], { parentPath: "", basename: "x" })).toBe(r);
		expect(findMatchingRule([r], { parentPath: "Tasks", basename: "x" })).toBe(
			r
		);
		expect(
			findMatchingRule([r], {
				parentPath: "_global/_Templates",
				basename: "x",
			})
		).toBeNull();
		expect(
			findMatchingRule([r], { parentPath: "Archives", basename: "x" })
		).toBeNull();
	});

	it("lets an earlier FOLDER rule win over a ROOT fallback rule", () => {
		const daily = rule([folderScope("Daily")]);
		const fallback = rule([{ id: nextId(), type: "ROOT" }]);
		expect(
			findMatchingRule([daily, fallback], {
				parentPath: "Daily",
				basename: "x",
			})
		).toBe(daily);
		expect(
			findMatchingRule([daily, fallback], {
				parentPath: "Notes",
				basename: "x",
			})
		).toBe(fallback);
	});

	it("matches FILENAME_PATTERN against basename and rejects invalid regex", () => {
		const daily = rule([
			{ id: nextId(), type: "FILENAME_PATTERN", pattern: "^\\d+" },
		]);
		const broken = rule([
			{ id: nextId(), type: "FILENAME_PATTERN", pattern: "([" },
		]);
		expect(
			findMatchingRule([daily], { parentPath: "any", basename: "2026-08" })
		).toBe(daily);
		expect(
			findMatchingRule([daily], { parentPath: "any", basename: "note" })
		).toBeNull();
		expect(
			findMatchingRule([broken], { parentPath: "any", basename: "note" })
		).toBeNull();
	});
});
