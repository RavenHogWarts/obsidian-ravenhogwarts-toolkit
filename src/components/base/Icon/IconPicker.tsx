import * as React from "react";
import { App, getIconIds, IconName, setIcon, SuggestModal } from "obsidian";
import "./styles/IconPicker.css";

interface IconPickerProps {
	app: App;
	value: string;
	onChange: (value: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({
	app,
	value,
	onChange,
}) => {
	const [selectedIcon, setSelectedIcon] = React.useState<string>(value);
	const buttonRef = React.useRef<HTMLDivElement>(null);

	const handleClick = () => {
		const modal = new IconSelector(app, (icon) => {
			setSelectedIcon(icon);
			onChange(icon);
		});
		modal.open();
	};

	React.useEffect(() => {
		if (buttonRef.current) {
			setIcon(buttonRef.current, selectedIcon);
		}
	}, [selectedIcon]);

	return (
		<div
			className="rht-iconPick"
			ref={buttonRef}
			onClick={handleClick}
		></div>
	);
};

class IconSelector extends SuggestModal<IconName> {
	private callback: (icon: string) => void;

	constructor(app: App, callback: (icon: string) => void) {
		super(app);
		this.callback = callback;
		this.setInstructions([
			{ command: "↑↓", purpose: "Navigate" },
			{ command: "↵", purpose: "Select" },
			{ command: "esc", purpose: "Dismiss" },
		]);
	}

	getSuggestions(inputStr: string): IconName[] {
		const iconIds = getIconIds();
		const iconSuggestions: IconName[] = [];
		const lowerCaseInputStr = inputStr.toLowerCase();

		iconIds.forEach((id) => {
			if (id.toLowerCase().includes(lowerCaseInputStr)) {
				iconSuggestions.push(id.replace("lucide-", ""));
			}
		});

		return iconSuggestions;
	}

	renderSuggestion(icon: IconName, el: HTMLElement) {
		const suggestionEl = el.createDiv({ cls: "rht-icon-suggestion" });
		const iconEl = suggestionEl.createDiv({ cls: "rht-icon-display" });
		setIcon(iconEl, icon);
		suggestionEl.createSpan({ text: icon });
	}

	onChooseSuggestion(
		selectedItem: string,
		evt: MouseEvent | KeyboardEvent
	): void {
		this.callback(selectedItem);
		this.close();
	}
}
