import { BaseRule } from "./BaseRule";
import { IFrontMatterEntry } from "../types/config";

export class PriorityRule extends BaseRule {
    sort(entries: IFrontMatterEntry[]): IFrontMatterEntry[] {
        // 1. 分离条目
        const { priorityEntries, regularEntries, ignoreEntries } = this.categorizeEntries(entries);

        // 2. 处理优先级条目（按配置顺序 + 组内字母排序）
        const sortedPriority = this.sortPriorityEntries(priorityEntries);

        // 3. 处理常规条目（前缀分组 + 字母排序）
        const sortedRegular = this.sortRegularEntries(regularEntries);

        // 4. 合并结果（保持忽略条目的原始顺序）
        return [...sortedPriority, ...sortedRegular, ...ignoreEntries];
    }

    private categorizeEntries(entries: IFrontMatterEntry[]): {
        priorityEntries: IFrontMatterEntry[];
        regularEntries: IFrontMatterEntry[];
        ignoreEntries: IFrontMatterEntry[];
    } {
        const result = {
            priorityEntries: [] as IFrontMatterEntry[],
            regularEntries: [] as IFrontMatterEntry[],
            ignoreEntries: [] as IFrontMatterEntry[]
        };

        // 保持原始顺序的映射
        const originalOrder = new Map(entries.map((entry, index) => [entry.key, index]));

        entries.forEach(entry => {
            if (this.config.ignoreKeys.includes(entry.key)) {
                result.ignoreEntries.push(entry);
            } else if (this.config.priority.includes(entry.key)) {
                result.priorityEntries.push(entry);
            } else {
                result.regularEntries.push(entry);
            }
        });

        // 对忽略条目按原始顺序排序
        result.ignoreEntries.sort((a, b) => 
            (originalOrder.get(a.key) ?? 0) - (originalOrder.get(b.key) ?? 0)
        );

        return result;
    }

    private sortPriorityEntries(entries: IFrontMatterEntry[]): IFrontMatterEntry[] {
        // 优先组内直接按字母排序
        return entries.sort((a, b) => this.compareKeys(a.key, b.key));
    }

    private sortRegularEntries(entries: IFrontMatterEntry[]): IFrontMatterEntry[] {
        // 分组处理
        const groups = new Map<string, IFrontMatterEntry[]>();
        const noPrefix: IFrontMatterEntry[] = [];

        // 识别前缀并分组
        entries.forEach(entry => {
            // 1. 处理纯数字的情况
            if (/^\d+$/.test(entry.key)) {
                const prefix = entry.key;
                if (!groups.has(prefix)) {
                    groups.set(prefix, []);
                }
                groups.get(prefix)?.push(entry);
                return;
            }

            // 2. 处理数字前缀的情况
            const prefixMatch = entry.key.match(/^(\d+)_/);
            if (prefixMatch) {
                const prefix = prefixMatch[1];
                if (!groups.has(prefix)) {
                    groups.set(prefix, []);
                }
                groups.get(prefix)?.push(entry);
            } else {
                noPrefix.push(entry);
            }
        });

        // 处理每个分组
        const result: IFrontMatterEntry[] = [];
        
        // 添加前缀组（按前缀数字排序）
        [...groups.entries()]
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .forEach(([_, groupEntries]) => {
                // 组内按字母排序，考虑大小写敏感设置
                result.push(...groupEntries.sort((a, b) => this.compareKeys(a.key, b.key)));
            });

        // 添加无前缀项（按字母排序）
        result.push(...noPrefix.sort((a, b) => this.compareKeys(a.key, b.key)));

        return result;
    }
}
