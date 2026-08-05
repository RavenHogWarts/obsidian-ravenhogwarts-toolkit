import {
	migrateScope,
	TemplateScope,
} from "@src/toolkit/folderTemplates/types";

describe("migrateScope", () => {
	const folder: TemplateScope = {
		id: "s1",
		type: "FOLDER",
		path: "notes/daily",
		includeSubfolders: true,
	};

	it("keeps id stable across type changes", () => {
		expect(migrateScope(folder, "EXCLUDE_FOLDER").id).toBe("s1");
		expect(migrateScope(folder, "ROOT").id).toBe("s1");
	});

	it("carries path between FOLDER and EXCLUDE_FOLDER", () => {
		const excluded = migrateScope(folder, "EXCLUDE_FOLDER");
		expect(excluded).toMatchObject({
			type: "EXCLUDE_FOLDER",
			path: "notes/daily",
		});

		const back = migrateScope(excluded, "FOLDER");
		expect(back).toMatchObject({ type: "FOLDER", path: "notes/daily" });
	});

	it("resets includeSubfolders to default when returning to FOLDER", () => {
		const excluded = migrateScope(
			{ ...folder, includeSubfolders: false },
			"EXCLUDE_FOLDER"
		);
		const back = migrateScope(excluded, "FOLDER");
		expect(back).toMatchObject({
			type: "FOLDER",
			includeSubfolders: true,
		});
	});

	it("does not carry path into pattern-only scopes", () => {
		const pattern = migrateScope(folder, "FILENAME_PATTERN");
		expect(pattern).toEqual({
			id: "s1",
			type: "FILENAME_PATTERN",
			pattern: "",
		});
	});
});
