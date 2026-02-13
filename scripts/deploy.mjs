// scripts/deploy.mjs
// 统一的部署脚本：支持多种部署模式
// 用法: node scripts/deploy.mjs [link|copy] [--vault-path=/path/to/vault]

import dotenv from "dotenv";
import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const manifestPath = path.join(projectRoot, "manifest.json");
const envPath = path.join(projectRoot, ".env");
const backupDir = path.join(projectRoot, ".backup");

// ==================== 参数解析 ====================
const args = process.argv.slice(2);
const deployMode = args[0] || "link"; // link | copy
const customVaultPath = args
	.find((arg) => arg.startsWith("--vault-path="))
	?.split("=")[1];

// ==================== 工具函数 ====================
const log = {
	success: (msg) => console.log(`✅ ${msg}`),
	error: (msg) => console.error(`❌ ${msg}`),
	info: (msg) => console.log(`ℹ️  ${msg}`),
	warn: (msg) => console.warn(`⚠️  ${msg}`),
};

/**
 * 检查并加载环境配置
 */
function loadVaultPath() {
	if (customVaultPath) {
		return path.resolve(customVaultPath);
	}

	if (!fs.existsSync(envPath)) {
		log.warn(".env 文件不存在，跳过部署");
		process.exit(0);
	}

	dotenv.config({ path: envPath });
	const vaultPath = process.env.VAULT_PATH;

	if (!vaultPath) {
		log.error(
			"未设置 VAULT_PATH，请在 .env 文件中设置或使用 --vault-path 参数",
		);
		process.exit(1);
	}

	return path.resolve(vaultPath);
}

/**
 * 读取插件ID
 */
function getPluginId() {
	// 优先从 dist/manifest.json 读取（构建后）
	const distManifestPath = path.join(distDir, "manifest.json");
	const sourceManifestPath = manifestPath;

	const manifestFile = fs.existsSync(distManifestPath)
		? distManifestPath
		: sourceManifestPath;

	if (!fs.existsSync(manifestFile)) {
		log.error("找不到 manifest.json 文件");
		process.exit(1);
	}

	try {
		const manifest = fs.readJsonSync(manifestFile);
		if (!manifest.id) {
			throw new Error("manifest.json 中没有 id 字段");
		}
		return manifest.id;
	} catch (error) {
		log.error(`读取 manifest.json 失败: ${error.message}`);
		process.exit(1);
	}
}

/**
 * 确保 dist 目录和必要文件存在
 */
function ensureDistReady() {
	if (!fs.existsSync(distDir)) {
		fs.mkdirSync(distDir, { recursive: true });
	}

	// 确保 .hotreload 文件存在（用于 Obsidian 热重载）
	const hotreloadPath = path.join(distDir, ".hotreload");
	if (!fs.existsSync(hotreloadPath)) {
		fs.writeFileSync(hotreloadPath, "");
	}
}

/**
 * 备份 data.json 到独立备份目录
 */
function backupDataJson(targetPluginDir) {
	const dataJsonPath = path.join(targetPluginDir, "data.json");
	if (fs.existsSync(dataJsonPath)) {
		fs.mkdirSync(backupDir, { recursive: true });
		const backupPath = path.join(backupDir, "data.json");
		fs.copyFileSync(dataJsonPath, backupPath);
		log.info("已备份 data.json 到 .backup/");
		return true;
	}
	return false;
}

/**
 * 递归复制目录
 */
function copyDirRecursive(src, dest) {
	fs.mkdirSync(dest, { recursive: true });

	const entries = fs.readdirSync(src, { withFileTypes: true });
	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);

		if (entry.isDirectory()) {
			copyDirRecursive(srcPath, destPath);
		} else {
			fs.copyFileSync(srcPath, destPath);
		}
	}
}

// ==================== 部署模式 ====================

/**
 * 模式1: link - 创建软链接（开发模式）
 * Windows 使用 junction，Linux/Mac 使用 symlink
 */
