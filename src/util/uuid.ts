import { v4 as uuidv4 } from 'uuid';

interface UUIDOptions {
    prefix?: string;          // UUID 前缀，如 'table-'
    length?: number;          // UUID 长度（不包括前缀）
    charset?: string;         // 自定义字符集
    separator?: string;       // 前缀和 UUID 之间的分隔符
    timePrefix?: boolean;     // 是否添加时间戳前缀
    uppercase?: boolean;      // 是否使用大写
}

export class UUIDGenerator {
    private readonly defaultOptions: Required<UUIDOptions> = {
        prefix: '',
        length: 8,
        charset: '0123456789abcdefghijklmnopqrstuvwxyz',
        separator: '-',
        timePrefix: false,
        uppercase: false
    };

    private options: Required<UUIDOptions>;

    constructor(options: UUIDOptions = {}) {
        this.options = { ...this.defaultOptions, ...options };
    }

    private generateRandomString(length: number): string {
        if (length <= 0) return '';

        const uuid = uuidv4();
        const normalized = uuid.replace(/-/g, '');
        
        if (this.options.charset === this.defaultOptions.charset) {
            // 如果使用默认字符集，直接使用 uuid 的一部分
            return normalized.slice(0, length);
        } else {
            // 如果使用自定义字符集，基于 uuid 生成新的字符串
            let result = '';
            const charset = this.options.charset;
            const modulus = charset.length;
            
            for (let i = 0; i < length; i++) {
                const randomByte = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
                result += charset[randomByte % modulus];
            }
            
            return result;
        }
    }

    generate(): string {
        let result = '';
        
        // 添加时间戳（如果启用）
        if (this.options.timePrefix) {
            result += Date.now().toString(36);
            if (this.options.prefix) {
                result += this.options.separator;
            }
        }

        // 添加前缀
        if (this.options.prefix) {
            result += this.options.prefix;
        }

        // 添加分隔符（如果有前缀或时间戳）
        if ((this.options.prefix || this.options.timePrefix) && this.options.separator) {
            result += this.options.separator;
        }

        // 生成随机字符串
        result += this.generateRandomString(this.options.length);

        // 处理大小写
        return this.options.uppercase ? result.toUpperCase() : result;
    }

    updateOptions(newOptions: Partial<UUIDOptions>): void {
        this.options = { ...this.options, ...newOptions };
    }

    reset(): void {
        this.options = { ...this.defaultOptions };
    }
}

// 创建默认实例
export const defaultGenerator = new UUIDGenerator();

// 便捷函数
export function generateUUID(options?: UUIDOptions): string {
    const generator = new UUIDGenerator(options);
    return generator.generate();
}