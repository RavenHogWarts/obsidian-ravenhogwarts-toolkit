import { TFile, Vault } from "obsidian";
import { IFrontMatterEntry, IParsedFrontMatter, ISortingRules } from "../types/config";
import { Logger } from "@/src/util/log";

export class FrontMatterWriter {
  constructor(private config: ISortingRules, private logger: Logger) {}

  async writeToFile(vault: Vault, file: TFile, content: string): Promise<void> {
    try {
      await vault.modify(file, content);
    } catch (error) {
      this.logger.throwError(new Error(`Failed to write to file ${file.path}`), error);
    }
  }

  generateContent(sorted: IFrontMatterEntry[], parsed: IParsedFrontMatter, originalContent: string): string {
    const newFrontmatter = this.generateFrontmatter(sorted);
    
    return (
      originalContent.substring(0, parsed.start) +
      newFrontmatter +
      originalContent.substring(parsed.end)
    );
  }

  private generateFrontmatter(entries: IFrontMatterEntry[]): string {
    const lines = entries.map(entry => this.formatEntry(entry));
    return `---\n${lines.join('\n')}\n---`;
  }

  private formatEntry(entry: IFrontMatterEntry): string {
    const { key, value } = entry;
    
    if (value === null || value === undefined) {
      return `${key}:`;
    }

    if (Array.isArray(value)) {
      if (this.config.arraySort) {
        const sortedValue = [...value].sort();
        const formattedValues = sortedValue.map(v => {
          if (typeof v === 'string' && v.includes('[[')) {
            return `"${v}"`;
          }
          return v;
        });
        return `${key}: [${formattedValues.join(', ')}]`;
      }
      const formattedValues = value.map(v => {
        if (typeof v === 'string' && v.includes('[[')) {
          return `"${v}"`;
        }
        return v;
      });
      return `${key}: [${formattedValues.join(', ')}]`;
    }

    if (typeof value === 'object') {
      const nested = Object.entries(value)
        .map(([k, v]) => `  ${k}: ${v}`)
        .join('\n');
      return `${key}:\n${nested}`;
    }

    if (typeof value === 'string') {
      if (value.includes('[[')) {
        return `${key}: "${value}"`;
      }
      if (value.includes('\n')) {
        const lines = value.trim().split('\n');
        return `${key}: |\n  ${lines.join('\n  ')}`;
      }
      if (/[\s,:]/.test(value)) {
        return `${key}: "${value}"`;
      }
    }

    return `${key}: ${value}`;
  }
}
