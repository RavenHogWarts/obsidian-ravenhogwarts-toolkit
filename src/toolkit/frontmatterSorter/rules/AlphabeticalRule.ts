import { BaseRule } from "./BaseRule";
import { IFrontMatterEntry, ISortingRules } from "../types/config";

// 字母顺序规则
export class AlphabeticalRule extends BaseRule {
    constructor(config: ISortingRules) {
      super(1, config); // 最低优先级
    }

    sort(entries: IFrontMatterEntry[]): IFrontMatterEntry[] {
      return [...entries].sort((a, b) => this.compareKeys(a.key, b.key));
    }
}
