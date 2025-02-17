import * as monaco from "monaco-editor";
import { Logger } from "@/src/core/services/Log";

export class MonacoWorkerService {
	private static logger: Logger;
	private static initialized = false;

	/**
	 * 初始化 Monaco Worker 服务
	 */
	static async initialize(logger: Logger) {
		if (this.initialized) return;

		this.logger = logger;
		this.logger.debug("[MonacoWorkerService] Initializing...");

		try {
			window.MonacoEnvironment = {
				getWorkerUrl: function (_moduleId: string, _label: string) {
					return (
						"data:text/javascript;charset=utf-8," +
						encodeURIComponent(`
				            self.MonacoEnvironment = {
				                baseUrl: ''
				            };
				        `)
					);
				},
			};

			this.initialized = true;
			this.logger.debug("[MonacoWorkerService] Initialized successfully");
		} catch (error) {
			this.logger.error(
				"[MonacoWorkerService] Initialization failed:",
				error
			);
			throw error;
		}
	}

	/**
	 * 配置语言服务
	 */
	private static configureLanguageServices() {
		// TypeScript/JavaScript 配置
		monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
			noSemanticValidation: false,
			noSyntaxValidation: false,
		});

		monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
			target: monaco.languages.typescript.ScriptTarget.ESNext,
			allowNonTsExtensions: true,
			moduleResolution:
				monaco.languages.typescript.ModuleResolutionKind.NodeJs,
			module: monaco.languages.typescript.ModuleKind.CommonJS,
			noEmit: true,
			esModuleInterop: true,
			jsx: monaco.languages.typescript.JsxEmit.React,
			allowJs: true,
			typeRoots: ["node_modules/@types"],
		});

		// JSON 配置
		monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
			validate: true,
			allowComments: true,
			schemas: [],
		});
	}

	static dispose() {
		this.initialized = false;
	}
}
