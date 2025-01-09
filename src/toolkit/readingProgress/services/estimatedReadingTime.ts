export class EstimatedReadingTime {
  // 平均阅读速度（字/分钟）
  private static readonly CHINESE_WORDS_PER_MINUTE = 300;
  private static readonly ENGLISH_WORDS_PER_MINUTE = 200;

  /**
   * 计算预计阅读时间
   * @param content 文档内容
   * @returns 预计阅读时间（分钟）
   */
  public static calculate(content: string): number {
    if (!content) return 0;

    // 清理内容
    const cleanContent = this.cleanContent(content);
    // 获取字数
    const { chineseCount, englishCount } = this.getWordCounts(cleanContent);

    const chineseTime = chineseCount / this.CHINESE_WORDS_PER_MINUTE;
    const englishTime = englishCount / this.ENGLISH_WORDS_PER_MINUTE;

    return Math.ceil(chineseTime + englishTime);
  }


  private static getWordCounts(content: string): { chineseCount: number, englishCount: number } {
    // 提取所有中文字符
    const chineseChars = content.match(/[\u4e00-\u9fff]/g) || [];
    // 移除所有中文字符后，按空格分词计算英文单词
    const englishContent = content
    .replace(/[\u4e00-\u9fff]/g, '')  // 移除中文字符
    .replace(/[\p{P}]/gu, ' ')        // 将标点替换为空格
    .trim();

    const englishWords = englishContent
        .split(/\s+/)
        .filter(Boolean);

    return {
        chineseCount: chineseChars.length,
        englishCount: englishWords.length
    };
  }

  private static cleanContent(content: string): string {
      return content
        // .replace(/```[\s\S]*?```/g, '')     // 移除代码块
        .replace(/---[\s\S]*?---/, '')      // 移除 front matter
        // .replace(/\[\[.*?\]\]/g, '')        // 移除 wiki 链接
        // .replace(/!\[\[.*?\]\]/g, '')      // 移除图片链接
        // .replace(/\[.*?\]\(.*?\)/g, '')     // 移除普通链接
        .trim();
  }
}