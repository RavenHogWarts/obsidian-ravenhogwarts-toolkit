import { IFrontMatterEntry, ISortingRules } from "../types/config";
import { PriorityRule } from "../rules/PriorityRule";

export class FrontMatterSorter {
    private rule: PriorityRule;

    constructor(private config: ISortingRules) {
        this.rule = new PriorityRule(config);
    }

    sort(entries: IFrontMatterEntry[]): IFrontMatterEntry[] {
        if (!entries || entries.length === 0) {
            return [];
        }
        return this.rule.sort(entries);
    }
}
