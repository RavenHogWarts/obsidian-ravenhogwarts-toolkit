import { BaseRule } from "./BaseRule";
import { IFrontMatterEntry, ISortingRules } from "../types/config";

// 自定义顺序规则
export class CustomOrderRule extends BaseRule {
    constructor(config: ISortingRules) {
        super(50, config); // 中等优先级
    }

    sort(entries: IFrontMatterEntry[]): IFrontMatterEntry[] {
        return [...entries].sort((a, b) => {
            const weightA = this.config.customOrder[a.key] ?? Infinity;
            const weightB = this.config.customOrder[b.key] ?? Infinity;
            
            if (weightA === weightB) {
                return this.compareKeys(a.key, b.key);
            }
            
            return weightA - weightB;
        });
    }
}
