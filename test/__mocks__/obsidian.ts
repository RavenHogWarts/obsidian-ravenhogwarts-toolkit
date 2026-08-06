/**
 * Obsidian 运行时桩（仅测试用）。
 *
 * obsidian 包仅含类型声明（package.json 的 main 为空），单元测试在 node 环境运行
 * 时无法解析该模块。本桩导出空壳，使「仅类型用」的 import（如 `import { TFolder }
 * from "obsidian"`）在运行时不致解析失败。被测的纯逻辑刻意不依赖这些符号的运行时
 * 值（TFolder 等为 undefined 时，鸭子类型遍历仍可工作）。
 */
export {};
