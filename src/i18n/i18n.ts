import { getLanguage } from "obsidian";
import type { Locales, TranslationFunctions } from "./i18n-types";
import { i18nObject, isLocale, loadedLocales } from "./i18n-util";
import { loadAllLocales } from "./i18n-util.sync";

/**
 * I18n 管理类
 * 基于 typesafe-i18n 的封装，提供类型安全的国际化支持
 */
export class I18n {
	private static instance: I18n;
	private currentLocale: Locales;
	private LL: TranslationFunctions;

	private constructor() {
		// 加载所有语言包（同步方式）
		loadAllLocales();

		// 获取 Obsidian 当前语言设置
		const obsidianLang = getLanguage();

		// 确定使用的 locale：如果 Obsidian 语言在支持列表中则使用，否则回退到基础语言
		this.currentLocale = isLocale(obsidianLang) ? obsidianLang : "en";

		// 初始化翻译函数对象
		this.LL = i18nObject(this.currentLocale);
	}

	/**
	 * 获取 I18n 单例
	 */
	public static getInstance(): I18n {
		if (!I18n.instance) {
			I18n.instance = new I18n();
		}
		return I18n.instance;
	}

	/**
	 * 获取翻译函数对象
	 * 可通过 LL.common.confirm() 的方式调用
	 */
	public get L(): TranslationFunctions {
		return this.LL;
	}

	/**
	 * 获取当前 locale
	 */
	public getLocale(): Locales {
		return this.currentLocale;
	}

	/**
	 * 检查某个 locale 是否已加载
	 */
	public isLocaleLoaded(locale: Locales): boolean {
		return !!loadedLocales[locale];
	}
}

// 导出默认实例
export const i18n = I18n.getInstance();

export const LL = i18n.L;
