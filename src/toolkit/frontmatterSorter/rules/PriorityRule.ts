import { BaseRule } from "./BaseRule";
import { IFrontMatterEntry, ISortingRules } from "../types/config";

// 优先级规则
export class PriorityRule extends BaseRule {
    constructor(config: ISortingRules) {
        super(100, config); // 高优先级
    }

    sort(entries: IFrontMatterEntry[]): IFrontMatterEntry[] {
        return [...entries].sort((a, b) => {
            const indexA = this.config.priority.indexOf(a.key);
            const indexB = this.config.priority.indexOf(b.key);
            
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            
            return indexA - indexB;
        });
    }
}
