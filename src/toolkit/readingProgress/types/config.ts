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
};
