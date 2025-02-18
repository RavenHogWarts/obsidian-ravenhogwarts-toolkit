import { Editor, MarkdownView, Menu, TFile, TFolder } from "obsidian";
import { BaseManager } from "@/src/core/services/BaseManager";
import { MarkdownTableParser } from "../parser/MarkdownTableParser";
import { TableGenerator } from "../parser/TableGenerator";
import { IMarkdownTable } from "../types/table";
import { IToolkitModule } from "@/src/core/interfaces/types";
import RavenHogwartsToolkitPlugin from "@/src/main";
import { BaseModal } from "@/src/components/base/Modal/BaseModal";
import { TableCalculationService } from "../services/TableCalculationService";
import {
	ITableEnhancementsConfig,
	ITableEnhancementsData,
	TABLE_ENHANCEMENTS_DEFAULT_CONFIG,
} from "../types/config";
import { getStandardTime } from "@/src/lib/date";
import { UUIDGenerator } from "@/src/lib/uuid";
import {
	replaceFrontMatterKey,
	updateFrontMatter,
} from "@/src/lib/frontMatter";
import { ISavedCalculation, OutputType } from "../types/operations";

interface ITableEnhancementsModule extends IToolkitModule {
	config: ITableEnhancementsConfig;
	data: ITableEnhancementsData;
}

export class TableEnhancementsManager extends BaseManager<ITableEnhancementsModule> {
	private parser: MarkdownTableParser;
	private generator: TableGenerator;
	private tables: IMarkdownTable[] = [];
	private uuidGenerator: UUIDGenerator;
	private modal: BaseModal | null = null;
	private calculationService: TableCalculationService;
	private savedCalculations: Map<string, ISavedCalculation[]> = new Map();

	protected getDefaultConfig(): ITableEnhancementsConfig {
		return TABLE_ENHANCEMENTS_DEFAULT_CONFIG;
	}

	constructor(
		plugin: RavenHogwartsToolkitPlugin,
		moduleId: string,
		settings: any
	) {
		super(plugin, moduleId, settings);

		// 初始化服务和工具
		this.parser = new MarkdownTableParser(this.logger);
		this.generator = new TableGenerator(this.logger);
		this.calculationService = new TableCalculationService(this.logger);
		this.uuidGenerator = new UUIDGenerator({
			prefix: "table",
			length: 12,
		});
	}

	protected async onModuleLoad(): Promise<void> {
		this.logger.info("Loading table enhancements manager");
		await this.loadSavedCalculations();
		this.registerCommands();
		this.registerEventHandlers();
	}

	protected onModuleUnload(): void {
		this.logger.info("Unloading table enhancements manager");
	}

	protected onModuleCleanup(): void {
		if (this.modal) {
			this.modal.close();
			this.modal = null;
		}
		this.tables = [];
		this.savedCalculations.clear();
	}

	protected registerCommands(): void {
		this.addCommand({
			id: "table-enhancements-editor",
			name: this.t(
				"toolkit.tableEnhancements.command.table_enhancements"
			),
			callback: () => {
				this.showTableEditor();
			},
		});
	}

	protected registerEventHandlers(): void {
		// 编辑器菜单事件
		this.registerEvent(
			this.app.workspace.on(
				"editor-menu",
				this.handleEditorMenu.bind(this)
			)
		);

		// 文件菜单事件
		this.registerEvent(
			this.app.workspace.on("file-menu", this.handleFileMenu.bind(this))
		);
	}

	private handleEditorMenu(menu: Menu, editor: Editor): void {
		if (!this.isEnabled()) return;

		this.addMenuItem(
			menu,
			{
				title: this.t(
					"toolkit.tableEnhancements.editor_menu.table_enhancements"
				),
				icon: "wand",
				order: 1,
				callback: () => {
					this.showTableEditor();
				},
			},
			{ showSeparator: true }
		);
	}

	private handleFileMenu(menu: Menu, file: TFile | TFolder): void {
		if (!this.isEnabled()) return;
		if (file instanceof TFolder) return;

		this.addMenuItem(menu, {
			title: this.t(
				"toolkit.tableEnhancements.file_menu.table_enhancements"
			),
			icon: "wand",
			order: 1,
			callback: () => {
				this.showTableEditor();
			},
		});
	}

