import { rootLogger } from '../util/log';
import { en } from './en';
import { zh } from './zh';

export type Message = {
    common: {
        settings: string;
        overview: {
            title: string;
            description: string;
        }
        back: string;
        toggle_toolkit: string;
    },
    toolkit: {
        tableEnhancements: {
            title: string;
            description: string;
            context_menu: string;
        },
        frontmatterSorter: {
            title: string;
            description: string;
        },
        quickPath: {
            title: string;
            description: string;
            copy_path: string;
            copy_parent_path: string;
            no_parent_path: string;
            copy_folder_path: string;
            copy_file_path: string;
            copy_multiple_files_path: string;
            copy_success: string;
            copy_failed: string;
            settings: {
                absolutePath: {
                    title: string;
                    description: string;
                },
                separator: {
                    title: string;
                    description: string;
                    newline: string;
                    comma: string;
                    semicolon: string;
                    space: string;
                }
            }
        }
    }
}

// 生成所有可能的翻译键路径类型
type PathsToStringProps<T> = T extends string
    ? []
    : {
        [K in Extract<keyof T, string>]: [K, ...PathsToStringProps<T[K]>]
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
        zh
    };
    protected flatTranslations: Record<string, Record<string, string>> = {};

    constructor() {
        // 获取系统语言，默认为英文
        const lang = window.localStorage.getItem("language") || 'en';
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

    private flattenObject(obj: any, prefix = ''): Record<string, string> {
        return Object.keys(obj).reduce((acc: Record<string, string>, k: string) => {
            const pre = prefix.length ? prefix + '.' : '';
            if (typeof obj[k] === 'object') {
                Object.assign(acc, this.flattenObject(obj[k], pre + k));
            } else {
                acc[pre + k] = obj[k];
            }
            return acc;
        }, {});
    }

    public t(key: TranslationKeys, ...args: any[]): string {
        const translation = this.flatTranslations[this.currentLocale][key];
        if (!translation) {
            rootLogger.warn(`Translation key not found: ${key}`);
            return key;
        }
        
        if (args.length === 0) {
            return translation;
        }

        return translation.replace(/\{(\d+)\}/g, (match, num) => {
            const index = parseInt(num, 10);
            return args[index] !== undefined ? args[index] : match;
        });
    }

    public setLocale(locale: string): void {
        if (this.translations[locale]) {
            this.currentLocale = locale;
            window.localStorage.setItem("language", locale);
        } else {
            rootLogger.warn(`Locale not found: ${locale}, falling back to 'en'`);
            this.currentLocale = 'en';
            window.localStorage.setItem("language", 'en');
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