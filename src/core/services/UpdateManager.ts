import RavenHogwartsToolkitPlugin from "@/src/main";
import { rootLogger } from "./Log";
import { FileSystemAdapter, requestUrl } from "obsidian";
import * as path from "path";
import { t } from "@/src/i18n/i18n";
import PQueue from "p-queue";
import { UpdateOptions } from "../interfaces/types";

interface ReleaseInfo {
	tag_name: string;
	prerelease: boolean;
	assets: {
		name: string;
		browser_download_url: string;
	}[];
}
interface Version {
	major: number;
	minor: number;
	patch: number;
	isBeta: boolean;
	betaVersion?: number;
	isDev: boolean;
}

export class UpdateManager {
	private readonly REPO = "RavenHogWarts/obsidian-ravenhogwarts-toolkit";
	private readonly REQUIRED_FILES = [
		"main.js",
		"manifest.json",
		"styles.css",
	];
	private readonly PLUGIN_ID = "ravenhogwarts-toolkit";
	private updateQueue: PQueue;
	private updating = false;
	private lastUpdateCheck: number = 0;

	constructor(private plugin: RavenHogwartsToolkitPlugin) {
		this.updateQueue = new PQueue({ concurrency: 1 });
	}

	async checkForUpdates(options: UpdateOptions = {}): Promise<boolean> {
		rootLogger.debug("Starting update check with options:", options);

		if (this.updating && !options.force) {
			rootLogger.warn("Update check skipped - already in progress");
			return false;
		}

		const now = Date.now();
		const minInterval =
			this.plugin.settings.config.updater.updateCheckInterval || 3600000;
		const timeSinceLastCheck = now - this.lastUpdateCheck;

		rootLogger.debug(
			`Time since last check: ${timeSinceLastCheck}ms (minimum interval: ${minInterval}ms)`
		);

		if (!options.force && timeSinceLastCheck < minInterval) {
			rootLogger.debug(
				`Update check skipped - too soon (${timeSinceLastCheck}ms < ${minInterval}ms)`
			);
			return false;
		}

		return this.updateQueue.add(async () => {
			try {
				this.updating = true;
				options.onProgress?.({ stage: "checking" });

				rootLogger.debug("Fetching latest release info...");
				const release = await this.getLatestRelease(options.checkBeta);

				if (!release) {
					rootLogger.debug("No release information found");
					return false;
				}

				const currentVersion = this.plugin.manifest.version;
				const latestVersion = release.tag_name;

				rootLogger.debug(`Current version: ${currentVersion}`);
				rootLogger.debug(`Latest version: ${latestVersion}`);
				rootLogger.debug(`Checking beta: ${options.checkBeta}`);

				if (
					!this.shouldUpdate(
						currentVersion,
						latestVersion,
						options.checkBeta!
					)
				) {
					options.onProgress?.({
						stage: "completed",
						message: t("notice.no_update_needed"),
					});
					rootLogger.debug("No update needed - no update available");
					return false;
				}

				rootLogger.debug(`Update available: ${latestVersion}`);
				options.onProgress?.({
					stage: "downloading",
				});

				await this.performUpdate(release, options);

				options.onProgress?.({
					stage: "completed",
				});
				rootLogger.notice(t("notice.update_success", [latestVersion]));

				return true;
			} catch (error) {
				rootLogger.error("Update check failed:", error);
				options.onProgress?.({
					stage: "error",
					error: error as Error,
				});
				return false;
			} finally {
				this.updating = false;
				this.lastUpdateCheck = Date.now();
				rootLogger.debug("Update check completed");
			}
		}) as Promise<boolean>;
	}

	private shouldUpdate(
		currentVersion: string,
		latestVersion: string,
		checkBeta: boolean
	): boolean {
		try {
			rootLogger.debug("Comparing versions:", {
				current: currentVersion,
				latest: latestVersion,
				checkBeta,
			});

			// 使用自定义的版本比较逻辑
			const compareResult = this.compareVersions(
				currentVersion,
				latestVersion,
				checkBeta
			);

			rootLogger.debug(`Version comparison result: ${compareResult}`);

			return compareResult > 0;
		} catch (error) {
			rootLogger.error("Version comparison failed:", error);
			return false;
		}
	}

