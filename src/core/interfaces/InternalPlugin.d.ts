import { App, Component, Events } from "obsidian";
import { InternalPluginName } from "./InternalPluginName";

export interface InternalPlugins extends Events {
	/**
	 * Plugin configs for internal plugins.
	 *
	 * @remark Prefer usage of getPluginById to access a plugin.
	 */
	plugins: InternalPluginNamePluginsMapping;
}

type InternalPluginNamePluginsMapping = {
	[InternalPluginName.Templates]: TemplatesPlugin;
};

interface TemplatesPlugin extends InternalPlugin<TemplatesPluginInstance> {}

interface TemplatesPluginInstance
	extends InternalPluginInstance<TemplatesPlugin> {
	options: {
		folder: string;
	};
}

interface InternalPluginInstance<InternalPlugin> {
	description: string;

	id: string;

	name: string;

	init(app: App, plugin: InternalPlugin): void;

	onDisable?(app: App, plugin: InternalPlugin): void;

	onEnable?(app: App, plugin: InternalPlugin): Promise<void>;

	onUserDisable?(app: App): void;

	onUserEnable?(app: App): void;
}

interface InternalPlugin<InternalPluginInstance> extends Component {
	enabled: boolean;

	instance: InternalPluginInstance;
}
