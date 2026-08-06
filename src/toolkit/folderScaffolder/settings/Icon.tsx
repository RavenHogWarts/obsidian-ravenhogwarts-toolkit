import { setIcon } from "obsidian";
import { useEffect, useRef } from "react";

/** 用 Obsidian 内置 setIcon 渲染一个 Lucide 图标（保持与主题一致的图标集）。 */
export function Icon({ name }: { name: string }) {
	const ref = useRef<HTMLSpanElement>(null);
	useEffect(() => {
		if (ref.current) {
			setIcon(ref.current, name);
		}
	}, [name]);
	return <span className="rht-fs-icon" ref={ref} />;
}
