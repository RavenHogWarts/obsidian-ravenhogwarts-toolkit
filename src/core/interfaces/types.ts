import {
	BookOpen,
	FileText,
	Link,
	LucideIcon,
	Radar,
	Table,
} from "lucide-react";
import { DEFAULT_LOGGER_CONFIG, ILoggerConfig } from "@/src/core/services/Log";

// 主配置接口
export interface IRavenHogwartsToolkitConfig {
	config: {
		version: string;
		logger: ILoggerConfig;
		developer: {
			enabled: boolean;
			lastEnabled?: string;
			enableCount: number;
		};
		menu: {
			useSubMenu: boolean;
		};
	};
	toolkit: {
		[key: string]: IToolkitModule;
	};
}

// 工具模块接口
export interface IToolkitModuleConfig {
	enabled: boolean;
	[key: string]: any;
}

export interface IToolkitModuleData {
	lastModified: string;
	[key: string]: any;
}

export interface IToolkitModule {
	config: IToolkitModuleConfig;
	data: IToolkitModuleData;
}

// 默认配置
export const DEFAULT_CONFIG: IRavenHogwartsToolkitConfig = {
	config: {
		version: "1.0.0",
		logger: DEFAULT_LOGGER_CONFIG,
		developer: {
			enabled: false,
			enableCount: 0,
		},
		menu: {
			useSubMenu: true,
		},
	},
	toolkit: {},
};

export type ToolkitId =
	| "tableEnhancements"
	| "quickPath"
	| "frontmatterSorter"
	| "obReader"
	| "readingProgress";

export const TOOLKIT_CONFIG: Record<
	ToolkitId,
	{ icon: LucideIcon; iconName: string }
> = {
	quickPath: {
		icon: Link,
		iconName: "link",
	},
	tableEnhancements: {
		icon: Table,
		iconName: "table",
	},
	frontmatterSorter: {
		icon: FileText,
		iconName: "file-text",
	},
	obReader: {
		icon: BookOpen,
		iconName: "book-open",
	},
	readingProgress: {
		icon: Radar,
		iconName: "radar",
	},
};
