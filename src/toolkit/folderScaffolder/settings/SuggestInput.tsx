import { App } from "obsidian";
import { useEffect, useRef } from "react";
import { FolderSuggest } from "@src/settings/suggest";

interface Props {
	app: App;
	value: string;
	placeholder?: string;
	onChange: (value: string) => void;
}

/**
 * 受控文本输入，挂载时附加 Obsidian 文件夹联想。
 *
 * 联想选中与手动输入都走同一个 `onChange`；联想器只在 app 变化时重建，
 * `onChange` 通过 ref 取最新值，避免每次渲染都重建联想器。
 */
export function SuggestInput({ app, value, placeholder, onChange }: Props) {
	const inputRef = useRef<HTMLInputElement>(null);
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;

	useEffect(() => {
		const el = inputRef.current;
		if (!el) return;
		const suggest = new FolderSuggest(app, el, (path) =>
			onChangeRef.current(path)
		);
		return () => suggest.close();
	}, [app]);

	return (
		<input
			ref={inputRef}
			type="text"
			className="rht-fs-input"
			spellCheck={false}
			placeholder={placeholder}
			value={value}
			onChange={(e) => onChange(e.target.value)}
		/>
	);
}
