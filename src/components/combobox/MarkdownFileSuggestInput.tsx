import { useObsidianApp } from "@src/hook/obsidianAppContext";
import { TFile } from "obsidian";
import { FC, useMemo } from "react";
import { ComboboxSuggestion } from "./ComboboxSuggestion";

interface MarkdownFileSuggestInputProps {
	value: string;
	onChange: (value: string) => void;
	files?: TFile[];
	placeholder?: string;
	immediate?: boolean;
}

export const MarkdownFileSuggestInput: FC<MarkdownFileSuggestInputProps> = ({
	value,
	onChange,
	files,
	placeholder,
	immediate,
}) => {
	const app = useObsidianApp();

	let suggests: TFile[] = [];
	if (files) {
		suggests = files.filter((f) => f.extension === "md");
	} else {
		suggests = app.vault.getMarkdownFiles();
	}

	const items = useMemo(() => {
		const options = suggests.map((f) => {
			return {
				value: f.path,
				label: f.path,
				description: f.path,
			};
		});
		return options;
	}, []);

	return (
		<ComboboxSuggestion
			value={value}
			placeholder={placeholder || ""}
			onChange={onChange}
			options={items}
		/>
	);
};
