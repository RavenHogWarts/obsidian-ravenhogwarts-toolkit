import { rootLogger } from "@/src/core/services/Log";
import { en } from "./locales/en";
import { zh } from "./locales/zh";

export type Message = {
	common: {
		settings: string;
		back: string;
		toggle_toolkit: string;
		confirm: string;
		cancel: string;
		overview: {
			title: string;
			description: string;
			version_hint: string;
		};
		developer: {
			title: string;
			description: string;
			logger: {
				level: string;
				showTimestamp: string;
				showLevel: string;
				console: string;
				showNotifications: string;
				noticeTimeout: string;
			};
			menu: {
				useSubMenu: string;
			};
		};
	};
	toolkit: {
		tableEnhancements: {
			title: string;
			description: string;
			editor_menu: {
				table_enhancements: string;
			};
			formula: {
				output_type: string;
				output_value: string;
				add_calculation: string;
				execute_all: string;
				cancel: string;
				update: string;
				add: string;
				hide_calculator: string;
				show_calculator: string;
				edit_calculation: string;
				remove_calculation: string;
				execute_calculation: string;
				edit_table: string;
				save_changes: string;
				no_table_data: string;
			};
			formula_editor: {
				math: {
					COUNT: string;
					count_modifier: string;
					SUM: string;
					AVERAGE: string;
					MIN: string;
					MAX: string;
					MEDIAN: string;
					MODE: string;
					STDDEV: string;
					VARIANCE: string;
				};
				time: {
					TIME_EARLIEST: string;
					TIME_LATEST: string;
					TIME_SPAN: string;
					time_format: string;
					time_unit: string;
				};
				table_columns: string;
				input_placeholder: string;
				function_name: string;
				hint_syntax: string;
				hint_example: string;
				hint_parameters: string;
				parameter_optional: string;
				parameter_options: string;
				insert_option: string;
			};
		};
		frontmatterSorter: {
			title: string;
			description: string;
			command: {
				sortCurrentFile: string;
				sortAllFiles: string;
			};
			notice: {
				ignore_folder: string;
				ignore_pattern: string;
				ignore_unknown: string;
				sortAllFiles_completed: string;
				check_console: string;
				file_ignored: string;
				file_sorted: string;
				sort_complete: string;
				sort_details: string;
				confirm_sort_all: {
					title: string;
					message: string;
				};
			};
			settings: {
				segment: {
					general: string;
					ignore_rules: string;
					sort_rules: string;
				};
				sortOnSave: {
					title: string;
					description: string;
				};
				ignoreFolders: {
					title: string;
					description: string;
					placeholder: string;
				};
				ignoreFiles: {
					title: string;
					description: string;
					placeholder: string;
				};
				rules: {
					priority: {
						title: string;
						description: string;
						placeholder: string;
					};
					ignoreKeys: {
						title: string;
						description: string;
						placeholder: string;
					};
					arraySort: {
						title: string;
						description: string;
					};
					caseSensitive: {
						title: string;
						description: string;
					};
				};
			};
		};
		quickPath: {
			title: string;
			description: string;
			editor_menu: {
				paste_filePath: string;
				paste_folderPath: string;
			};
			file_menu: {
				copy_folderPath: string;
				copy_filePath: string;
				copy_filesPath: string;
			};
			command: {
				copy_filePath: string;
				copy_folderPath: string;
			};
			status: {
				copy_success: string;
				copy_failed: string;
				no_parent_path: string;
			};
			settings: {
				addEditorMenu: {
					title: string;
					description: string;
				};
				addFileMenu: {
					title: string;
					description: string;
				};
				absolutePath: {
					title: string;
					description: string;
				};
				separator: {
					title: string;
					description: string;
					newline: string;
					comma: string;
					semicolon: string;
					space: string;
				};
			};
		};
		obReader: {
			title: string;
			description: string;
		};
		readingProgress: {
			title: string;
			description: string;
			return_button: {
				return_to_cursor: string;
				return_to_top: string;
				return_to_bottom: string;
			};
			toolbar: {
				toggle_pin: string;
				toggle_position: string;
				move_left: string;
				move_right: string;
				copy_toc: string;
			};
			settings: {
				segment: {
					general: string;
					toc: string;
					progress: string;
				};
				showTOC: {
					title: string;
					description: string;
				};
				tocAlwaysExpanded: {
					title: string;
					description: string;
				};
				useHeadingNumber: {
					title: string;
					description: string;
				};
				showToolbar: {
					title: string;
					description: string;
				};
				progressStyle: {
					title: string;
					description: string;
					bar: string;
					ring: string;
					none: string;
					both: string;
				};
				position: {
					title: string;
					description: string;
					left: string;
					right: string;
				};
				offset: {
					title: string;
					description: string;
				};
				tocWidth: {
					title: string;
					description: string;
				};
			};
			estimatedReadingTime: {
				template: string;
				wordCount: string;
				chineseCount: string;
				englishCount: string;
				error: {
					title: string;
					message: string;
				};
				formatReadingTime: {
					lessThanOneMinute: string;
					lessThanOneHour: string;
					moreThanOneHour: string;
				};
			};
		};
	};
};

