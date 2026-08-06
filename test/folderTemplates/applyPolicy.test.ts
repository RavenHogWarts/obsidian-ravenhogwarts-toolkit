import { shouldApplyRule } from "@src/toolkit/folderTemplates/service/applyPolicy";

describe("shouldApplyRule", () => {
	it("empty-only: applies only to empty files", () => {
		expect(shouldApplyRule("empty-only", true)).toBe(true);
		expect(shouldApplyRule("empty-only", false)).toBe(false);
	});

	it("prepend: applies regardless of content", () => {
		expect(shouldApplyRule("prepend", true)).toBe(true);
		expect(shouldApplyRule("prepend", false)).toBe(true);
	});
});
