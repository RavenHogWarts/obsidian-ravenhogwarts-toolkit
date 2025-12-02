import "obsidian";

declare module "obsidian" {
	interface DataAdapter {
		basePath: string;
	}
	interface Menu {
		items: MenuItem[];
		sections: string[];
		addSections(sections: string[]): void;
	}
}
