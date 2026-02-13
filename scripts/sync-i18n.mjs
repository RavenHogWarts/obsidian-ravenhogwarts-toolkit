/**
 * 翻译键同步脚本
 * 深度合并：多删少补，保证与基准文件始终一致
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const I18N_DIR = path.join(ROOT_DIR, 'src', 'i18n');

// 日志
const log = {
    success: (msg) => console.log(`\x1b[32m✔\x1b[0m ${msg}`),
    error: (msg) => console.log(`\x1b[31m✖\x1b[0m ${msg}`),
};

/**
 * 读取 typesafe-i18n 配置
 */
function loadConfig() {
    const configPath = path.join(ROOT_DIR, '.typesafe-i18n.json');
    if (!fs.existsSync(configPath)) {
        throw new Error('.typesafe-i18n.json 配置文件不存在');
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

/**
 * 从 TypeScript 文件中提取翻译对象
 */
function extractTranslationObject(filePath) {
    if (!fs.existsSync(filePath)) return null;

    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/const\s+\w+\s*=\s*(\{[\s\S]*?\})\s*satisfies\s+BaseTranslation/);
    
    if (!match) return null;

    try {
        return new Function(`return ${match[1]}`)();
    } catch {
        return null;
    }
}

/**
 * 获取对象的所有扁平化键路径
 */
function getKeys(obj, prefix = '') {
    const keys = new Set();
    for (const key of Object.keys(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            getKeys(value, fullKey).forEach(k => keys.add(k));
        } else {
            keys.add(fullKey);
        }
    }
    return keys;
}

/**
 * 深度合并：按照基准结构重建对象
 */
function deepMerge(baseObj, targetObj) {
    const result = {};
    
    for (const key of Object.keys(baseObj)) {
        const baseValue = baseObj[key];
        const targetValue = targetObj?.[key];
        
        if (typeof baseValue === 'object' && baseValue !== null && !Array.isArray(baseValue)) {
            result[key] = deepMerge(baseValue, typeof targetValue === 'object' ? targetValue : {});
        } else if (targetValue !== undefined && typeof targetValue !== 'object') {
            result[key] = targetValue;
        } else {
            result[key] = `TODO: ${baseValue}`;
        }
    }
    
    return result;
}

/**
 * 将对象序列化为 TypeScript 格式
 */
function toTypeScript(obj, indent = 1) {
    const pad = '\t'.repeat(indent);
    const lines = Object.keys(obj).map(key => {
        const value = obj[key];
        const formattedKey = /[^a-zA-Z0-9_]/.test(key) ? `"${key}"` : key;
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            return `${pad}${formattedKey}: ${toTypeScript(value, indent + 1)},`;
        }
        const escaped = String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
        return `${pad}${formattedKey}: "${escaped}",`;
    });
    
    return `{\n${lines.join('\n')}\n${'\t'.repeat(indent - 1)}}`;
}

/**
 * 生成翻译文件内容
 */
function generateContent(locale, obj) {
    const varName = locale.replace(/-/g, '_');
    return `import type { BaseTranslation } from '../i18n-types'

const ${varName} = ${toTypeScript(obj)} satisfies BaseTranslation;

export default ${varName};
`;
}

/**
 * 主函数
 */
function main() {
    const { baseLocale } = loadConfig();
    
    // 获取所有 locale 目录
    const locales = fs.readdirSync(I18N_DIR, { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => e.name);

    if (!locales.includes(baseLocale)) {
        throw new Error(`基准语言 "${baseLocale}" 目录不存在`);
    }

    // 解析基准语言
    const baseObj = extractTranslationObject(path.join(I18N_DIR, baseLocale, 'index.ts'));
    if (!baseObj) {
        throw new Error('无法解析基准语言文件');
    }

    const baseKeys = getKeys(baseObj);
    let syncedCount = 0;

    // 同步其他语言
    for (const locale of locales.filter(l => l !== baseLocale)) {
        const filePath = path.join(I18N_DIR, locale, 'index.ts');
        
        // 检查文件是否存在，不存在则生成初始文件
        if (!fs.existsSync(filePath)) {
            const initialContent = generateContent(locale, deepMerge(baseObj, {}));
            fs.writeFileSync(filePath, initialContent, 'utf-8');
            log.success(`${locale} (新建，+${baseKeys.size} 个键)`);
            syncedCount++;
            continue;
        }

        const targetObj = extractTranslationObject(filePath);

        if (!targetObj) {
            log.error(`无法解析: ${locale}/index.ts`);
            continue;
        }

        const targetKeys = getKeys(targetObj);
        const missing = [...baseKeys].filter(k => !targetKeys.has(k));
        const extra = [...targetKeys].filter(k => !baseKeys.has(k));

        if (missing.length === 0 && extra.length === 0) continue;

        // 执行同步
        fs.writeFileSync(filePath, generateContent(locale, deepMerge(baseObj, targetObj)), 'utf-8');
        
        const changes = [];
        if (missing.length > 0) changes.push(`+${missing.length}`);
        if (extra.length > 0) changes.push(`-${extra.length}`);
        log.success(`${locale} (${changes.join(', ')})`);
        syncedCount++;
    }

    log.success(syncedCount > 0 ? `同步完成，已更新 ${syncedCount} 个语言文件` : '所有语言已同步');
}

main();
