/**
 * 补零函数
 * @param num 需要补零的数字
 * @param size 期望的长度
 * @returns 补零后的字符串
 */
const padZero = (num: number, size = 2): string => {
    let s = String(num);
    while (s.length < size) s = '0' + s;
    return s;
};

/**
 * 格式化日期为指定格式
 * @param date 日期对象
 * @param format 格式字符串，支持以下占位符：
 * - YYYY: 年份
 * - MM: 月份
 * - DD: 日期
 * - HH: 小时
 * - mm: 分钟
 * - ss: 秒
 * - SSS: 毫秒
 * @returns 格式化后的字符串
 */
export function formatDate(date: Date, format = 'YYYY-MM-DD HH:mm:ss.SSS'): string {
    const year = date.getFullYear();
    const month = padZero(date.getMonth() + 1);
    const day = padZero(date.getDate());
    const hours = padZero(date.getHours());
    const minutes = padZero(date.getMinutes());
    const seconds = padZero(date.getSeconds());
    const milliseconds = padZero(date.getMilliseconds(), 3);

    return format
        .replace('YYYY', String(year))
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds)
        .replace('SSS', milliseconds);
}

/**
 * 获取当前时间的格式化字符串
 * @param format 格式字符串，默认为 'YYYY-MM-DD HH:mm:ss.SSS'
 * @returns 格式化后的字符串
 */
export function getCurrentTime(format?: string): string {
    return formatDate(new Date(), format);
}

/**
 * 获取当前时间戳（毫秒）
 * @returns 当前时间戳
 */
export function getCurrentTimestamp(): number {
    return Date.now();
}

/**
 * 将时间戳转换为格式化字符串
 * @param timestamp 时间戳（毫秒）
 * @param format 格式字符串，默认为 'YYYY-MM-DD HH:mm:ss.SSS'
 * @returns 格式化后的字符串
 */
export function formatTimestamp(timestamp: number, format?: string): string {
    return formatDate(new Date(timestamp), format);
}

/**
 * 获取标准格式的时间字符串（ISO 8601格式：YYYY-MM-DDTHH:mm:ssZ）
 * @param date 日期对象，默认为当前时间
 * @returns ISO 8601格式的时间字符串
 */
export function getStandardTime(date: Date = new Date()): string {
    return formatDate(date, 'YYYY-MM-DDTHH:mm:ssZ');
}

/**
 * 将时间戳转换为标准格式的时间字符串
 * @param timestamp 时间戳（毫秒）
 * @returns ISO 8601格式的时间字符串
 */
export function timestampToStandard(timestamp: number): string {
    return getStandardTime(new Date(timestamp));
}

/**
 * 获取相对时间描述
 * @param date 日期对象或时间戳
 * @returns 相对时间描述，如"刚刚"、"5分钟前"等
 */
export function getRelativeTime(date: Date | number): string {
    const targetDate = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diff = now.getTime() - targetDate.getTime();
    const diffMinutes = Math.floor(diff / (1000 * 60));
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return '刚刚';
    if (diffMinutes < 60) return `${diffMinutes}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 30) return `${diffDays}天前`;
    return formatDate(targetDate, 'YYYY-MM-DD');
}