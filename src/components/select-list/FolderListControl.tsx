import { useObsidianApp } from "@src/hook/obsidianAppContext";
import { Strings } from "@src/util/Strings";
import { TFolder } from "obsidian";
import { FC } from "react";
import { SelectList, SelectOption } from "./SelectList";

interface FolderListControlProps {
	value: any;
	onValueChange: (value: any) => void;
	folders?: TFolder[];
	multiple?: boolean;
	autoFocus?: boolean;
	placeholder?: string;
}

export const FolderListControl: FC<FolderListControlProps> = ({
	value,
	onValueChange,
	folders,
	multiple,
	autoFocus,
	placeholder,
}) => {
	const app = useObsidianApp();

	let suggests: TFolder[] = [];
	if (folders) {
		suggests = folders;
	} else {
		suggests = app.vault.getAllFolders();
	}

	const getOptions = (searchText: string): SelectOption[] => {
		return suggests
			.filter((f) => {
				if (Strings.isEmpty(searchText)) {
					return true;
				}
				const folderPath = Strings.safeToLowerCaseString(f.path);
				const searchValue = searchText.toLowerCase();
				return folderPath.includes(searchValue);
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
