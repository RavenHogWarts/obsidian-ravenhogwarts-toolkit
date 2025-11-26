import { IPluginSettings } from "@src/settings/IPluginSettings";
import SettingsStore from "@src/settings/SettingsStore";
import { useSyncExternalStore } from "react";

export default function usePluginSettings(
	settingsStore: SettingsStore
): IPluginSettings {
	const settings = useSyncExternalStore(
		settingsStore.store.subscribe,
		settingsStore.store.getSnapshot
	);
	return settings;
}
