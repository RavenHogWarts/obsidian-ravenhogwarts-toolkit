import * as React from "react";
import "./styles/Input.css";

interface InputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
	error?: string;
	value: string | number;
	onChange: (value: string) => void;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
	(
		{ className = "", error, value, onChange, type = "text", ...props },
		ref
	) => {
		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = e.target.value;
			onChange(newValue);
		};

		return (
			<div className="rht-input-wrapper">
				<input
					ref={ref}
					className={`rht-input ${
						error ? "rht-input-error" : ""
					} ${className}`}
					value={value}
					onChange={handleChange}
					type={type}
					{...props}
				/>
				{error && (
					<div className="rht-input-error-message">{error}</div>
				)}
			</div>
		);
	}
);

Input.displayName = "Input";
