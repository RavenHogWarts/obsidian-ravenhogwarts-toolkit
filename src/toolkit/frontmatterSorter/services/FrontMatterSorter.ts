import { AlphabeticalRule } from "../rules/AlphabeticalRule";
import { CustomOrderRule } from "../rules/CustomOrderRule";
import { PriorityRule } from "../rules/PriorityRule";
import { IFrontMatterEntry, ISortingRules } from "../types/config";
import { ISortingRule } from "../types/rules";

export class FrontMatterSorter {
  private rules: ISortingRule[] = [];

  constructor(private config: ISortingRules) {
    this.initializeRules();
  }

  private initializeRules(): void {
    // 按优先级添加规则
    if (this.config.priority.length > 0) {
      this.rules.push(new PriorityRule(this.config));
    }
    
    if (Object.keys(this.config.customOrder).length > 0) {
      this.rules.push(new CustomOrderRule(this.config));
    }
    
    // 始终添加字母排序规则作为默认规则
    this.rules.push(new AlphabeticalRule(this.config));
    
    // 按优先级排序规则
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  sort(entries: IFrontMatterEntry[]): IFrontMatterEntry[] {
    if (!entries || entries.length === 0) {
      return [];
    }

    let sortedEntries = [...entries];

    // 应用所有规则
    for (const rule of this.rules) {
      sortedEntries = rule.sort(sortedEntries);
    }

    return sortedEntries;
  }
}
