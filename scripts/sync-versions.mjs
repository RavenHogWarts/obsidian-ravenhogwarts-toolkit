// scripts/sync-versions.mjs
// 发布后同步 versions.json：从 manifest.json 读取 version 与 minAppVersion，
// 追加 版本号 -> minAppVersion 映射。由 CI 在 release 创建后调用。
// version 由 release-please 更新；minAppVersion 由维护者手动在 manifest.json 中维护。

import { existsSync, readFileSync, writeFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { version, minAppVersion } = manifest;

// 校验版本号格式
const versionRegex = /^\d+\.\d+\.\d+$/;
if (!versionRegex.test(version)) {
	console.error(`❌ Invalid version format: ${version}`);
	process.exit(1);
}
if (!versionRegex.test(minAppVersion)) {
	console.error(`❌ Invalid minAppVersion format: ${minAppVersion}`);
	process.exit(1);
}

let versions = {};
if (existsSync("versions.json")) {
	const raw = readFileSync("versions.json", "utf8").trim();
	if (raw) versions = JSON.parse(raw);
}

if (versions[version] !== minAppVersion) {
	versions[version] = minAppVersion;
	writeFileSync("versions.json", JSON.stringify(versions, null, "\t") + "\n");
	console.log(`✅ versions.json: ${version} -> ${minAppVersion}`);
} else {
	console.log(`ℹ️  versions.json already up to date for ${version}`);
}