	/**
	 * 加载保存的计算配置
	 */
	private async loadSavedCalculations(): Promise<void> {
		try {
			const data = await this.getData();
			if (data?.savedCalculations) {
				Object.entries(data.savedCalculations).forEach(
					([tableId, calculations]) => {
						this.savedCalculations.set(tableId, calculations);
					}
				);
				this.logger.debug(
					"Loaded saved calculations:",
					this.savedCalculations.size
				);
			}
		} catch (error) {
			this.logger.throwError(
				new Error("Error loading saved calculations"),
				error
			);
		}
	}

	/**
	 * 保存计算配置
	 */
	private async saveCalculations(): Promise<void> {
		try {
			const savedCalculations: { [key: string]: ISavedCalculation[] } =
				{};
			this.savedCalculations.forEach((calculations, tableId) => {
				savedCalculations[tableId] = calculations;
			});

			await this.updateData({ savedCalculations });
		} catch (error) {
			this.logger.error("Error saving calculations:", error);
		}
	}

	/**
	 * 获取表格的保存的计算配置
	 */
	public getSavedCalculations(
		tableId: string | undefined
	): ISavedCalculation[] {
		if (!tableId) return [];
		return this.savedCalculations.get(tableId) || [];
	}

	/**
	 * 添加计算配置
	 */
	public async addCalculation(
		tableId: string | undefined,
		calculation: ISavedCalculation
	): Promise<void> {
		if (!tableId) {
			this.logger.throwError(new Error("Table ID is required"));
		}

		const calculations = this.getSavedCalculations(tableId);
		calculations.push({
			...calculation,
			createdAt: getStandardTime(),
			updatedAt: getStandardTime(),
		});
		this.savedCalculations.set(tableId, calculations);
		await this.saveCalculations();
	}

	/**
	 * 删除计算配置
	 */
	public async deleteCalculation(
		tableId: string | undefined,
		index: number
	): Promise<void> {
		if (!tableId) return;

		const calculations = this.getSavedCalculations(tableId);
		calculations.splice(index, 1);
		this.savedCalculations.set(tableId, calculations);
		await this.saveCalculations();
	}

	/**
	 * 更新计算配置
	 */
	public async updateCalculation(
		tableId: string | undefined,
		index: number,
		calculation: Partial<ISavedCalculation>
	): Promise<void> {
		if (!tableId) return;

		const calculations = this.getSavedCalculations(tableId);
		if (index >= 0 && index < calculations.length) {
			calculations[index] = {
				...calculations[index],
				...calculation,
				updatedAt: getStandardTime(),
			};
			this.savedCalculations.set(tableId, calculations);
			await this.saveCalculations();
		}
	}

