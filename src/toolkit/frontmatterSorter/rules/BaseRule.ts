import { IFrontMatterEntry, ISortingRules } from "../types/config";

export abstract class BaseRule {
    constructor(protected readonly config: ISortingRules) {}

    abstract sort(entries: IFrontMatterEntry[]): IFrontMatterEntry[];

    protected compareKeys(a: string, b: string): number {
        const compareA = this.config.caseSensitive ? a : a.toLowerCase();
        const compareB = this.config.caseSensitive ? b : b.toLowerCase();
        
        return compareA.localeCompare(compareB, undefined, {
            numeric: true,
            sensitivity: this.config.caseSensitive ? 'case' : 'base'
        });
    }

    protected sortArrayValue(value: any[]): any[] {
        if (!Array.isArray(value)) return value;
        return [...value].sort((a, b) => {
            if (typeof a === 'string' && typeof b === 'string') {
                return this.compareKeys(a, b);
            }
            return 0;
        });
    }
}
