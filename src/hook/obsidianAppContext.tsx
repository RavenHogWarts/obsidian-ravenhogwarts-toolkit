import { App } from "obsidian";
import { createContext, useContext } from "react";

export const ObsidianAppContext = createContext<App | undefined>(undefined);

export const useObsidianApp = (): App => {
	const app = useContext(ObsidianAppContext);
	if (!app) {
		throw new Error(
			"useObsidianApp must be used within a ObsidianAppContext"
		);
	}
	return app;
};