	/**
	 * 替换 frontmatter 属性
	 */
	public async replaceFrontMatterProperty(
		oldKey: string,
		newKey: string
	): Promise<void> {
		try {
			const activeView =
				this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView?.file) {
				this.logger.throwError(
					new Error("No active markdown view found")
				);
			}

			await replaceFrontMatterKey(activeView.file, oldKey, newKey);
		} catch (error) {
			this.logger.throwError(
				new Error("Failed to replace front matter property"),
				error
			);
		}
	}

	/**
	 * 执行计算并保存到frontmatter
	 */
	public async executeCalculation(
		table: IMarkdownTable,
		calculation: ISavedCalculation
	): Promise<void> {
		try {
			const result = this.calculationService.calculate(
				table,
				calculation.config
			);

			// 更新计算结果
			const calculations = this.getSavedCalculations(table.referenceId);
			const index = calculations.findIndex(
				(c) =>
					c.config.formula === calculation.config.formula &&
					c.config.output.type === calculation.config.output.type &&
					c.config.output.value === calculation.config.output.value
			);

			if (index !== -1) {
				await this.updateCalculation(table.referenceId, index, {
					config: {
						...calculation.config,
						result: result,
					},
				});
			}

			// 如果配置了frontmatter键，保存到frontmatter
			if (calculation.config.output.type === OutputType.FRONTMATTER) {
				const view =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!view?.file) {
					this.logger.throwError(
						new Error("No active markdown view")
					);
				}

				updateFrontMatter(view.file, (frontmatter) => {
					frontmatter[calculation.config.output.value] = result;
				});

				this.logger.debug(
					`Updated frontmatter: ${calculation.config.output.value} = ${result}`
				);
			}
		} catch (error) {
			this.logger.throwError(
				new Error("Error executing calculation"),
				error
			);
		}
	}

	/**
	 * 解析当前文件中的表格
	 */
	private async parseCurrentTables(): Promise<void> {
		try {
			const activeView =
				this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView?.file) {
				this.logger.throwError(
					new Error("No active markdown view found")
				);
			}

			// 读取当前文件内容
			const content = await this.app.vault.read(activeView.file);
			const filePath = activeView.file.path;

			// 解析表格,更新表格数据
			this.tables = this.parser.parseTables(content).map((table) => ({
				...table,
				position: {
					...table.position,
					filePath,
				},
			}));

			this.logger.debug(
				`Parsed ${this.tables.length} tables from current file`
			);
		} catch (error) {
			this.logger.throwError(
				new Error("Error parsing current tables"),
				error
			);
		}
	}

	/**
	 * 显示表格编辑器
	 */
	private async showTableEditor(): Promise<void> {
		try {
			// 解析当前表格
			await this.parseCurrentTables();

			// 如果没有找到表格，提示用户
			if (!this.tables || this.tables.length === 0) {
				return;
			}

			// 如果已有modal，先关闭
			if (this.modal) {
				this.modal.close();
				this.modal = null;
			}

			// 创建新的modal
			this.modal = new BaseModal(
				this.app,
				this.plugin,
				() => import("../components/Modal/TableModal"),
				{
					logger: this.logger,
					tables: this.tables,
					manager: this,
					onSave: async (updatedTables: IMarkdownTable[]) => {
						try {
							await this.saveTables(updatedTables);
							this.modal?.close();
							this.modal = null;
						} catch (error) {
							this.logger.throwError(
								new Error("Error saving tables"),
								error
							);
						}
					},
				}
			);

			// 打开modal
			this.modal.open();
		} catch (error) {
			this.logger.error("Error showing table editor:", error);

			// 确保在发生错误时清理modal
			if (this.modal) {
				this.modal.close();
				this.modal = null;
			}
		}
	}

	/**
	 * 保存表格数据
	 */
	public async saveTables(updatedTables: IMarkdownTable[]): Promise<void> {
		try {
			const activeView =
				this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView?.file) {
				this.logger.throwError(
					new Error("No active markdown view found")
				);
			}

			// 读取当前文件内容
			const currentContent = await this.app.vault.read(activeView.file);
			const lines = currentContent.split("\n");

			// 更新每个表格
			let offset = 0; // 用于追踪由于插入空行导致的行号偏移
			for (let i = 0; i < updatedTables.length; i++) {
				const table = updatedTables[i];
				const originalTable = this.tables[i];

				if (!originalTable || !originalTable.position) {
					this.logger.error("Original table or position not found", {
						table,
						originalTable,
					});
					continue;
				}

				// 使用原始表格的位置信息
				const startLine = originalTable.position.startLine + offset;
				const endLine = originalTable.position.endLine + offset;

				// 检查表格是否需要生成引用ID
				let needsId = false;

				// 1. 检查单元格值是否被修改
				const cellsModified =
					JSON.stringify(originalTable.cells) !==
					JSON.stringify(table.cells);
				if (cellsModified) {
					needsId = true;
					this.logger.debug("Table cells modified");
				}

				// 2. 检查是否有数学操作
				const hasCalculations =
					this.savedCalculations.has(table.referenceId || "") ||
					this.savedCalculations.has(originalTable.referenceId || "");
				if (hasCalculations) {
					needsId = true;
					this.logger.debug("Table has calculations");
				}

				// 如果表格被修改且没有ID，则生成新ID
				if (needsId && !table.referenceId) {
					table.referenceId = this.uuidGenerator.generate();
					this.logger.debug(
						"Generated new ID for table:",
						table.referenceId
					);
				}

				// 生成新的表格文本
				const tableText = this.generator.generateTableText({
					...table,
					position: {
						...originalTable.position,
						startLine,
						endLine,
					},
				});
				const tableLines = tableText.split("\n");

				// 替换原有表格内容
				lines.splice(startLine, endLine - startLine + 1, ...tableLines);

				// 确保表格后至少有一个空行
				if (i < updatedTables.length - 1) {
					const currentEnd = startLine + tableLines.length;
					let nextContentStart = currentEnd;

					// 找到下一个非空行的位置
					while (
						nextContentStart < lines.length &&
						lines[nextContentStart].trim() === ""
					) {
						nextContentStart++;
					}

					// 如果下一个内容存在
					if (nextContentStart < lines.length) {
						// 删除所有现有的空行
						lines.splice(currentEnd, nextContentStart - currentEnd);
						// 添加一个空行
						lines.splice(currentEnd, 0, "");
						offset += 1 - (nextContentStart - currentEnd);
					}
				}

				// 更新后续表格的偏移量
				offset += tableLines.length - (endLine - startLine + 1);
			}

			// 保存更新后的文件内容
			await this.app.vault.modify(activeView.file, lines.join("\n"));

			// 重新解析表格
			await this.parseCurrentTables();

			this.logger.debug("Tables saved successfully");
		} catch (error) {
			this.logger.throwError(new Error("Save tables error"), error);
		}
	}

	public async saveCalculatedTable(
		table: IMarkdownTable
	): Promise<string | undefined> {
		try {
			// 生成新的引用ID
			const referenceId = this.uuidGenerator.generate();

			// 创建带有引用ID的新表格
			const tableWithId = {
				...table,
				referenceId,
			};

			// 找到对应的原始表格
			const originalTableIndex = this.tables.findIndex(
				(t) =>
					t.position &&
					table.position &&
					t.position.startLine === table.position.startLine &&
					t.position.endLine === table.position.endLine
			);

			if (originalTableIndex === -1) {
				this.logger.throwError(new Error("Original table not found"));
			}

			// 创建更新表格数组，保持其他表格不变
			const updatedTables = [...this.tables];
			updatedTables[originalTableIndex] = tableWithId;

			// 保存表格到文档
			await this.saveTables(updatedTables);

			// 返回引用ID
			return referenceId;
		} catch (error) {
			this.logger.throwError(
				new Error("Save calculated table error"),
				error
			);
		}
	}

	public async executeAndSaveCalculation(
		table: IMarkdownTable,
		calculation: Partial<ISavedCalculation>,
		editingIndex?: number
	): Promise<void> {
		try {
			if (!table.referenceId) {
				table.referenceId = await this.saveCalculatedTable(table);
			}

			// 如果是编辑现有计算，且输出类型是 FRONTMATTER
			if (
				editingIndex !== undefined &&
				calculation.config?.output.type === OutputType.FRONTMATTER
			) {
				const oldCalculation = this.getSavedCalculations(
					table.referenceId
				)[editingIndex];
				const oldOutputValue = oldCalculation.config.output.value;

				// 如果输出值发生变化，替换 frontmatter 属性
				if (oldOutputValue !== calculation.config.output.value) {
					await this.replaceFrontMatterProperty(
						oldOutputValue,
						calculation.config.output.value
					);
				}
			}

			// 执行计算
			await this.executeCalculation(
				table,
				calculation as ISavedCalculation
			);

			// 保存计算
			if (editingIndex !== undefined) {
				await this.updateCalculation(
					table.referenceId,
					editingIndex,
					calculation
				);
			} else {
				await this.addCalculation(
					table.referenceId,
					calculation as ISavedCalculation
				);
			}
		} catch (error) {
			this.logger.throwError(
				new Error("Failed to execute and save calculation"),
				error
			);
		}
	}

	protected onConfigChange(): void {
		// 配置变更时的处理
		this.registerEventHandlers();
	}
}
