import { ChevronDown, ChevronRight } from "lucide-react";
import * as React from "react";
import "./styles/OverviewSettingItem.css";

interface OverviewSettingItemProps {
	name: string;
	desc?: string;
	icon?: React.ReactNode;
	children?: React.ReactNode;
	collapsible?: boolean;
	defaultCollapsed?: boolean;
}

export const OverviewSettingItem: React.FC<OverviewSettingItemProps> = ({
	name,
	desc,
	icon,
	children,
	collapsible,
	defaultCollapsed,
}) => {
	const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
	return (
		<div
			className={`rht-overview-setting-item ${
				collapsible ? "is-collapsible" : ""
			}`}
		>
			<div className={"rht-overview-setting-item-info"}>
				<div
					className="rht-overview-setting-item-heading"
					onClick={
						collapsible
							? () => setIsCollapsed(!isCollapsed)
							: undefined
					}
				>
					{icon && (
						<span className="rht-overview-setting-item-icon">
							{icon}
						</span>
					)}
					<div className="rht-overview-setting-item-name">{name}</div>
					{collapsible && (
						<span className="rht-overview-setting-item-collapse-icon">
							{isCollapsed ? (
								<ChevronRight size={16} />
							) : (
								<ChevronDown size={16} />
							)}
						</span>
					)}
				</div>
				{desc && (
					<div className="rht-overview-setting-item-description">
						{desc}
					</div>
				)}
			</div>
			{children && !isCollapsed && (
				<div className="rht-overview-setting-item-control">
					{children}
				</div>
			)}
		</div>
	);
};
