import * as React from "react";
import { ChevronRight } from "lucide-react";
import { App, HeadingCache, MarkdownRenderer, MarkdownView } from "obsidian";
import { IReadingProgressConfig } from "../../types/config";

interface TOCItemProps {
	app: App;
	config: IReadingProgressConfig;
	currentView: MarkdownView;
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
		app,
		config,
		currentView,
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
		const [renderedHeading, setRenderedHeading] = React.useState("");

		React.useEffect(() => {
			const renderHeading = async () => {
				if (config.renderMarkdown) {
					// 使用 Obsidian 的 MarkdownRenderer 来渲染标题
					const tempEl = document.createElement("div");
					await MarkdownRenderer.render(
						app,
						heading.heading,
						tempEl,
						"",
						currentView
					);

					// 使用 createDiv 和 setHTML Obsidian 安全 API
					const contentEl = createDiv();
					const pElement = tempEl.querySelector("p");
					if (pElement) {
						// 只复制 p 元素的内容，而不是整个 p 标签
						Array.from(pElement.childNodes).forEach((node) => {
							contentEl.appendChild(node.cloneNode(true));
						});
					} else {
						// 如果没有 p 元素，复制所有子节点
						Array.from(tempEl.childNodes).forEach((node) => {
							contentEl.appendChild(node.cloneNode(true));
						});
					}

					setRenderedHeading(contentEl.innerHTML);
				} else {
					// 使用纯文本模式
					setRenderedHeading(getCleanHeadingText(heading.heading));
				}
			};

			renderHeading();
		}, [heading.heading, config.renderMarkdown]);

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
						{useHeadingNumber && headingNumber && (
							<span className="rht-toc-number">
								{headingNumber}
							</span>
						)}
						{config.renderMarkdown ? (
							<span
								className="rht-toc-text markdown-rendered"
								dangerouslySetInnerHTML={{
									__html: renderedHeading,
								}}
								style={{
									display: "inline-block",
								}}
							/>
						) : (
							<span className="rht-toc-text">
								{renderedHeading}
							</span>
						)}
					</span>
				</div>
				<span className="rht-toc-item-level">H{heading.level}</span>
			</div>
		);
	}
);

TOCItem.displayName = "TOCItem";
