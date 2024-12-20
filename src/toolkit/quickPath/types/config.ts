import { IToolkitModuleConfig, IToolkitModuleData } from "@/src/manager/types";

export interface IQuickPathConfig extends IToolkitModuleConfig {
  // 是否使用绝对路径
  useAbsolutePath: boolean;
  // 多文件路径分隔符
  pathSeparator: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IQuickPathData extends IToolkitModuleData {
  // 可以添加其他数据字段
}

export const QUICK_PATH_DEFAULT_CONFIG: IQuickPathConfig = {
  enabled: true,
  useAbsolutePath: false,
  pathSeparator: '\n',
  addEditorMenu: true,
};
