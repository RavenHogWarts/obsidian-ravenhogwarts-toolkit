import { LucideIcon } from "lucide-react";
import { Table } from "lucide-react";
import { Link } from "lucide-react";
import { FileText } from "lucide-react";
import { DEFAULT_LOGGER_CONFIG, ILoggerConfig, LogLevel } from "../util/log";
import { ToolkitId } from "./hooks/useToolkitSettings";

// 主配置接口
export interface IRavenHogwartsToolkitConfig {
    config: {
        version: string;
        logging: ILoggerConfig;
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
        logging: DEFAULT_LOGGER_CONFIG
    },
    toolkit: {}
};

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
    }
};