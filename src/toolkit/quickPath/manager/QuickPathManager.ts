import { IToolkitModule } from "@/src/manager/types";
import { IQuickPathConfig, IQuickPathData } from "../types/config";
import { BaseManager } from "@/src/manager/BaseManager";
import RavenHogwartsToolkitPlugin from "@/src/main";
import { TFolder } from "obsidian";
import { Menu } from "obsidian";
import { TFile } from "obsidian";

interface IQuickPathModule extends IToolkitModule {
  config: IQuickPathConfig;
  data: IQuickPathData;
}

export class QuickPathManager extends BaseManager<IQuickPathModule> {
  private basePath: string;

  protected async onModuleLoad(): Promise<void> {
    this.logger.info("Loading quick path manager");
    this.basePath = (this.app.vault.adapter as any).getBasePath()?.replace(/\\/g, '/') || '';
  }

  protected registerContextMenuItems(): void {
    // 注册文件菜单（单个文件/文件夹）
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu: Menu, file: TFile | TFolder) => {
        if (!this.isEnabled()) return;
          if (file instanceof TFolder) {
            this.addFolderMenuItem(menu, file);
        } else {
            this.addFileMenuItem(menu, file);
        }
      })
    );
    // 注册文件菜单（多个文件）
    this.registerEvent(
      this.app.workspace.on("files-menu", (menu: Menu, files: (TFile | TFolder)[]) => {
        if (!this.isEnabled()) return;
        this.addMultipleFilesMenuItem(menu, files);
      })
    );
  }
  private addFolderMenuItem(menu: Menu, folder: TFolder): void {
    this.addMenuItem(menu, {
      title: this.t('toolkit.quickPath.copy_folder_path'),
      icon: 'folder-closed',
      callback: () => {
        const path = this.getPath(folder);
        this.copyToClipboard(path);
      }
    });
  }

  private addFileMenuItem(menu: Menu, file: TFile): void {
    this.addMenuItem(menu, {
      title: this.t('toolkit.quickPath.copy_file_path'),
      icon: 'file-text',
      callback: () => {
        const path = this.getPath(file);
        this.copyToClipboard(path);
      }
    });
  }

  private addMultipleFilesMenuItem(menu: Menu, items: (TFile | TFolder)[]): void {
    const files = items.filter((item): item is TFile => item instanceof TFile);
    if (!files.length) return;
    this.addMenuItem(menu, {
      title: this.t('toolkit.quickPath.copy_multiple_files_path'),
      icon: 'copy',
      callback: () => {
        const paths = files
          .map(file => this.getPath(file))
          .join(this.config.pathSeparator || '\n');
        this.copyToClipboard(paths);
      }
    });
  }

  private getPath(file: TFile | TFolder): string {
    return this.config.useAbsolutePath 
      ? `${this.basePath}/${file.path}`
      : file.path;
  }

  private copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.logger.debug("Copied to clipboard");
      this.logger.notice(this.t('toolkit.quickPath.copy_success'));
    }).catch((error) => {
      this.logger.error("Failed to copy to clipboard", error);
      this.logger.notice(this.t('toolkit.quickPath.copy_failed'));
    });
  }

  protected onModuleUnload(): void {
    this.logger.info("Unloading quick path manager");
  }
}