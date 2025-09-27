import { ChevronDown } from "lucide-react";
import * as React from "react";
import "./styles/SuggestionInput.css";

interface SuggestionInputProps {
	value: string;
	onChange: (value: string) => void;
	suggestions?: string[];
	placeholder?: string;
	disabled?: boolean;
}

export const SuggestionInput: React.FC<SuggestionInputProps> = ({
	value,
	onChange,
	suggestions = [],
	placeholder,
	disabled = false,
}) => {
	const [showSuggestions, setShowSuggestions] = React.useState(false);
	const [selectedIndex, setSelectedIndex] = React.useState(-1);
	const containerRef = React.useRef<HTMLDivElement>(null);
	const inputRef = React.useRef<HTMLInputElement>(null);

	const filteredSuggestions = React.useMemo(() => {
		if (!value) return suggestions;
		return suggestions.filter((suggestion) =>
			suggestion.toLowerCase().includes(value.toLowerCase())
		);
	}, [suggestions, value]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		onChange(newValue);

		if (suggestions.length > 0) {
			setShowSuggestions(true);
			setSelectedIndex(-1);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (!showSuggestions || filteredSuggestions.length === 0) return;

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setSelectedIndex((prev) =>
					prev < filteredSuggestions.length - 1 ? prev + 1 : 0
				);
				break;
			case "ArrowUp":
				e.preventDefault();
				setSelectedIndex((prev) =>
					prev > 0 ? prev - 1 : filteredSuggestions.length - 1
				);
				break;
			case "Enter":
				e.preventDefault();
				if (selectedIndex >= 0) {
					onChange(filteredSuggestions[selectedIndex]);
					setShowSuggestions(false);
					setSelectedIndex(-1);
				}
				break;
			case "Escape":
				setShowSuggestions(false);
				setSelectedIndex(-1);
				break;
		}
	};

	const selectSuggestion = (suggestion: string) => {
		onChange(suggestion);
		setShowSuggestions(false);
		setSelectedIndex(-1);
		inputRef.current?.focus();
	};

	const toggleSuggestions = () => {
		if (disabled) return;
		setShowSuggestions(!showSuggestions);
		setSelectedIndex(-1);
	};

	// 点击外部关闭建议
	React.useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setShowSuggestions(false);
				setSelectedIndex(-1);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	return (
		<div className="rht-suggestion-input-container" ref={containerRef}>
			<div className="rht-suggestion-input-wrapper">
				<input
					ref={inputRef}
					className={`rht-suggestion-input ${
						disabled ? "disabled" : ""
					}`}
					value={value}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					onFocus={() =>
						suggestions.length > 0 && setShowSuggestions(true)
					}
					placeholder={placeholder}
					disabled={disabled}
				/>
				{suggestions.length > 0 && !disabled && (
					<button
						type="button"
						className="rht-suggestion-input-toggle"
						onClick={toggleSuggestions}
						tabIndex={-1}
					>
						<ChevronDown
							size={16}
							className={`rht-suggestion-input-icon ${
								showSuggestions ? "rotated" : ""
							}`}
						/>
					</button>
				)}
			</div>

			{showSuggestions && filteredSuggestions.length > 0 && (
				<div className="rht-suggestion-input-dropdown">
					{filteredSuggestions.map((suggestion, index) => (
						<div
							key={suggestion}
							className={`rht-suggestion-input-option ${
								index === selectedIndex ? "selected" : ""
							}`}
							onClick={() => selectSuggestion(suggestion)}
						>
							{suggestion}
						</div>
					))}
				</div>
			)}
		</div>
	);
};
