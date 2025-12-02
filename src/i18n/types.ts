import en from "./locales/en";
import zh from "./locales/zh";
import zhTW from "./locales/zh-TW";

// 定义支持的语言类型
export const SupportedLocales: Record<string, BaseMessage> = {
	en,
	zh,
	"zh-TW": zhTW,
};

interface IBaseSettingsItem {
	name: string;
	desc: string;
}
export type SettingsItem<T = Record<string, never>> = IBaseSettingsItem & T;

// 定义翻译结构类型
export type BaseMessage = {
	settings: {
		quick_path: SettingsItem<{
			addEditorMenu: IBaseSettingsItem;
			addFileMenu: IBaseSettingsItem;
			useAbsolutePath: IBaseSettingsItem;
			separator: SettingsItem<{
				newline: string;
				comma: string;
				semicolon: string;
				space: string;
			}>;
		}>;
	};
	command: {
		quick_path: {
			copy_current_file_path: string;
			copy_current_folder_path: string;
		};
	};
	menu: {
		quick_path: {
			copy_file_path: string;
			copy_files_path: string;
			copy_folder_path: string;
			paste_current_file_path: string;
			paste_current_folder_path: string;
		};
	};
	notice: {
		quick_path: {
			copy_success: string;
			copy_failure: string;
			root_path_warning: string;
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
export type TranslationKeys = JoinPath<PathsToStringProps<BaseMessage>>;

// 参数类型定义
export type TranslationParams = Record<string, any> | any[];
