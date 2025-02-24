import RavenHogwartsToolkitPlugin from "@/src/main";
import { rootLogger } from "./Log";
import { FileSystemAdapter, requestUrl } from "obsidian";
import * as path from "path";
import { t } from "@/src/i18n/i18n";

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
}

export class UpdateManager {
	private readonly REPO = "RavenHogWarts/obsidian-ravenhogwarts-toolkit";
	private readonly REQUIRED_FILES = [
		"main.js",
		"manifest.json",
		"styles.css",
	];
	private readonly PLUGIN_ID = "obsidian-ravenhogwarts-toolkit";
	private latestRelease: ReleaseInfo | null = null;
	private hasNewVersion = false;

	constructor(private plugin: RavenHogwartsToolkitPlugin) {}

	async checkForUpdates(): Promise<boolean> {
		const currentVersion = this.plugin.manifest.version;
		const checkBeta = this.plugin.settings.config.updater.checkBeta;

		try {
			this.latestRelease = await this.getLatestRelease(
				this.REPO,
				checkBeta
			);

			if (!this.latestRelease) {
				rootLogger.info("No valid release found");
				return false;
			}

			rootLogger.debug("Latest release:", this.latestRelease);

			const latestVersion = this.latestRelease.tag_name;
			this.hasNewVersion =
				this.compareVersions(latestVersion, currentVersion, checkBeta) >
				0;

			if (this.hasNewVersion) {
				rootLogger.notice(
					t("notice.version_check", [
						currentVersion,
						latestVersion,
						this.hasNewVersion,
					])
				);
				await this.performUpdate(this.latestRelease);
			}

			return this.hasNewVersion;
		} catch (error) {
			rootLogger.error("Update check failed:", error);
			return false;
		}
	}

	private async performUpdate(release: ReleaseInfo): Promise<void> {
		try {
			// 获取插件目录路径
			const pluginPath = `${this.plugin.app.vault.configDir}/plugins/${this.PLUGIN_ID}`;
			const adapter = this.plugin.app.vault.adapter as FileSystemAdapter;
			// 确保插件目录存在
			await this.ensurePluginDir(adapter, pluginPath);

			// 下载并替换所有必需文件
			for (const fileName of this.REQUIRED_FILES) {
				const asset = release.assets.find((a) => a.name === fileName);
				if (!asset) {
					throw new Error(`Missing required file: ${fileName}`);
				}

				const content = await this.downloadReleaseAsset(asset);

				if (!content) {
					throw new Error(`Failed to download: ${fileName}`);
				}

				// 写入临时文件
				const tempFile = path.join(pluginPath, `${fileName}.temp`);
				await adapter.write(tempFile, content);

				// 如果原文件存在，先备份
				const originalFile = path.join(pluginPath, fileName);
				const backupFile = path.join(pluginPath, `${fileName}.backup`);

				if (await adapter.exists(originalFile)) {
					await adapter.rename(originalFile, backupFile);
				}

				// 重命名临时文件为正式文件
				await adapter.rename(tempFile, originalFile);

				// 删除备份
				if (await adapter.exists(backupFile)) {
					await adapter.remove(backupFile);
				}
			}

			rootLogger.notice(
				t("notice.update_success", [this.PLUGIN_ID, release.tag_name])
			);
		} catch (error) {
			rootLogger.error("Update failed:", error);
			throw error;
		}
	}

	private async getLatestRelease(
		repository: string,
		checkBeta = false
	): Promise<ReleaseInfo | null> {
		try {
			const apiUrl = `https://api.github.com/repos/${repository}/releases`;
			const response = await requestUrl({
				url: apiUrl,
				method: "GET",
				headers: {
					"X-GitHub-Api-Version": "2022-11-28",
				},
			});
			const releases: ReleaseInfo[] = JSON.parse(response.text);

			const validReleases = releases.filter((release) =>
				checkBeta ? true : !release.prerelease
			);

			return validReleases.length > 0 ? validReleases[0] : null;
		} catch (error) {
			rootLogger.error("Error fetching GitHub releases:", error);
			return null;
		}
	}

	private async downloadReleaseAsset(asset: {
		name: string;
		browser_download_url: string;
	}): Promise<string | null> {
		try {
			rootLogger.debug(`Downloading file from:`, asset);
			const proxySource = this.plugin.settings.config.updater.proxySource;

			for (const proxy of proxySource) {
				if (!proxy.enabled) continue;

				const URL = asset.browser_download_url.replace(
					"https://github.com/",
					proxy.url
				);

				try {
					const response = await requestUrl({
						url: URL,
						method: "GET",
						headers: {
							Accept: "application/octet-stream",
							"User-Agent":
								"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
							Referer: "https://github.com/",
						},
						throw: true,
					});

					if (response.status === 200) {
						const content = response.text;
						rootLogger.debug(
							`Content preview: ${content.slice(0, 200)}`
						);
						if (content && content.length > 0) {
							rootLogger.info(
								`Successfully downloaded file ${asset.name} from ${URL}`
							);
							return content;
						}
						rootLogger.debug(`Empty content from ${URL}`);
					}
				} catch (proxyError) {
					rootLogger.debug(
						`Failed to download from ${URL}: ${proxyError.message}`
					);
					continue;
				}
			}
			throw new Error("All proxy attempts failed");
		} catch (error) {
			rootLogger.error(`Download failed for ${asset.name}:`, error);
			return null;
		}
	}

	private parseVersion(version: string): Version {
		try {
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

			return {
				major,
				minor,
				patch,
				isBeta: !!betaPart,
				betaVersion: betaPart ? Number(betaPart) : undefined,
			};
		} catch (error) {
			rootLogger.error(`Version parsing error: ${error.message}`);
			// 返回一个安全的默认值或抛出错误
			throw error;
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

			// 主版本号比较
			if (ver1.major !== ver2.major) {
				return ver1.major - ver2.major;
			}

			// 次版本号比较
			if (ver1.minor !== ver2.minor) {
				return ver1.minor - ver2.minor;
			}

			// 修订版本号比较
			if (ver1.patch !== ver2.patch) {
				return ver1.patch - ver2.patch;
			}

			// Beta 版本处理
			if (ver1.isBeta !== ver2.isBeta) {
				return checkBeta
					? ver1.isBeta
						? 1
						: -1 // beta 优先
					: ver1.isBeta
					? -1
					: 1; // 正式版优先
			}

			// 都是 beta 版本时比较 beta 版本号
			if (ver1.isBeta && ver2.isBeta) {
				const beta1 = ver1.betaVersion ?? 0;
				const beta2 = ver2.betaVersion ?? 0;
				return beta1 - beta2;
			}

			return 0;
		} catch (error) {
			rootLogger.error(`Version comparison error: ${error.message}`);
			// 在版本比较出错时返回保守的结果
			return 0;
		}
	}

	private async ensurePluginDir(
		adapter: FileSystemAdapter,
		pluginPath: string
	): Promise<void> {
		const exists = await adapter.exists(pluginPath);
		if (!exists) {
			await adapter.mkdir(pluginPath);
		}
	}
}
