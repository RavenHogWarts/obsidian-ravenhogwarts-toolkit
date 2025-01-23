import * as React from "react";

interface ProgressRingProps {
	progress: number;
	size?: number;
	strokeWidth?: number;
	color?: string;
	backgroundColor?: string;
	showText?: boolean;
	text?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
	progress,
	size = 24,
	strokeWidth = 2,
	color = "var(--interactive-accent)",
	backgroundColor = "var(--background-modifier-border)",
	showText = false,
	text = null,
}) => {
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (progress / 100) * circumference;

	return (
		<span className="rht-progress-ring-container">
			<svg
				className="rht-progress-ring"
				width={size}
				height={size}
				viewBox={`0 0 ${size} ${size}`}
				style={{ transform: "rotate(-90deg)" }}
			>
				{/* 背景圆环 */}
				<circle
					className="rht-progress-ring-bg"
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke={backgroundColor}
					strokeWidth={strokeWidth}
				/>
				{/* 进度圆环 */}
				<circle
					className="rht-progress-ring-fg"
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke={color}
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					style={{ transition: "stroke-dashoffset 0.3s ease" }}
				/>
			</svg>
			{showText && text && (
				<span className="rht-progress-text">{text}</span>
			)}
		</span>
	);
};
