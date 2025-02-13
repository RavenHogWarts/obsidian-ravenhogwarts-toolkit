import * as React from "react";
import { ChevronRight } from "lucide-react";
import { HeadingCache } from "obsidian";

interface TOCItemProps {
	heading: HeadingCache;
	index: number;
	actualDepth: number;
	headingNumber: string;
	showChildren: boolean;
	isCollapsed: boolean;
	isActive: boolean;
	useHeadingNumber: boolean;
	onHeadingClick: (heading: HeadingCache) => void;
	onCollapse: (index: number) => void;
	getCleanHeadingText: (heading: string) => string;
}

export const TOCItem: React.FC<TOCItemProps> = React.memo(
	({
		heading,
		index,
		actualDepth,
		headingNumber,
		showChildren,
		isCollapsed,
		isActive,
		useHeadingNumber,
		onHeadingClick,
		onCollapse,
		getCleanHeadingText,
	}) => {
		return (
			<div
				className="rht-toc-item"
				data-index={index}
				data-depth={heading.level}
				data-relative-depth={actualDepth}
				data-line={heading.position.start.line}
				data-active={isActive}
				onClick={() => onHeadingClick(heading)}
			>
				<div className="rht-toc-item-content">
					{showChildren && (
						<button
							className="rht-toc-collapse-btn clickable-icon"
							onClick={(e) => {
								e.stopPropagation();
								onCollapse(index);
							}}
						>
							<ChevronRight
								size={14}
								className={`rht-toc-collapse-icon ${
									isCollapsed ? "" : "expanded"
								}`}
							/>
						</button>
					)}
					<span className="rht-toc-item-text">
						<span
							className="rht-toc-item-number"
							style={{
								display: useHeadingNumber ? "inline" : "none",
							}}
						>
							{headingNumber}
						</span>
						{getCleanHeadingText(heading.heading)}
					</span>
				</div>
				<span className="rht-toc-item-level">H{heading.level}</span>
			</div>
		);
	}
);

TOCItem.displayName = "TOCItem";
