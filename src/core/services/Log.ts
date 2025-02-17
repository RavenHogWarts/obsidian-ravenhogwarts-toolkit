import { Notice } from "obsidian";
import { getCurrentTime } from "@/src/lib/date";

/**
 * 日志级别枚举
 */
export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
	NONE = 4,
}

/**
 * 日志配置接口
 */
export interface ILoggerConfig {
	/** 日志级别 */
	level: LogLevel;
	/** 是否显示时间戳 */
	showTimestamp: boolean;
	/** 是否显示日志级别 */
	showLevel: boolean;
	/** 是否在控制台显示 */
	console: boolean;
	/** 是否显示通知 */
	showNotifications: boolean;
	/** 通知超时时间 */
	noticeTimeout: number;
	/** 日志前缀 */
	prefix?: string;
}

/**
 * 默认日志配置
 */
export const DEFAULT_LOGGER_CONFIG: ILoggerConfig = {
	level: LogLevel.INFO,
	showTimestamp: true,
	showLevel: true,
	console: true,
	showNotifications: true,
	noticeTimeout: 5000,
};

/**
 * 日志记录器类
 */
export class Logger {
	private static rootInstance: Logger;
	private static moduleLoggers: Map<string, Logger> = new Map();
	private static initialized = false;
	private static initConfig: Partial<ILoggerConfig> | null = null;
	private static config: ILoggerConfig = { ...DEFAULT_LOGGER_CONFIG };

	private readonly name: string;

	private constructor(name: string) {
		this.name = name;

		// 如果有待处理的初始化配置，立即应用
		if (Logger.initConfig && !Logger.initialized) {
			Logger.updateConfig(Logger.initConfig);
			Logger.initConfig = null;
			Logger.initialized = true;
		}
	}

	/**
	 * 初始化根日志记录器配置
	 */
	static initRootLogger(config: Partial<ILoggerConfig>) {
		Logger.updateConfig(config);
		Logger.initialized = true;
	}

	/**
	 * 更新日志配置
	 */
	private static updateConfig(config: Partial<ILoggerConfig>) {
		Logger.config = {
			...Logger.config,
			...config,
		};
		// 确保所有现有的 logger 实例都使用新配置
		Logger.moduleLoggers.forEach((logger) => {
			logger.updateConfig(Logger.config);
		});
		if (Logger.rootInstance) {
			Logger.rootInstance.updateConfig(Logger.config);
		}
	}

	/**
	 * 获取根 Logger 实例
	 */
	static getRootLogger(): Logger {
		if (!Logger.rootInstance) {
			Logger.rootInstance = new Logger("RavenHogwartsToolkit");
		}
		return Logger.rootInstance;
	}

	/**
	 * 获取或创建模块级别的 Logger
	 */
	static getLogger(moduleId: string): Logger {
		if (!this.moduleLoggers.has(moduleId)) {
			this.moduleLoggers.set(moduleId, new Logger(moduleId));
		}
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return this.moduleLoggers.get(moduleId)!;
	}

	/**
	 * 格式化日志消息
	 */
	private formatMessage(
		level: LogLevel,
		message: string,
		args: any[]
	): string {
		const parts: string[] = [];

		// 添加时间戳
		if (Logger.config.showTimestamp) {
			parts.push(`[${getCurrentTime()}]`);
		}

		// 添加日志级别
		if (Logger.config.showLevel) {
			parts.push(`[${LogLevel[level]}]`);
		}

		// 添加日志前缀（包括模块名）
		parts.push(`[${this.name}]`);

		// 添加前缀
		if (Logger.config.prefix) {
			parts.push(Logger.config.prefix);
		}

		// 添加消息
		parts.push(message);

		return parts.join(" ");
	}

	/**
	 * 记录日志
	 */
	private log(level: LogLevel, message: string, args: any[] = []): void {
		if (level >= Logger.config.level) {
			const formattedMessage = this.formatMessage(level, message, args);

			if (Logger.config.console) {
				switch (level) {
					case LogLevel.DEBUG:
						console.debug(formattedMessage, ...args);
						break;
					case LogLevel.INFO:
						console.info(formattedMessage, ...args);
						break;
					case LogLevel.WARN:
						console.warn(formattedMessage, ...args);
						break;
					case LogLevel.ERROR:
						console.error(formattedMessage, ...args);
						break;
				}
			}

			if (Logger.config.showNotifications && level >= LogLevel.WARN) {
				new Notice(formattedMessage, Logger.config.noticeTimeout);
			}
		}
	}

	/**
	 * 记录调试级别日志
	 */
	debug(message: string, ...args: any[]): void {
		this.log(LogLevel.DEBUG, message, args);
	}

	/**
	 * 记录信息级别日志
	 */
	info(message: string, ...args: any[]): void {
		this.log(LogLevel.INFO, message, args);
	}

	/**
	 * 记录警告级别日志
	 */
	warn(message: string, ...args: any[]): void {
		this.log(LogLevel.WARN, message, args);
	}

	/**
	 * 记录错误级别日志
	 */
	error(message: string, ...args: any[]): void {
		this.log(LogLevel.ERROR, message, args);
	}

	/**
	 * 显示通知
	 */
	notice(message: string, ...args: any[]): void {
		const formattedMessage = this.formatMessage(
			LogLevel.INFO,
			message,
			args
		);
		new Notice(formattedMessage, Logger.config.noticeTimeout);
	}

	/**
	 * 记录错误并返回
	 */
	logError<T>(error: Error, message?: string): T | null {
		this.error(message || error.message, error);
		return null;
	}

	/**
	 * 记录错误并抛出
	 */
	throwError(error: Error, message?: string): never {
		this.error(message || error.message, error);
		throw error;
	}

	private updateConfig(config: ILoggerConfig) {
		// 更新实例级别的配置
		Logger.config = config;
	}
}

// 导出根 logger 实例
export const rootLogger = Logger.getRootLogger();
