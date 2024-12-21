import { TFile, Vault } from "obsidian";
import { IFrontMatterEntry, ISortingRules } from "../types/config";
import { IParsedFrontMatter } from "../types/config";

export class FrontMatterWriter {
  constructor(private config: ISortingRules) {}

  async writeToFile(vault: Vault, file: TFile, content: string): Promise<void> {
    try {
      await vault.modify(file, content);
    } catch (error) {
      throw new Error(`Failed to write to file ${file.path}: ${error.message}`);
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
        return `${key}: [${sortedValue.join(', ')}]`;
      }
      return `${key}: [${value.join(', ')}]`;
    }

    if (typeof value === 'object') {
      const nested = Object.entries(value)
        .map(([k, v]) => `  ${k}: ${v}`)
        .join('\n');
      return `${key}:\n${nested}`;
    }

    if (typeof value === 'string' && value.includes('\n')) {
      const lines = value.trim().split('\n');
      return `${key}: |\n  ${lines.join('\n  ')}`;
    }

    if (typeof value === 'string' && /[\s,:]/.test(value)) {
      return `${key}: "${value}"`;
    }

    return `${key}: ${value}`;
  }
}
