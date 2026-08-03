import {
	migrateSettings,
	needsMigration,
} from "@src/toolkit/folderTemplates/util/migrate";
import { SETTINGS_VERSION } from "@src/toolkit/folderTemplates/types";

const legacy = {
	enabled: true,
	config: {
		templatesFolderPath: "my-templates",
		ignoredFolders: ["archive"],
	},
	data: {
		folderTemplates: [
			{ folder: "", templateFile: "root.md" },
			{
				folder: "notes",
				templateFile: "note.md",
				fileNameRule: "${date}-${notename}",
			},
			{ folder: "notes/daily", templateFile: "daily.md" },
		],
	},
};

describe("needsMigration", () => {
	it("detects legacy settings without config.version", () => {
		expect(needsMigration(legacy)).toBe(true);
		expect(needsMigration(undefined)).toBe(false);
		expect(
			needsMigration({ config: { version: 1 }, data: { rules: [] } })
		).toBe(false);
	});
});

describe("migrateSettings", () => {
	const migrated = migrateSettings(legacy);

	it("stamps the new version and keeps base fields", () => {
		expect(migrated.config.version).toBe(SETTINGS_VERSION);
		expect(migrated.config.templatesFolderPath).toBe("my-templates");
		expect(migrated.enabled).toBe(true);
		expect(migrated.data.rules).toHaveLength(3);
	});

	it("restores old priority: deepest folder first, root last", () => {
		const names = migrated.data.rules.map((r) => r.templateFile);
		expect(names).toEqual(["daily.md", "note.md", "root.md"]);
	});

	it("converts folders to FOLDER scopes and root to ROOT scope", () => {
		const rootRule = migrated.data.rules[2];
		expect(rootRule.scopes.some((s) => s.type === "ROOT")).toBe(true);

		const noteRule = migrated.data.rules[1];
		const folderScope = noteRule.scopes.find((s) => s.type === "FOLDER");
		expect(folderScope).toMatchObject({
			path: "notes",
			includeSubfolders: true,
		});
	});

	it("converts ignoredFolders into EXCLUDE_FOLDER scopes on every rule", () => {
		for (const r of migrated.data.rules) {
			expect(
				r.scopes.filter((s) => s.type === "EXCLUDE_FOLDER")
			).toHaveLength(1);
		}
	});

	it("migrates fileNameRule to renameFormat", () => {
		expect(migrated.data.rules[1].renameFormat).toBe("${date}-${notename}");
		expect(migrated.data.rules[0].renameFormat).toBe("");
	});

	it("handles empty legacy settings", () => {
		const empty = migrateSettings({});
		expect(empty.data.rules).toEqual([]);
		expect(empty.config.version).toBe(SETTINGS_VERSION);
		expect(empty.enabled).toBe(false);
	});
});
