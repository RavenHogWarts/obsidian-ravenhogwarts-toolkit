import { ITool } from "@src/model/toolkit/ITool";
import { IToolInfo } from "@src/model/toolkit/IToolInfo";
import "reflect-metadata";
import { ToolkitRegistry } from "./ToolkitRegistry";

export function Toolkit(info: IToolInfo) {
	return function <T extends new () => ITool>(constructor: T): T {
		if (!info || !info.id || !info.name) {
			throw new Error(
				"Tool info must have at least 'id' and 'name' properties."
			);
		}

		const TOOLKIT_META = Symbol.for("toolkit:meta");
		Reflect.defineMetadata(TOOLKIT_META, info, constructor);

		const registry = ToolkitRegistry.getInstance();
		registry.register(info.id, constructor);

		Object.defineProperty(constructor.prototype, "toolkitMeta", {
			get: () => {
				return Reflect.getMetadata(TOOLKIT_META, constructor);
			},
			configurable: false,
			enumerable: false,
		});

		Object.defineProperty(constructor.prototype, "id", {
			get() {
				return info.id;
			},
			configurable: false,
			enumerable: true,
		});
		Object.defineProperty(constructor.prototype, "name", {
			get() {
				return info.name;
			},
			configurable: false,
			enumerable: true,
		});
		Object.defineProperty(constructor.prototype, "version", {
			get() {
				return info.version || "1.0.0";
			},
			configurable: false,
			enumerable: true,
		});
		Object.defineProperty(constructor.prototype, "description", {
			get() {
				return info.description || "";
			},
			configurable: false,
			enumerable: true,
		});

		return constructor;
	};
}
