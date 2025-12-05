import { useObsidianApp } from "@src/hook/obsidianAppContext";
import { Folder } from "lucide-react";
import { TFolder } from "obsidian";
import { FC, useMemo } from "react";
import { ComboboxSuggestion } from "./ComboboxSuggestion";

interface FolderSuggestProps {
	value: string;
	onChange: (value: string) => void;
	folders?: TFolder[];
	placeholder?: string;
}

export const FolderSuggestInput: FC<FolderSuggestProps> = ({
	value,
	onChange,
	folders,
	placeholder,
}) => {
	const app = useObsidianApp();

	let suggests: TFolder[] = [];
	if (folders) {
		suggests = folders;
	} else {
		suggests = app.vault.getAllFolders();
	}

	const items = useMemo(() => {
		const options = suggests.map((f) => {
			return {
				value: f.path,
				label: f.path,
				icon: <Folder size={14} />,
			};
		});
		return options;
	}, []);

	return (
		<ComboboxSuggestion
			value={value}
			onChange={onChange}
			options={items}
			placeholder={placeholder}
		/>
	);
};
