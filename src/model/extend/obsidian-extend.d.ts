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

	interface Setting {
		setVisibility(visible: boolean): this;
	}

	interface ColorComponent {
		colorPickerEl: HTMLInputElement;
	}

	interface ProgressBarComponent {
		progressBar: HTMLDivElement;
		lineEl: HTMLDivElement;
		setVisibility(visible: boolean): this;
	}

	interface SearchComponent {
		containerEl: HTMLElement;
		setClass(cls: string): this;
	}
}