	private async performUpdate(
		release: ReleaseInfo,
		options: UpdateOptions
	): Promise<void> {
		const adapter = this.plugin.app.vault.adapter as FileSystemAdapter;
		const pluginPath = `${this.plugin.app.vault.configDir}/plugins/${this.PLUGIN_ID}`;
		const currentVersion = this.parseVersion(this.plugin.manifest.version);

		// 如果是开发版本，只模拟更新流程，不实际替换文件
		if (currentVersion.isDev) {
			rootLogger.debug(
				"Development version detected - simulating update process"
			);

			// 模拟下载过程
			for (const [index, fileName] of this.REQUIRED_FILES.entries()) {
				const progress = (index / this.REQUIRED_FILES.length) * 100;
				options.onProgress?.({
					stage: "downloading",
					progress,
					message: t("notice.downloading_file", [fileName]),
				});

				// 模拟下载延迟
				await new Promise((resolve) => setTimeout(resolve, 500));
			}

			// 模拟安装过程
			options.onProgress?.({
				stage: "installing",
			});
			await new Promise((resolve) => setTimeout(resolve, 1000));

			rootLogger.debug("Simulated update completed for dev version");
			return;
		}

		// 创建临时目录
		const tempDir = `${pluginPath}_temp`;
		await this.ensureDir(adapter, tempDir);

		try {
			// 保存当前配置
			const dataPath = path.join(pluginPath, "data.json");
			let savedData: string | null = null;
			if (await adapter.exists(dataPath)) {
				try {
					savedData = await adapter.read(dataPath);
					rootLogger.debug("Successfully backed up data.json");
				} catch (error) {
					rootLogger.error("Failed to backup data.json:", error);
				}
			}

			// 下载所有文件到临时目录
			for (const [index, fileName] of this.REQUIRED_FILES.entries()) {
				const progress = (index / this.REQUIRED_FILES.length) * 100;
				options.onProgress?.({
					stage: "downloading",
					progress,
					message: t("notice.downloading_file", [fileName]),
				});

				const asset = release.assets.find(
					(a: any) => a.name === fileName
				);
				if (!asset) {
					throw new Error(`Missing required file: ${fileName}`);
				}

				const content = await this.downloadFile(asset, options);
				await adapter.write(path.join(tempDir, fileName), content);
			}

			// 验证下载的文件
			await this.verifyDownload(adapter, tempDir);

			// 备份当前版本
			const backupDir = `${pluginPath}_backup`;
			if (await adapter.exists(pluginPath)) {
				await this.moveDir(adapter, pluginPath, backupDir);
			}

			// 安装新版本
			await this.moveDir(adapter, tempDir, pluginPath);

			// 恢复配置文件
			if (savedData) {
				try {
					await adapter.write(
						path.join(pluginPath, "data.json"),
						savedData
					);
					rootLogger.debug("Successfully restored data.json");
				} catch (error) {
					rootLogger.error("Failed to restore data.json:", error);
					// 如果恢复失败，尝试从备份中恢复
					if (
						await adapter.exists(path.join(backupDir, "data.json"))
					) {
						try {
							const backupData = await adapter.read(
								path.join(backupDir, "data.json")
							);
							await adapter.write(
								path.join(pluginPath, "data.json"),
								backupData
							);
							rootLogger.debug(
								"Successfully restored data.json from backup"
							);
						} catch (backupError) {
							rootLogger.error(
								"Failed to restore data.json from backup:",
								backupError
							);
						}
					}
				}
			}

			// 清理备份
			if (await adapter.exists(backupDir)) {
				await adapter.rmdir(backupDir, true);
			}

			rootLogger.debug("Update completed successfully");
		} catch (error) {
			rootLogger.error("Update failed:", error);

			// 恢复备份
			const backupDir = `${pluginPath}_backup`;
			if (await adapter.exists(backupDir)) {
				if (await adapter.exists(pluginPath)) {
					await adapter.rmdir(pluginPath, true);
				}
				await this.moveDir(adapter, backupDir, pluginPath);
				rootLogger.debug("Restored backup after failed update");
			}

			throw error;
		} finally {
			// 清理临时文件
			if (await adapter.exists(tempDir)) {
				await adapter.rmdir(tempDir, true);
			}
		}
	}

	private async downloadFile(
		asset: any,
		options: UpdateOptions
	): Promise<string> {
		const proxySource = this.plugin.settings.config.updater.proxySource
			.filter((proxy) => proxy.enabled)
			.sort((a, b) => b.priority - a.priority);

		for (const proxy of proxySource) {
			try {
				const url = asset.browser_download_url.replace(
					"https://github.com/",
					proxy.url
				);

				const response = await requestUrl({
					url,
					method: "GET",
					headers: {
						Accept: "application/octet-stream",
						"User-Agent": "Obsidian-RavenHogwartsToolkit",
					},
				});

				if (response.status === 200 && response.text) {
					return response.text;
				}
			} catch (error) {
				rootLogger.debug(`Proxy download failed: ${proxy.url}`, error);
				continue;
			}
		}
		throw new Error("All download attempts failed");
	}

