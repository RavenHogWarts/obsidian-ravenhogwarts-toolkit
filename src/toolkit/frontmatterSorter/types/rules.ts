import { IFrontMatterEntry, ISortingRules } from "./config";

export interface ISortingRule {
	priority: number;
	sort(entries: IFrontMatterEntry[]): IFrontMatterEntry[];
}

export interface ISortingRuleFactory {
	createRule(config: ISortingRules): ISortingRule;
}
