export interface ICustomIconsConfig {
  enabled: boolean;
}

export interface ICustomIconsData {
  lastModified: string;
  fileExtensionIcons: Record<string, string>;
  folderIcons: Record<string, string>;
  tabIcons: {
    files: Record<string, string>;
    system: {
      files: string;
      tags: string;
      search: string;
      outline: string;
      allProperties: string;
      fileProperties: string;
      incomingLinks: string;
      outgoingLinks: string;
    }
  }
}

export const CUSTOM_ICONS_DEFAULT_CONFIG: ICustomIconsConfig = {
  enabled: true,
};
