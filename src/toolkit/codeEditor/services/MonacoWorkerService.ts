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
		this.logger.info("[MonacoWorkerService] Initializing...");

		try {
			// 配置 Monaco 环境
			window.MonacoEnvironment = {
				getWorker: function (moduleId: string, label: string) {
					let workerCode = "";

					switch (label) {
						case "typescript":
						case "javascript":
							workerCode = `
                                self.MonacoEnvironment = { baseUrl: '' };
                                self.onmessage = function(e) {
                                    self.postMessage({
                                        type: 'response',
                                        requestId: e.data.requestId,
                                        data: {
                                            capabilities: {
                                                textDocumentSync: 1,
                                                completionProvider: {
                                                    triggerCharacters: [".", '"', "'", "\`", "/", "@", "<"]
                                                },
                                                signatureHelpProvider: {
                                                    triggerCharacters: ['(', ',']
                                                },
                                                definitionProvider: true,
                                                referencesProvider: true,
                                                documentHighlightProvider: true,
                                                documentSymbolProvider: true,
                                                codeActionProvider: true,
                                                documentFormattingProvider: true,
                                                documentRangeFormattingProvider: true,
                                                renameProvider: true,
                                                hoverProvider: true
                                            }
                                        }
                                    });
                                };
                            `;
							break;

						case "css":
						case "scss":
						case "less":
							workerCode = `
                                self.MonacoEnvironment = { baseUrl: '' };
                                self.onmessage = function(e) {
                                    self.postMessage({
                                        type: 'response',
                                        requestId: e.data.requestId,
                                        data: {
                                            capabilities: {
                                                textDocumentSync: 1,
                                                completionProvider: {
                                                    triggerCharacters: [':']
                                                },
                                                hoverProvider: true,
                                                documentSymbolProvider: true,
                                                documentFormattingProvider: true,
                                                documentRangeFormattingProvider: true,
                                                colorProvider: true,
                                                foldingRangeProvider: true
                                            }
                                        }
                                    });
                                };
                            `;
							break;

						case "html":
							workerCode = `
                                self.MonacoEnvironment = { baseUrl: '' };
                                self.onmessage = function(e) {
                                    self.postMessage({
                                        type: 'response',
                                        requestId: e.data.requestId,
                                        data: {
                                            capabilities: {
                                                textDocumentSync: 1,
                                                completionProvider: {
                                                    triggerCharacters: ['<', '/', '.']
                                                },
                                                documentFormattingProvider: true,
                                                documentRangeFormattingProvider: true,
                                                documentHighlightProvider: true,
                                                documentSymbolProvider: true,
                                                hoverProvider: true,
                                                foldingRangeProvider: true
                                            }
                                        }
                                    });
                                };
                            `;
							break;

						case "json":
							workerCode = `
                                self.MonacoEnvironment = { baseUrl: '' };
                                self.onmessage = function(e) {
                                    self.postMessage({
                                        type: 'response',
                                        requestId: e.data.requestId,
                                        data: {
                                            capabilities: {
                                                textDocumentSync: 1,
                                                completionProvider: {
                                                    triggerCharacters: ['"', ':']
                                                },
                                                documentFormattingProvider: true,
                                                documentRangeFormattingProvider: true,
                                                documentSymbolProvider: true,
                                                colorProvider: true,
                                                foldingRangeProvider: true,
                                                selectionRangeProvider: true
                                            }
                                        }
                                    });
                                };
                            `;
							break;

						default:
							// 基础编辑器功能
							workerCode = `
                                self.MonacoEnvironment = { baseUrl: '' };
                                self.onmessage = function(e) {
                                    self.postMessage({
                                        type: 'response',
                                        requestId: e.data.requestId,
                                        data: {
                                            capabilities: {
                                                textDocumentSync: 1,
                                                completionProvider: {
                                                    triggerCharacters: []
                                                }
                                            }
                                        }
                                    });
                                };
                            `;
							break;
					}

					const blob = new Blob([workerCode], {
						type: "text/javascript",
					});
					return new Worker(URL.createObjectURL(blob), {
						name: label,
					});
				},
			};

			// 配置语言服务
			this.configureLanguageServices();

			this.initialized = true;
			this.logger.info("[MonacoWorkerService] Initialized successfully");
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
