import { IToolkitModule } from "@/src/manager/types";
import { ICustomIconsConfig, ICustomIconsData } from "../types/config";
import { BaseManager } from "@/src/manager/BaseManager";

interface ICustomIconsModule extends IToolkitModule {
  config: ICustomIconsConfig;
  data: ICustomIconsData;
}

export class CustomIconsManager extends BaseManager<ICustomIconsModule> {
  protected async onModuleLoad(): Promise<void> {
    
  }

  protected onModuleUnload(): void {
    this.logger.info("Unloading custom icons manager");
  }
}
