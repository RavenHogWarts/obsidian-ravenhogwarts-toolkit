import { ISortingRule } from "../types/rules";
import { IFrontMatterEntry, ISortingRules } from "../types/config";

// 基础规则类
export abstract class BaseRule implements ISortingRule {
    constructor(
        public readonly priority: number,
        protected readonly config: ISortingRules
    ) {}

    abstract sort(entries: IFrontMatterEntry[]): IFrontMatterEntry[];

    protected compareKeys(a: string, b: string): number {
        if (this.config.caseSensitive) {
            return a.localeCompare(b);
        }
        return a.toLowerCase().localeCompare(b.toLowerCase());
    }
}
