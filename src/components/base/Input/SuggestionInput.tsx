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
		// 如果输入为空，显示所有建议（限制数量）
		if (!value.trim()) {
			return suggestions;
		}

		const searchValue = value.toLowerCase().trim();
		return suggestions
			.filter((suggestion) =>
				suggestion.toLowerCase().includes(searchValue)
			)
			.sort((a, b) => {
				// 优先显示以搜索值开头的建议
				const aStartsWith = a.toLowerCase().startsWith(searchValue);
				const bStartsWith = b.toLowerCase().startsWith(searchValue);

				if (aStartsWith && !bStartsWith) return -1;
				if (!aStartsWith && bStartsWith) return 1;

				// 其次按字符串长度排序（更短的在前）
				return a.length - b.length;
			});
	}, [suggestions, value]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		onChange(newValue);

		// 有建议时显示建议框（不管输入是否为空）
		if (suggestions.length > 0) {
			setShowSuggestions(true);
			setSelectedIndex(-1);
		} else {
			setShowSuggestions(false);
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
					selectSuggestion(filteredSuggestions[selectedIndex]);
				}
				break;
			case "Escape":
				setShowSuggestions(false);
				setSelectedIndex(-1);
				inputRef.current?.blur();
				break;
		}
	};

	const selectSuggestion = (suggestion: string) => {
		onChange(suggestion);
		setShowSuggestions(false);
		setSelectedIndex(-1);
		// 失去焦点以确保建议框完全关闭
		inputRef.current?.blur();
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
			<input
				ref={inputRef}
				className={`rht-suggestion-input ${disabled ? "disabled" : ""}`}
				value={value}
				onChange={handleInputChange}
				onKeyDown={handleKeyDown}
				onFocus={() => {
					if (suggestions.length > 0) {
						setShowSuggestions(true);
					}
				}}
				placeholder={placeholder}
				disabled={disabled}
			/>

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
