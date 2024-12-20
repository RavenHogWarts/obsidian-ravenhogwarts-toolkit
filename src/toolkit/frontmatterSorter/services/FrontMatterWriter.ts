import { TFile, Vault } from "obsidian";
import { IFrontMatterEntry, ISortingRules } from "../types/config";

export class FrontMatterWriter {
  constructor(private config: ISortingRules) {}

  generateContent(entries: IFrontMatterEntry[]): string {
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

  async writeToFile(
    vault: Vault, 
    file: TFile, 
    content: string
  ): Promise<void> {
    if (!content || !file) {
      throw new Error('Invalid parameters for file writing');
    }

    const fileContent = await vault.read(file);
    const newContent = this.replaceExistingFrontmatter(fileContent, content);

    await vault.modify(file, newContent);
  }

  private replaceExistingFrontmatter(
    original: string, 
    newFrontmatter: string
  ): string {
    const match = original.match(/^---\n[\s\S]*?\n---/);
    if (!match) return original;
    
    return original.replace(match[0], newFrontmatter);
  }
}
