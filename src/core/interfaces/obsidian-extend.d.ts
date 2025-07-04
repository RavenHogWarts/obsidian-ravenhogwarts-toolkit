import { App, Menu, MenuItem } from "obsidian";

declare module "obsidian" {
	interface App {
		commands: {
			removeCommand(commandId: string): void;
		};
	}
	interface MenuItem {
		setSubmenu(): Menu;
	}
}
