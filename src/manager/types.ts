import { DEFAULT_LOGGER_CONFIG, ILoggerConfig, LogLevel } from "../util/log";

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