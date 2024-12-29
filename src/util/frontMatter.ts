import { App, TFile } from "obsidian";
import RavenHogwartsToolkitPlugin from "../main";
import { Logger, rootLogger } from "./log";

export interface IFrontMatterData {
    [key: string]: any;
}

export async function createFrontMatter(file: TFile, newFrontmatter: IFrontMatterData): Promise<void> {
    try {
        await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
            Object.assign(frontmatter, newFrontmatter);
        });
    } catch (e) {
        rootLogger.error(`Failed to create/update front matter for file ${file.path}: ${e.message}`);
    }
}

export async function deleteFrontMatter(file: TFile, keysToDelete: string[]): Promise<void> {
    try {
        this.app.fileManager.processFrontMatter(file, (frontmatter) => {
            keysToDelete.forEach((key) => {
                delete frontmatter[key];
            });
        });
    } catch (e) {
        rootLogger.error(`Failed to delete front matter keys for file ${file.path}: ${e.message}`);
    }
}

export async function updateFrontMatter(
    file: TFile, 
    updateFrontmatterFunc: (frontmatter: IFrontMatterData) => void
): Promise<void> {
    try {
        await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
            updateFrontmatterFunc(frontmatter);
        });
    } catch (e) {
        rootLogger.error(`Failed to update front matter for file ${file.path}: ${e.message}`);
    }
}

export async function readFrontMatter(file: TFile): Promise<IFrontMatterData | undefined> {
    try {
        let frontmatterData: IFrontMatterData | undefined;
        await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
            frontmatterData = { ...frontmatter };
        });
        return frontmatterData;
    } catch (e) {
        rootLogger.error(`Failed to read front matter from file ${file.path}: ${e.message}`);
        return undefined;
    }
}

export async function replaceFrontMatterKey(file: TFile, oldKey: string, newKey: string): Promise<void> {
    try {
        await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
            // 如果旧属性存在，将其值复制到新属性并删除旧属性
            if (oldKey in frontmatter) {
                const value = frontmatter[oldKey];
                frontmatter[newKey] = value;
                delete frontmatter[oldKey];
            }
        });
    } catch (e) {
        rootLogger.error(`Failed to replace front matter key from ${oldKey} to ${newKey} for file ${file.path}: ${e.message}`);
    }
}

export async function hasFrontMatterKey(file: TFile, key: string): Promise<boolean> {
    const data = await this.readFrontMatter(file);
    return data ? key in data : false;
}

export async function getFrontMatterValue(file: TFile, key: string): Promise<any | undefined> {
    const data = await this.readFrontMatter(file);
    return data?.[key];
}