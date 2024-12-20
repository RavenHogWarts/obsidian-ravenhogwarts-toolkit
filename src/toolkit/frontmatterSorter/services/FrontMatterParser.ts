import { parseYaml } from 'obsidian';
import { IFrontMatterEntry, IParsedFrontMatter } from "../types/config";
import { Logger } from '@/src/util/log';

export class FrontMatterParser {
  constructor(private logger: Logger) {}

  parse(content: string): IParsedFrontMatter | null {
    try {
      if (!content) return null;
      
      // 严格匹配文档开头的 frontmatter
      const match = content.match(/^\s*?---\n([\s\S]*?)\n---/);
      if (!match) return null;

      const yamlContent = match[1];
      const parsed = parseYaml(yamlContent);
      
      if (!parsed || typeof parsed !== 'object') {
        return null;
      }

      const entries: IFrontMatterEntry[] = Object.entries(parsed).map(([key, value], index) => ({
        key,
        value,
        originalLine: `${key}: ${this.stringifyValue(value)}`,
        lineNumber: index
      }));

      return {
        entries,
        raw: match[0],
        start: 0,
        end: match[0].length
      };
    } catch (error) {
      this.logger.error('Error parsing frontmatter:', error);
      return null;
    }
  }

  private stringifyValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (Array.isArray(value)) {
      return `[${value.join(', ')}]`;
    }

    if (typeof value === 'object') {
      return '\n  ' + Object.entries(value)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n  ');
    }
    
    if (typeof value === 'string') {
      if (value.includes('\n')) {
        return `|\n  ${value.trim()}`;
      }
      return /[\s,:]/.test(value) ? `"${value}"` : value;
    }
    
    return String(value);
  }
}