import { VariableEngine } from "@src/toolkit/folderTemplates/service/VariableEngine";

const fakeNow = {
	format: (fmt?: string) => `[${fmt ?? "default"}]`,
};

function engine(extra: Record<string, unknown> = {}) {
	return new VariableEngine({
		notename: "My note",
		folder: "daily",
		now: fakeNow,
		date: "2026-08-03",
		year: "2026",
		frontmatter: { category: "work" },
		...extra,
	});
}

describe("VariableEngine legacy syntax", () => {
	it("replaces {{date}} {{time}} with default formats", () => {
		expect(engine().render("{{date}} {{time}}")).toBe(
			"[YYYY-MM-DD] [HH:mm]"
		);
	});

	it("replaces {{date:FMT}} and {{time:FMT}}", () => {
		expect(engine().render("{{date:YYYY}}-{{time:mm}}")).toBe(
			"[YYYY]-[mm]"
		);
	});

	it("replaces {{title}} with notename", () => {
		expect(engine().render("# {{title}}")).toBe("# My note");
	});
});

describe("VariableEngine expressions", () => {
	it("resolves simple variables", () => {
		expect(engine().render("${notename} in ${folder}")).toBe(
			"My note in daily"
		);
	});

	it("resolves method calls", () => {
		expect(engine().render("${now.format('YYYY/MM')}")).toBe("[YYYY/MM]");
	});

	it("resolves frontmatter properties", () => {
		expect(engine().render("${frontmatter.category}")).toBe("work");
	});

	it("keeps placeholder on unknown variable or invalid syntax", () => {
		expect(engine().render("${unknown}")).toBe("${unknown}");
		expect(engine().render("${1+1}")).toBe("${1+1}");
	});

	it("blocks prototype escape attempts", () => {
		expect(engine().render("${notename.constructor}")).toBe(
			"${notename.constructor}"
		);
	});

	it("returns empty and non-string inputs unchanged", () => {
		expect(engine().render("")).toBe("");
		expect(engine().render("no placeholders")).toBe("no placeholders");
	});
});
