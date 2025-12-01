import { Setting } from "obsidian";
import { createContext } from "react";

export const ObsidianSettingContext = createContext<Setting | undefined>(
	undefined
);

export const ObsidianSettingContainerContext = createContext<
	HTMLElement | undefined
>(undefined);

export const ObsidianSettingSlotContext = createContext<
	| {
			setting: Setting;
			slotEl: HTMLElement;
	  }
	| undefined
>(undefined);
