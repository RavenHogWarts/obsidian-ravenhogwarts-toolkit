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
		updater: {
			autoUpdate: boolean;
			checkBeta: boolean;
			proxySource: ProxySource[];
			lastProxyOptimizeTime?: string;
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

export const PROXY_SOURCE_DEFAULT: ProxySource[] = [
	{
		url: "https://github.com/",
		name: "Direct",
		timeout: 5000,
		enabled: true,
	},
	{
		url: "https://ghproxy.cn/https://github.com/",
		name: "GHProxy-CN",
		timeout: 5000,
		enabled: true,
	},
	{
		url: "https://hub.gitmirror.com/https://github.com/",
		name: "GitMirror",
		timeout: 5000,
		enabled: true,
	},
	{
		url: "https://slink.ltd/https://github.com/",
		name: "Slink",
		timeout: 5000,
		enabled: true,
	},
	{
		url: "https://gh-proxy.ygxz.in/https://github.com/",
		name: "GHProxy-YGXZ",
		timeout: 5000,
		enabled: true,
	},
	{
		url: "https://down.sciproxy.com/github.com//https://github.com/",
		name: "SciProxy",
		timeout: 5000,
		enabled: true,
	},
];

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
		updater: {
			autoUpdate: false,
			checkBeta: false,
			proxySource: PROXY_SOURCE_DEFAULT,
			lastProxyOptimizeTime: undefined,
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

export interface ProxySource {
	url: string;
	name: string;
	timeout: number;
	enabled: boolean;
}
