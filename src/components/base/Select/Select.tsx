import * as React from "react";
import "./styles/Select.css";

interface SelectOption {
	value: any;
	label: string;
}

interface SelectProps {
	value: any;
	onValueChange: (value: any) => void;
	options: SelectOption[];
	placeholder?: string;
	className?: string;
	error?: string;
}

export const Select: React.FC<SelectProps> = ({
	value,
	onValueChange,
	options,
	placeholder = "Select an option",
	className = "",
	error,
}) => {
	const [isOpen, setIsOpen] = React.useState(false);
	const selectRef = React.useRef<HTMLDivElement>(null);

	const selectedOption = options.find((opt) => opt.value === value);

	React.useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				selectRef.current &&
				!selectRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<div className="rht-select-wrapper" ref={selectRef}>
			<div
				className={`rht-select ${isOpen ? "rht-select-open" : ""} ${
					error ? "rht-select-error" : ""
				} ${className}`}
				onClick={() => setIsOpen(!isOpen)}
			>
				<span className="rht-select-value">
					{selectedOption ? selectedOption.label : placeholder}
				</span>
				<span className="rht-select-arrow">▼</span>
			</div>
			{isOpen && (
				<div className="rht-select-dropdown">
					{options.map((option) => (
						<div
							key={option.value}
							className={`rht-select-option ${
								option.value === value
									? "rht-select-option-selected"
									: ""
							}`}
							onClick={() => {
								onValueChange(option.value);
								setIsOpen(false);
							}}
						>
							{option.label}
						</div>
					))}
				</div>
			)}
			{error && <div className="rht-select-error-message">{error}</div>}
		</div>
	);
};
