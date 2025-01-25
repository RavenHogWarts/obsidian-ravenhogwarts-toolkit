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

	constructor(private plugin: RavenHogwartsToolkitPlugin) {}

	async checkForUpdates(): Promise<boolean> {
		const currentVersion = this.plugin.manifest.version;
		const checkBeta = this.plugin.settings.config.updater.checkBeta;

		try {
			const latestRelease = await this.getLatestRelease(
				this.REPO,
				checkBeta
			);

			if (!latestRelease) {
				rootLogger.info("No valid release found");
				return false;
			}

			rootLogger.debug("Latest release:", latestRelease);

			const latestVersion = latestRelease.tag_name;
			const hasUpdate =
				this.compareVersions(latestVersion, currentVersion, checkBeta) >
				0;

			rootLogger.notice(
				`${t("notice.version_check", {
					currentVersion,
					latestVersion,
					hasUpdate,
				})}`
			);

			if (hasUpdate) {
				await this.performUpdate(latestRelease);
			}

			return hasUpdate;
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
				`${t("notice.update_success", {
					pluginId: this.PLUGIN_ID,
					version: release.tag_name,
				})}`
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

			const response = await requestUrl({
				url: asset.browser_download_url,
				method: "GET",
				headers: {
					Accept: "application/octet-stream",
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
					Referer: "https://github.com/",
				},
			});

			if (response.status === 200) {
				const content = response.text;
				rootLogger.debug(`Content preview: ${content.slice(0, 200)}`);
				if (content && content.length > 0) {
					rootLogger.info(
						`Successfully downloaded file ${asset.name} from ${asset.browser_download_url}`
					);
					return content;
				}
			}

			throw new Error(`Download failed with status ${response.status}`);
		} catch (error) {
			rootLogger.debug(
				`Failed from ${asset.browser_download_url}:`,
				error
			);
			return null;
		}
	}

	private parseVersion(version: string): Version {
		// 分离版本号和 beta 信息
		const [versionPart, betaPart] = version.split("-beta.");
		const [major, minor, patch] = versionPart.split(".").map(Number);

		return {
			major: major || 1,
			minor: minor || 0,
			patch: patch || 0,
			isBeta: !!betaPart,
			betaVersion: betaPart ? parseInt(betaPart) : undefined,
		};
	}

	private compareVersions(
		v1: string,
		v2: string,
		checkBeta: boolean
	): number {
		const ver1 = this.parseVersion(v1);
		const ver2 = this.parseVersion(v2);

		// 如果大版本号不同，直接比较大版本号
		if (ver1.major !== ver2.major) {
			return ver1.major - ver2.major;
		}

		// 在相同大版本下：
		// checkBeta为true时，beta版本优先
		// checkBeta为false时，正式版优先
		if (ver1.isBeta !== ver2.isBeta) {
			if (checkBeta) {
				return ver1.isBeta ? 1 : -1; // beta 优先
			} else {
				return ver1.isBeta ? -1 : 1; // 正式版优先
			}
		}

		// 版本类型相同时（都是beta或都是正式版），继续比较其他版本号
		if (ver1.minor !== ver2.minor) return ver1.minor - ver2.minor;
		if (ver1.patch !== ver2.patch) return ver1.patch - ver2.patch;

		// 如果都是 beta 版本，比较 beta 版本号
		if (ver1.isBeta && ver2.isBeta) {
			return (ver1.betaVersion || 0) - (ver2.betaVersion || 0);
		}

		return 0;
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
