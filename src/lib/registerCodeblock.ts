import {
	MarkdownPostProcessor,
	MarkdownPostProcessorContext,
	MarkdownPreviewRenderer,
} from "obsidian";
import RavenHogwartsToolkitPlugin from "../main";

export class registerCodeblock {
	plugin: RavenHogwartsToolkitPlugin;
	private processors: Map<string, MarkdownPostProcessor> = new Map();

	constructor(plugin: RavenHogwartsToolkitPlugin) {
		this.plugin = plugin;
	}

	registerPriorityCodeblockPostProcessor(
		language: string,
		priority: number,
		processor: (
			source: string,
			el: HTMLElement,
			ctx: MarkdownPostProcessorContext
		) => Promise<void>
	) {
		const registered = this.plugin.registerMarkdownCodeBlockProcessor(
			language,
			processor
		);
		registered.sortOrder = priority;

		this.processors.set(language, registered);
	}

	unregisterCodeblockProcessor(language: string) {
		const processor = this.processors.get(language);
		if (processor) {
			MarkdownPreviewRenderer.unregisterPostProcessor(processor);
		}
	}

	unregisterAll() {
		this.processors.clear();
	}
}
