import { IToolkitModuleConfig } from "@/src/core/interfaces/types";

export interface IReadingProgressConfig extends IToolkitModuleConfig {
	showTOC: boolean;
	tocAlwaysExpanded: boolean;
	useHeadingNumber: boolean;
	skipH1: boolean;
	progressStyle: "bar" | "ring" | "none" | "both";
	showToolbar: boolean;
	position: "left" | "right";
	offset: number;
	tocWidth: number;
	renderMarkdown: boolean;
	returnToCursor: {
		enabled: boolean;
		icon: string;
	};
	returnToTop: {
		enabled: boolean;
		icon: string;
	};
	returnToBottom: {
		enabled: boolean;
		icon: string;
	};
	jumpToNextHeading: {
		enabled: boolean;
		icon: string;
	};
	jumpToPrevHeading: {
		enabled: boolean;
		icon: string;
	};
}

export interface IReadingProgressData {
	lastModified: string;
}

export const READING_PROGRESS_DEFAULT_CONFIG: IReadingProgressConfig = {
	enabled: true,
	showTOC: true,
	tocAlwaysExpanded: false,
	useHeadingNumber: false,
	skipH1: false,
	progressStyle: "both",
	showToolbar: true,
	position: "right",
	offset: 12,
	tocWidth: 240,
	renderMarkdown: false,
	returnToCursor: {
		enabled: true,
		icon: "text-cursor-input",
	},
	returnToTop: {
		enabled: true,
		icon: "arrow-up-to-line",
	},
	returnToBottom: {
		enabled: true,
		icon: "arrow-down-to-line",
	},
	jumpToNextHeading: {
		enabled: false,
		icon: "corner-right-down",
	},
	jumpToPrevHeading: {
		enabled: false,
		icon: "corner-left-up",
	},
};
