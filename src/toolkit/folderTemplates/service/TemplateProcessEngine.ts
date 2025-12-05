import { processObTemplate } from "../util/templates";

export class TemplateProcessEngine {
	async process(text: string) {
		if (!text || text === "") {
			return "";
		}

		let res = text;

		// Process Obsidian templates
		res = processObTemplate(res);
		return res;
	}
}
