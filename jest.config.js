module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	roots: ["<rootDir>"],
	testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
	transform: {
		"^.+\\.ts$": "ts-jest",
	},
	moduleFileExtensions: ["ts", "js", "json"],
	moduleNameMapper: {
		"^@src/(.*)$": "<rootDir>/src/$1",
		// obsidian 的 main 为空字符串、仅有类型声明；测试环境提供一个空运行时桩，
		// 使 import { TFolder } 这类「仅类型用」的依赖在运行时不致解析失败。
		"^obsidian$": "<rootDir>/test/__mocks__/obsidian.ts",
	},
	collectCoverageFrom: [
		"src/**/*.ts",
		"!src/**/*.d.ts",
		"!**/*.test.ts",
		"!**/*.spec.ts",
	],
	coverageDirectory: "coverage",
	coverageReporters: ["text", "lcov", "html"],
};
