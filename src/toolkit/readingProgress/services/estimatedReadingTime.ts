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
      const wordCount = this.getWordCount(cleanContent);
      // 判断内容类型并计算时间
      const wordsPerMinute = this.isChineseContent(cleanContent) 
          ? this.CHINESE_WORDS_PER_MINUTE 
          : this.ENGLISH_WORDS_PER_MINUTE;

      return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * 清理文档内容，移除不需要计入阅读时间的部分
   */
  private static cleanContent(content: string): string {
      return content
          // .replace(/```[\s\S]*?```/g, '')     // 移除代码块
          .replace(/---[\s\S]*?---/, '')      // 移除 front matter
          // .replace(/\[\[.*?\]\]/g, '')        // 移除 wiki 链接
          // .replace(/!\[\[.*?\]\]/g, '')      // 移除图片链接
          // .replace(/\[.*?\]\(.*?\)/g, '')     // 移除普通链接
          .trim();
  }

  /**
   * 获取内容的字数
   */
  private static getWordCount(content: string): number {
      if (this.isChineseContent(content)) {
          // 中文：计算字符数（排除空格和标点）
          return content
              .replace(/\s+/g, '')
              .replace(/[\p{P}]/gu, '')
              .length;
      } else {
          // 英文：按空格分词
          return content
              .split(/\s+/)
              .filter(Boolean)
              .length;
      }
  }

  /**
   * 判断是否为中文内容
   */
  private static isChineseContent(content: string): boolean {
      const chineseChars = content.match(/[\u4e00-\u9fff]/g)?.length || 0;
      const totalChars = content.replace(/\s+/g, '').length;
      return chineseChars / totalChars > 0.5;
  }

  /**
   * 格式化阅读时间显示
   */
  public static formatReadingTime(minutes: number): string {
      if (minutes < 1) return '< 1 min';
      return `${minutes} min read`;
  }
}