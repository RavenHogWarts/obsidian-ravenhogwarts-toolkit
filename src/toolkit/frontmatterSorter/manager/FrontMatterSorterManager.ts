import { IToolkitModule } from "@/src/manager/types";
import { IFrontmatterSorterConfig, IFrontmatterSorterData } from "../types/config";
import { BaseManager } from "@/src/manager/BaseManager";
import RavenHogwartsToolkitPlugin from "@/src/main";

interface IFrontMatterSorterModule extends IToolkitModule {
    config: IFrontmatterSorterConfig;
    data: IFrontmatterSorterData;
}

export class FrontMatterSorterManager extends BaseManager<IFrontMatterSorterModule> {
    constructor(
        plugin: RavenHogwartsToolkitPlugin,
        moduleId: string,
        settings: any
    ){
        super(plugin, moduleId, settings);
    }

    protected async onModuleLoad(): Promise<void> {
        this.logger.info("Loading frontmatter sorter manager");
    }

    protected onModuleUnload(): void {
        this.logger.info("Unloading frontmatter sorter manager");
    }
}