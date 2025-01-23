import * as React from "react";

interface ToggleProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
	className?: string;
	disabled?: boolean;
	"aria-label"?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
	checked,
	onChange,
	className = "",
	disabled = false,
	"aria-label": ariaLabel,
}) => {
	const handleChange = React.useCallback(() => {
		if (!disabled) {
			onChange(!checked);
		}
	}, [checked, disabled, onChange]);

	const handleKeyDown = React.useCallback(
		(e: React.KeyboardEvent) => {
			if (disabled) return;
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				onChange(!checked);
			}
		},
		[checked, disabled, onChange]
	);
	return (
		<div
			className={`rht-toggle ${checked ? "is-enabled" : ""} ${
				disabled ? "is-disabled" : ""
			} ${className}`}
			onClick={handleChange}
			role="switch"
			aria-checked={checked}
			aria-disabled={disabled}
			aria-label={ariaLabel}
			tabIndex={disabled ? -1 : 0}
			onKeyDown={handleKeyDown}
		>
			<div className="rht-toggle-slider" />
		</div>
	);
};
