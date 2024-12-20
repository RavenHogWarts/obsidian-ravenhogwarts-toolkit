import { IToolkitModule } from "@/src/manager/types";
import { IQuickPathConfig, IQuickPathData } from "../types/config";
import { BaseManager } from "@/src/manager/BaseManager";
import RavenHogwartsToolkitPlugin from "@/src/main";
import { TFolder } from "obsidian";
import { Menu } from "obsidian";
import { TFile } from "obsidian";
import { Editor } from "obsidian";

interface IQuickPathModule extends IToolkitModule {
  config: IQuickPathConfig;
  data: IQuickPathData;
}

export class QuickPathManager extends BaseManager<IQuickPathModule> {
  private basePath: string;

  protected async onModuleLoad(): Promise<void> {
    this.logger.info("Loading quick path manager");
    this.basePath = (this.app.vault.adapter as any).getBasePath()?.replace(/\\/g, '/') || '';

    // 注册文件菜单（单个文件/文件夹）
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu: Menu, file: TFile | TFolder) => {
        if (!this.isEnabled()) return;
        if (file instanceof TFolder) {
          this.addMenuItem(menu, {
            title: this.t('toolkit.quickPath.file_menu.copy_folderPath'),
            icon: 'folder-closed',
            callback: () => {
              const path = this.getPath(file);
              this.copyToClipboard(path);
            }
          });
        } else {
          this.addMenuItem(menu, {
            title: this.t('toolkit.quickPath.file_menu.copy_filePath'),
            icon: 'file-text',
            callback: () => {
              const path = this.getPath(file);
              this.copyToClipboard(path);
            }
          });
        }
      })
    );
    // 注册文件菜单（多个文件）
    this.registerEvent(
      this.app.workspace.on("files-menu", (menu: Menu, files: (TFile | TFolder)[]) => {
        if (!this.isEnabled()) return;
        this.addMenuItem(menu, {
          title: this.t('toolkit.quickPath.file_menu.copy_filesPath'),
          icon: 'copy',
          callback: () => {
            const paths = files
              .filter((item): item is TFile => item instanceof TFile)
              .map(file => this.getPath(file))
              .join(this.config.pathSeparator || '\n');
            this.copyToClipboard(paths);
          }
        });
      })
    );

    // 注册编辑器菜单
    if (this.config.addEditorMenu) {
      this.registerEvent(
          this.app.workspace.on("editor-menu", (menu: Menu, editor: Editor) => {
          this.addMenuItem(menu, [
            {
              title: this.t('toolkit.quickPath.editor_menu.paste_filePath'),
              icon: 'copy',
              order: 1,
              callback: () => {
                const activeFile = this.app.workspace.getActiveFile();
                if (activeFile) {
                  const path = this.getPath(activeFile);
                  this.copyToClipboard(path, false);
                  editor.replaceSelection(path);
                }
              }
            },
            {
              title: this.t('toolkit.quickPath.editor_menu.paste_folderPath'),
              icon: 'folder',
              order: 2,
              callback: () => {
                const activeFile = this.app.workspace.getActiveFile();
                const parentPath = activeFile && this.getParentPath(activeFile);
                if (parentPath) {
                  this.copyToClipboard(parentPath, false);
                  editor.replaceSelection(parentPath);
                } else {
                  this.logger.notice(this.t('toolkit.quickPath.status.no_parent_path'));
                }
              }
            }
          ], { useSubmenu: true })
        })
      );
    }

    // 保留原有的命令注册（这些只复制，不粘贴）
    this.addCommand({
      id: 'copyPath',
      name: this.t('toolkit.quickPath.command.copy_filePath'),
      callback: () => {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
          const path = this.getPath(activeFile);
          this.copyToClipboard(path);
        }
      }
    });

    this.addCommand({
      id: 'copyParentPath',
      name: this.t('toolkit.quickPath.command.copy_folderPath'),
      callback: () => {
        const activeFile = this.app.workspace.getActiveFile();
        const parentPath = activeFile && this.getParentPath(activeFile);
        if (parentPath) {
          this.copyToClipboard(parentPath);
        } else {
          this.logger.notice(this.t('toolkit.quickPath.status.no_parent_path'));
        }
      }
    });
  }

  private getParentPath(file: TFile | TFolder): string | null {
    const path = this.config.useAbsolutePath 
      ? `${this.basePath}/${file.path}`
      : file.path;
    const lastSlashIndex = path.lastIndexOf('/');
    if (lastSlashIndex === -1) return null;
    return path.substring(0, lastSlashIndex);
  }

  private getPath(file: TFile | TFolder): string {
    return this.config.useAbsolutePath 
      ? `${this.basePath}/${file.path}`
      : file.path;
  }

  private copyToClipboard(text: string, showNotice = true): void {
    navigator.clipboard.writeText(text).then(() => {
      this.logger.debug("Copied to clipboard");
      if (showNotice) {
        this.logger.notice(this.t('toolkit.quickPath.status.copy_success'));
      }
    }).catch((error) => {
      this.logger.error("Failed to copy to clipboard", error);
      if (showNotice) {
        this.logger.notice(this.t('toolkit.quickPath.status.copy_failed'));
      }
    });
  }

  protected onModuleUnload(): void {
    this.logger.info("Unloading quick path manager");
  }
}