// 生成所有可能的翻译键路径类型
type PathsToStringProps<T> = T extends string
	? []
	: {
			[K in Extract<keyof T, string>]: [K, ...PathsToStringProps<T[K]>];
	  }[Extract<keyof T, string>];

// 将路径数组转换为点号分隔的字符串
type JoinPath<T extends string[]> = T extends []
	? never
	: T extends [infer F]
	? F extends string
		? F
		: never
	: T extends [infer F, ...infer R]
	? F extends string
		? R extends string[]
			? `${F}.${JoinPath<R>}`
			: never
		: never
	: never;

// 生成所有可能的翻译键
export type TranslationKeys = JoinPath<PathsToStringProps<Message>>;

export class I18n {
	private static instance: I18n;
	protected currentLocale: string;
	protected translations: Record<string, Message> = {
		en,
		zh,
	};
	protected flatTranslations: Record<string, Record<string, string>> = {};

	constructor() {
		// 获取系统语言，默认为英文
		const lang = window.localStorage.getItem("language") || "en";
		this.currentLocale = lang;
		this.flattenTranslations();
	}

	public static getInstance(): I18n {
		if (!I18n.instance) {
			I18n.instance = new I18n();
		}
		return I18n.instance;
	}

	private flattenTranslations() {
		for (const [locale, messages] of Object.entries(this.translations)) {
			this.flatTranslations[locale] = this.flattenObject(messages);
		}
	}

	private flattenObject(obj: any, prefix = ""): Record<string, string> {
		return Object.keys(obj).reduce(
			(acc: Record<string, string>, k: string) => {
				const pre = prefix.length ? prefix + "." : "";
				if (typeof obj[k] === "object") {
					Object.assign(acc, this.flattenObject(obj[k], pre + k));
				} else {
					acc[pre + k] = obj[k];
				}
				return acc;
			},
			{}
		);
	}

	public t(key: TranslationKeys, args?: any[]): string {
		const translation = this.flatTranslations[this.currentLocale][key];
		if (!translation) {
			rootLogger.warn(`Translation key not found: ${key}`);
			return key;
		}

		if (!args || args.length === 0) {
			return translation;
		}

		return translation.replace(/\{(\d+)\}/g, (match, num) => {
			const index = parseInt(num, 10);
			return args[index] !== undefined ? args[index].toString() : match;
		});
	}

	public setLocale(locale: string): void {
		if (this.translations[locale]) {
			this.currentLocale = locale;
			window.localStorage.setItem("language", locale);
		} else {
			rootLogger.warn(
				`Locale not found: ${locale}, falling back to 'en'`
			);
			this.currentLocale = "en";
			window.localStorage.setItem("language", "en");
		}
	}

	public getLocale(): string {
		return this.currentLocale;
	}

	public hasTranslation(key: TranslationKeys): boolean {
		return !!this.flatTranslations[this.currentLocale][key];
	}
}

// 导出默认实例
export const i18n = I18n.getInstance();

// 导出便捷的翻译函数
export const t = (key: TranslationKeys, ...args: any[]): string => {
	return i18n.t(key, ...args);
};
