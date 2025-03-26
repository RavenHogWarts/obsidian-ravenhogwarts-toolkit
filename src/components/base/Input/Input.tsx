import * as React from "react";
import "./styles/Input.css";

interface InputProps
	extends Omit<
		React.InputHTMLAttributes<HTMLInputElement>,
		"onChange" | "prefix"
	> {
	error?: string;
	value: string | number;
	prefix?: React.ReactNode;
	onChange: (value: string) => void;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
	(
		{
			className = "",
			error,
			value,
			onChange,
			type = "text",
			prefix,
			...props
		},
		ref
	) => {
		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = e.target.value;
			onChange(newValue);
		};

		return (
			<div className="rht-input-wrapper">
				{prefix && <div className="rht-input-prefix">{prefix}</div>}
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