async function deployLink(vaultPath, pluginId) {
	const targetPluginDir = path.join(
		vaultPath,
		".obsidian",
		"plugins",
		pluginId,
	);

	// 检查是否指向同一位置（避免循环链接）
	if (path.resolve(targetPluginDir) === path.resolve(distDir)) {
		log.info("目标路径与 dist 目录相同，跳过链接");
		process.exit(0);
	}

	// 处理已存在的目标路径
	if (fs.existsSync(targetPluginDir)) {
		const stats = fs.lstatSync(targetPluginDir);

		if (stats.isSymbolicLink()) {
			const linkTarget = fs.readlinkSync(targetPluginDir);
			const resolvedLink = path.resolve(
				path.dirname(targetPluginDir),
				linkTarget,
			);

			if (resolvedLink === path.resolve(distDir)) {
				log.success(`软链接已存在: dist → ${pluginId}`);
				return;
			}
		} else if (stats.isDirectory()) {
			// 备份 data.json 到独立备份目录
			backupDataJson(targetPluginDir);
		}

		// 删除旧的路径
		fs.rmSync(targetPluginDir, { recursive: true, force: true });
	}

	// 确保父目录存在
	fs.mkdirSync(path.dirname(targetPluginDir), { recursive: true });

	// 创建软链接
	try {
		const linkType = process.platform === "win32" ? "junction" : "dir";
		fs.symlinkSync(distDir, targetPluginDir, linkType);
		log.success(`软链接已创建: dist → ${pluginId}`);
		
		// 自动从备份恢复 data.json 到 dist/
		const backupPath = path.join(backupDir, "data.json");
		if (fs.existsSync(backupPath)) {
			const distDataJsonPath = path.join(distDir, "data.json");
			fs.copyFileSync(backupPath, distDataJsonPath);
			log.success("已从 .backup/ 恢复 data.json 到 dist/");
		}
	} catch (error) {
		log.error(`创建软链接失败: ${error.message}`);
		process.exit(1);
	}
}

/**
 * 模式2: copy - 完整复制（生产构建）
 * 复制整个 dist 目录，保护用户的 data.json
 */
async function deployCopy(vaultPath, pluginId) {
	const targetPluginDir = path.join(
		vaultPath,
		".obsidian",
		"plugins",
		pluginId,
	);

	// 检查是否指向同一位置
	if (path.resolve(targetPluginDir) === path.resolve(distDir)) {
		log.info("目标路径与 dist 目录相同，跳过复制");
		process.exit(0);
	}

	// 确保 dist 目录存在
	if (!fs.existsSync(distDir)) {
		log.error("dist 目录不存在，请先运行构建命令");
		process.exit(1);
	}

	// 保护 data.json：双重保护机制
	// 1. 内存临时保存（用于立即恢复）
	// 2. 备份到 .backup/ （用于意外情况恢复）
	let dataJsonContent = null;
	const dataJsonPath = path.join(targetPluginDir, "data.json");
	if (fs.existsSync(dataJsonPath)) {
		try {
			dataJsonContent = fs.readFileSync(dataJsonPath, "utf8");
			log.info("已保存现有的 data.json");
			
			// 同时备份到 .backup/ 作为安全保障
			fs.mkdirSync(backupDir, { recursive: true });
			fs.writeFileSync(path.join(backupDir, "data.json"), dataJsonContent);
			log.info("已备份到 .backup/data.json");
		} catch (error) {
			log.warn(`读取 data.json 失败: ${error.message}`);
		}
	}

	// 删除旧的目标目录
	if (fs.existsSync(targetPluginDir)) {
		fs.rmSync(targetPluginDir, { recursive: true, force: true });
	}

	// 复制整个 dist 目录
	try {
		copyDirRecursive(distDir, targetPluginDir);
		const fileCount = fs.readdirSync(distDir).length;
		log.success(`已复制 ${fileCount} 个文件到 ${pluginId}`);
	} catch (error) {
		log.error(`复制失败: ${error.message}`);
		process.exit(1);
	}

	// 恢复 data.json
	if (dataJsonContent) {
		try {
			fs.writeFileSync(
				path.join(targetPluginDir, "data.json"),
				dataJsonContent,
			);
			log.success("已恢复 data.json");
		} catch (error) {
			log.error(`恢复 data.json 失败: ${error.message}`);
		}
	}
}

// ==================== 主函数 ====================
async function main() {
	try {
		log.info(`部署模式: ${deployMode}`);

		ensureDistReady();
		const vaultPath = loadVaultPath();
		const pluginId = getPluginId();

		log.info(`目标 Vault: ${vaultPath}`);
		log.info(`插件 ID: ${pluginId}`);

		switch (deployMode) {
			case "link":
				await deployLink(vaultPath, pluginId);
				break;
			case "copy":
				await deployCopy(vaultPath, pluginId);
				break;
			default:
				log.error(`未知的部署模式: ${deployMode}`);
				log.info("支持的模式: link | copy");
				process.exit(1);
		}
	} catch (error) {
		log.error(`部署失败: ${error.message}`);
		process.exit(1);
	}
}

main();