	private async verifyDownload(
		adapter: FileSystemAdapter,
		tempDir: string
	): Promise<void> {
		// 验证必需文件是否存在且不为空
		for (const file of this.REQUIRED_FILES) {
			const filePath = path.join(tempDir, file);
			if (!(await adapter.exists(filePath))) {
				throw new Error(`Missing file after download: ${file}`);
			}
			const content = await adapter.read(filePath);
			if (!content || content.length === 0) {
				throw new Error(`Empty file after download: ${file}`);
			}
		}

		// 验证 manifest.json 格式
		try {
			const manifest = JSON.parse(
				await adapter.read(path.join(tempDir, "manifest.json"))
			);
			if (!manifest.version || !manifest.id) {
				throw new Error("Invalid manifest.json");
			}
		} catch (error) {
			throw new Error(`Invalid manifest.json: ${error.message}`);
		}
	}

	private async moveDir(
		adapter: FileSystemAdapter,
		from: string,
		to: string
	): Promise<void> {
		if (await adapter.exists(to)) {
			await adapter.rmdir(to, true);
		}
		await adapter.rename(from, to);
	}

	private async ensureDir(
		adapter: FileSystemAdapter,
		dir: string
	): Promise<void> {
		if (await adapter.exists(dir)) {
			await adapter.rmdir(dir, true);
		}
		await adapter.mkdir(dir);
	}

	private async getLatestRelease(
		checkBeta: boolean = false
	): Promise<ReleaseInfo | null> {
		try {
			const apiUrl = `https://api.github.com/repos/${this.REPO}/releases`;
			rootLogger.debug(`Fetching releases from: ${apiUrl}`);

			const response = await requestUrl({
				url: apiUrl,
				method: "GET",
				headers: {
					"X-GitHub-Api-Version": "2022-11-28",
				},
			});

			const releases: ReleaseInfo[] = JSON.parse(response.text);
			rootLogger.debug(`Found ${releases.length} releases`);

			const validReleases = releases.filter((release) =>
				checkBeta ? true : !release.prerelease
			);

			rootLogger.debug(
				`Valid releases (including beta=${checkBeta}): ${validReleases.length}`
			);

			if (validReleases.length > 0) {
				rootLogger.debug(
					`Latest release: ${validReleases[0].tag_name}`
				);
				return validReleases[0];
			}

			return null;
		} catch (error) {
			rootLogger.error("Error fetching GitHub releases:", error);
			return null;
		}
	}

	private compareVersions(
		v1: string,
		v2: string,
		checkBeta: boolean
	): number {
		try {
			const ver1 = this.parseVersion(v1);
			const ver2 = this.parseVersion(v2);

			rootLogger.debug("Parsed versions:", {
				v1: ver1,
				v2: ver2,
			});

			// 开发版本总是需要"更新"以便测试
			if (ver1.isDev) {
				return 1;
			}

			// 主版本号比较
			if (ver1.major !== ver2.major) {
				return ver2.major - ver1.major;
			}

			// 次版本号比较
			if (ver1.minor !== ver2.minor) {
				return ver2.minor - ver1.minor;
			}

			// 修订版本号比较
			if (ver1.patch !== ver2.patch) {
				return ver2.patch - ver1.patch;
			}

			// Beta 版本处理
			if (ver1.isBeta !== ver2.isBeta) {
				if (!checkBeta) {
					// 如果不检查 beta，则正式版优先
					return ver1.isBeta ? 1 : -1;
				} else {
					// 如果检查 beta，则 beta 版本优先
					return ver1.isBeta ? -1 : 1;
				}
			}

			// 都是 beta 版本时比较 beta 版本号
			if (ver1.isBeta && ver2.isBeta) {
				const beta1 = ver1.betaVersion ?? 0;
				const beta2 = ver2.betaVersion ?? 0;
				return beta2 - beta1;
			}

			return 0;
		} catch (error) {
			rootLogger.error(`Version comparison error: ${error.message}`);
			return 0;
		}
	}

	private parseVersion(version: string): Version {
		try {
			// 添加对 dev 版本的特殊处理
			if (version === "dev") {
				return {
					major: 0,
					minor: 0,
					patch: 0,
					isBeta: true,
					betaVersion: 0,
					isDev: true, // 新增标记
				};
			}

			// 验证版本号格式
			if (!version.match(/^\d+\.\d+\.\d+(-beta\.\d+)?$/)) {
				throw new Error(`Invalid version format: ${version}`);
			}

			const [versionPart, betaPart] = version.split("-beta.");
			const [majorStr, minorStr, patchStr] = versionPart.split(".");

			// 明确的数字转换
			const major = Number(majorStr);
			const minor = Number(minorStr);
			const patch = Number(patchStr);

			// 验证数字有效性
			if ([major, minor, patch].some((num) => isNaN(num))) {
				throw new Error(`Invalid version numbers: ${version}`);
			}

			const result = {
				major,
				minor,
				patch,
				isBeta: !!betaPart,
				betaVersion: betaPart ? Number(betaPart) : undefined,
				isDev: false, // 新增标记
			};

			rootLogger.debug(`Parsed version ${version}:`, result);

			return result;
		} catch (error) {
			rootLogger.error(
				`Version parsing error for ${version}: ${error.message}`
			);
			throw error;
		}
	}
}
