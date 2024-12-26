import { BookOpen, FileIcon, LucideIcon } from "lucide-react";
import { Table } from "lucide-react";
import { Link } from "lucide-react";
import { FileText } from "lucide-react";
import { DEFAULT_LOGGER_CONFIG, ILoggerConfig, LogLevel } from "../util/log";

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
        version: '1.0.0',
        logger: DEFAULT_LOGGER_CONFIG,
        developer: {
            enabled: false,
            enableCount: 0
        }
    },
    toolkit: {}
};

export type ToolkitId = 'tableEnhancements'
  | 'quickPath'
  | 'frontmatterSorter'
  | 'obReader'
  | 'customIcons'
;

export const TOOLKIT_CONFIG: Record<ToolkitId, { icon: LucideIcon, iconName: string }> = {
    quickPath: {
        icon: Link,
        iconName: 'link'
    },
    tableEnhancements: {
        icon: Table,
        iconName: 'table'
    },
    frontmatterSorter: {
        icon: FileText,
        iconName: 'file-text'
    },
    obReader: {
        icon: BookOpen,
        iconName: 'book-open'
    },
    customIcons: {
        icon: FileIcon,
        iconName: 'file-icon'
    }
};