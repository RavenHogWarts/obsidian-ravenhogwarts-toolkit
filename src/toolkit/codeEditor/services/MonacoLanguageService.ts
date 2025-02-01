export class MonacoLanguageService {
	static async loadLanguage(language: string) {
		try {
			const monaco = await import("monaco-editor");
			await monaco.languages.getLanguages();
			return true;
		} catch (error) {
			console.warn(`Failed to load language: ${language}`, error);
			return false;
		}
	}
}
