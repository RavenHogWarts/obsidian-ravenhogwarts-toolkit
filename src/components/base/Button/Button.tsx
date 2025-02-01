import * as React from "react";
import "./styles/Button.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "default" | "outline" | "ghost";
	size?: "small" | "medium" | "large";
}

export const Button: React.FC<ButtonProps> = ({
	children,
	className = "",
	variant = "default",
	size = "medium",
	...props
}) => {
	return (
		<button
			className={`rht-button rht-button-${variant} rht-button-${size} ${className}`}
			{...props}
		>
			{children}
		</button>
	);
};
