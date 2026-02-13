import { useObsidianApp } from "@src/hook/obsidianAppContext";
import { Strings } from "@src/util/Strings";
import { TFile } from "obsidian";
import { FC } from "react";
import { SelectList, SelectOption } from "./SelectList";

interface FileListControlProps {
	value: any;
	onValueChange: (value: any) => void;
	files?: TFile[];
	multiple?: boolean;
	autoFocus?: boolean;
	placeholder?: string;
}

export const FileListControl: FC<FileListControlProps> = ({
	value,
	onValueChange,
	files,
	multiple,
	autoFocus,
	placeholder,
}) => {
	const app = useObsidianApp();

	let suggests: TFile[] = [];
	if (files) {
		suggests = files.filter((f) => f.extension === "md");
	} else {
		suggests = app.vault.getMarkdownFiles();
	}

	const getOptions = (searchText: string): SelectOption[] => {
		return suggests
			.filter((f) => {
				if (Strings.isEmpty(searchText)) {
					return true;
				}
				const filePath = Strings.safeToLowerCaseString(f.path);
				const searchValue = searchText.toLowerCase();
				return filePath.includes(searchValue);
			})
			.slice(0, 100)
			.map((f) => ({
				id: f.path,
				value: f.path,
				label: f.path,
			}));
	};

	return (
		<SelectList
			value={value}
			onValueChange={onValueChange}
			multiple={multiple}
			autoFocus={autoFocus}
			getOptions={getOptions}
			placeholder={placeholder}
		/>
	);
};
