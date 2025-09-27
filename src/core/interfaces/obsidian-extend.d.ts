import "obsidian";
import { InternalPlugins } from "./InternalPlugin";

declare module "obsidian" {
	interface App {
		commands: {
			removeCommand(commandId: string): void;
		};

		internalPlugins: InternalPlugins;
	}
	interface MenuItem {
		setSubmenu(): Menu;
	}
}
