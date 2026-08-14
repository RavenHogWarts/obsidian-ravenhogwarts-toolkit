import { App, TFile } from "obsidian";
import { useEffect, useRef } from "react";
import { FileSuggest, FolderSuggest } from "@src/settings/suggest";

interface Props {
	app: App;
	kind: "file" | "folder";
	value: string;
	placeholder?: string;
	onChange: (value: string) => void;
	/** 仅对 kind="file" 生效：限定候选文件 */
	fileFilter?: (file: TFile) => boolean;
	/** 仅对 kind="file" 生效：把候选限定在该文件夹（惰性取值以反映最新配置） */
	baseFolder?: () => string;
}

/**
 * 受控文本输入，挂载时附加 Obsidian 文件/文件夹联想。
 *
 * 联想选中与手动输入都走同一个 `onChange`；联想器只在 app/kind 变化时重建，
 * `onChange`/`fileFilter` 通过 ref 取最新值，避免每次渲染都重建联想器。
 */
export function SuggestInput({
	app,
	kind,
	value,
	placeholder,
	onChange,
	fileFilter,
	baseFolder,
}: Props) {
	const inputRef = useRef<HTMLInputElement>(null);
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;
	const filterRef = useRef(fileFilter);
	filterRef.current = fileFilter;
	const baseFolderRef = useRef(baseFolder);
	baseFolderRef.current = baseFolder;

	useEffect(() => {
		const el = inputRef.current;
		if (!el) return;
		const suggest =
			kind === "file"
				? new FileSuggest(
						app,
						el,
						(path) => onChangeRef.current(path),
						{
							filter: (file) =>
								filterRef.current?.(file) ?? true,
							baseFolder: () => baseFolderRef.current?.() ?? "",
						}
					)
				: new FolderSuggest(
						app,
						el,
						(path) => onChangeRef.current(path),
						// 根目录不作为 FOLDER/EXCLUDE_FOLDER 的候选：整库范围用 ROOT 作用域表达
						{ includeRoot: false }
					);
		return () => suggest.close();
	}, [app, kind]);

	return (
		<input
			ref={inputRef}
			type="text"
			className="rht-ft-input"
			spellCheck={false}
			placeholder={placeholder}
			value={value}
			onChange={(e) => onChange(e.target.value)}
		/>
	);
}
