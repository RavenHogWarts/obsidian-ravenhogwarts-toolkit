import { X } from "lucide-react";
import * as React from "react";
import "./styles/TagInput.css";

interface TagInputProps {
	values: string[];
	onChange: (values: string[]) => void;
	suggestions?: string[];
	placeholder?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
	values,
	onChange,
	suggestions = [],
	placeholder,
}) => {
	const [inputValue, setInputValue] = React.useState("");
	const [showSuggestions, setShowSuggestions] = React.useState(false);
	const [selectedIndex, setSelectedIndex] = React.useState(-1);
	const containerRef = React.useRef<HTMLDivElement>(null);

	const filteredSuggestions = React.useMemo(() => {
		return suggestions.filter(
			(suggestion) =>
				suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
				!values.includes(suggestion)
		);
	}, [suggestions, inputValue, values]);

	const addValue = (value: string) => {
		if (value && !values.includes(value)) {
			onChange([...values, value.trim()]);
			setInputValue("");
			setShowSuggestions(false);
			setSelectedIndex(-1);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				if (filteredSuggestions.length > 0) {
					setShowSuggestions(true);
					setSelectedIndex((prev) =>
						prev < filteredSuggestions.length - 1 ? prev + 1 : prev
					);
				}
				break;
			case "ArrowUp":
				e.preventDefault();
				if (filteredSuggestions.length > 0) {
					setShowSuggestions(true);
					setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
				}
				break;
			case "Enter":
				e.preventDefault();
				if (selectedIndex >= 0 && filteredSuggestions.length > 0) {
					addValue(filteredSuggestions[selectedIndex]);
				} else if (inputValue.trim()) {
					addValue(inputValue);
				}
				break;
			case "Escape":
				setShowSuggestions(false);
				setSelectedIndex(-1);
				break;
			case ",":
			case ";":
				e.preventDefault();
				if (inputValue.trim()) {
					addValue(inputValue);
				}
				break;
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		setInputValue(newValue);

		if (newValue.includes(",") || newValue.includes(";")) {
			const tags = newValue
				.split(/[,;]/)
				.map((tag) => tag.trim())
				.filter(Boolean);
			tags.forEach((tag) => addValue(tag));
			return;
		}

		if (suggestions.length > 0) {
			const hasSuggestions = suggestions.some(
				(s) =>
					s.toLowerCase().includes(newValue.toLowerCase()) &&
					!values.includes(s)
			);
			setShowSuggestions(hasSuggestions);
			if (hasSuggestions) {
				setSelectedIndex(-1);
			}
		}
	};

	const handleFocusCapture = (e: React.FocusEvent) => {
		if (containerRef.current?.contains(e.target)) {
			if (suggestions.filter((s) => !values.includes(s)).length > 0) {
				setShowSuggestions(true);
			}
		}
	};

	const handleSuggestionClick = (suggestion: string) => {
		addValue(suggestion);
		setInputValue("");
		setSelectedIndex(-1);
		setShowSuggestions(false);
	};

	const handleBlurCapture = (e: React.FocusEvent) => {
		requestAnimationFrame(() => {
			if (!containerRef.current?.contains(e.relatedTarget)) {
				setShowSuggestions(false);
				setSelectedIndex(-1);
			}
		});
	};

	return (
		<div
			className="rht-tag-input"
			ref={containerRef}
			onFocusCapture={handleFocusCapture}
			onBlurCapture={handleBlurCapture}
		>
			<div className="rht-tag-input-container">
				<input
					type="text"
					value={inputValue}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					className="rht-tag-input-field"
				/>
				{showSuggestions && filteredSuggestions.length > 0 && (
					<div
						className="rht-tag-suggestions"
						onMouseDown={(e) => {
							e.preventDefault();
						}}
					>
						{filteredSuggestions.map((suggestion, index) => (
							<div
								key={index}
								className={`rht-tag-suggestion-item ${
									index === selectedIndex ? "selected" : ""
								}`}
								onMouseDown={(e) => {
									e.preventDefault();
									handleSuggestionClick(suggestion);
								}}
								onMouseEnter={() => setSelectedIndex(index)}
							>
								{suggestion}
							</div>
						))}
					</div>
				)}
			</div>
			<div className="rht-tags-container">
				{values.map((value, index) => (
					<div
						key={index}
						className="rht-tag-item"
						aria-label={value}
					>
						<span className="rht-tag-text">{value}</span>
						<span
							className="rht-tag-remove"
							onClick={() =>
								onChange(values.filter((v) => v !== value))
							}
							aria-label="Remove tag"
						>
							<X size={14} />
						</span>
					</div>
				))}
			</div>
		</div>
	);
};
