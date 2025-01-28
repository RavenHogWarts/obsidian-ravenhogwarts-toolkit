import * as React from "react";
import { LucideIcon } from "lucide-react";
import "./styles/Card.css";

interface CardProps {
	title: string;
	icon?: LucideIcon;
	description?: string;
	actions?: React.ReactNode;
	className?: string;
	children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
	title,
	icon: Icon,
	description,
	actions,
	className,
	children,
}) => {
	return (
		<div className={`rht-card ${className}`}>
			<div className="rht-card-header">
				<div className="rht-card-title">
					{Icon && <Icon size={20} className="rht-card-icon" />}
					<h3 className="rht-card-title-text">{title}</h3>
				</div>
				{actions && <div className="rht-card-actions">{actions}</div>}
			</div>
			{description && (
				<p className="rht-card-description">{description}</p>
			)}
			{children && <div className="rht-card-content">{children}</div>}
		</div>
	);
};
