import en from "./locales/en";
import zh from "./locales/zh";
import zhTW from "./locales/zhTW";

// 定义支持的语言类型
export const SupportedLocales: Record<string, BaseMessage> = {
	en,
	zh,
	"zh-TW": zhTW,
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
export type TranslationKeys = JoinPath<PathsToStringProps<BaseMessage>>;

// 参数类型定义
export type TranslationParams = Record<string, any> | any[];

export type BaseMessage = {
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
		general: {
			title: string;
			menu: {
				useSubMenu: string;
			};
		};
		toolkit: {
			title: string;
			description: string;
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
		};
	};
	notice: {
		checking_update: string;
		downloading_file: string;
		installing_update: string;
		no_update_needed: string;
		update_success: string;
		update_completed: string;
		update_error: string;
	};
	toolkit: {
		tableEnhancements: {
			title: string;
			description: string;
			editor_menu: {
				table_enhancements: string;
			};
			file_menu: {
				table_enhancements: string;
			};
			command: {
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
		readingProgress: {
			title: string;
			description: string;
			command: {
				insert_toc: string;
				insert_reading_time: string;
				toggle_toc_expanded: string;
				jump_to_next_heading: string;
				jump_to_prev_heading: string;
				toggle_all_headings: string;
				scroll_to_top: string;
				scroll_to_bottom: string;
			};
			editor_menu: {
				insert_toc: string;
				insert_reading_time: string;
			};
			return_button: {
				return_to_cursor: string;
				return_to_top: string;
				return_to_bottom: string;
				jump_to_next_heading: string;
				jump_to_prev_heading;
			};
			toolbar: {
				toggle_pin: string;
				toggle_position: string;
				move_left: string;
				move_right: string;
				copy_toc: string;
				expand_all: string;
				collapse_all: string;
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
				skipH1: {
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
				progressBtn: {
					title: string;
					description: string;
					returnToCursor: {
						title: string;
						description: string;
					};
					returnToTop: {
						title: string;
						description: string;
					};
					returnToBottom: {
						title: string;
						description: string;
					};
					jumpToNextHeading: {
						title: string;
						description: string;
					};
					jumpToPrevHeading: {
						title: string;
						description: string;
					};
				};
				renderMarkdown: {
					title: string;
					description: string;
				};
			};
			estimatedReadingTime: {
				template: string;
				wordCount: string;
				chineseCount: string;
				englishCount: string;
				formatReadingTime: {
					lessThanOneMinute: string;
					lessThanOneHour: string;
					moreThanOneHour: string;
				};
			};
		};
	};
};
