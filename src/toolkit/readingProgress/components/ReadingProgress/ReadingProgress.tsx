import * as React from "react";
import { App, HeadingCache, MarkdownView, setIcon } from "obsidian";
import { ProgressRing } from "@/src/components/base/ProgressRing/ProgressRing";
import { t } from "@/src/i18n/i18n";
import { IReadingProgressConfig } from "@/src/toolkit/readingProgress/types/config";
import "./styles/ReadingProgress.css";
import { TOCToolbar } from "./TOCToolbar";
import { TOCItem } from "./TOCItem";
import { useTOCDrag } from "../../hooks/useTOCDrag";
import {
	calculateActualDepth,
	getChildIndices,
	getCleanHeadingText,
	hasChildren,
	isUnderSameParent,
	smoothScroll,
} from "../../utils/tocUtils";

interface ReadingProgressProps {
	app: App;
	config: IReadingProgressConfig;
	currentView: MarkdownView;
	onConfigChange: (config: Partial<IReadingProgressConfig>) => void;
	headings: HeadingCache[];
	progress: number;
	onHeadingClick: (heading: HeadingCache) => void;
	activeHeadingIndex?: number;
	isEditing: boolean;
	onReturnClick: (target: "cursor" | "top" | "bottom") => void;
	onNavigateHeading: (direction: "next" | "previous") => void;
	collapsedItems: Set<number>;
	allCollapsed: boolean;
	onToggleCollapse: (index: number) => void;
	onToggleAll: () => void;
}

export const ReadingProgress: React.FC<ReadingProgressProps> = ({
	app,
	config,
	currentView,
	onConfigChange,
	headings,
	progress,
	onHeadingClick,
	activeHeadingIndex = -1,
	isEditing,
	onReturnClick,
	onNavigateHeading,
	collapsedItems,
	allCollapsed,
	onToggleCollapse,
	onToggleAll,
}) => {
	const [isHovered, setIsHovered] = React.useState(false);
	const tocListRef = React.useRef<HTMLDivElement>(null);
	const indicatorsRef = React.useRef<HTMLDivElement>(null);

	const { isMouseDragging, handleMouseDragStart } = useTOCDrag({
		config,
		onConfigChange,
		tocListRef,
	});

	// 添加平滑滚动效果
	React.useEffect(() => {
		if (activeHeadingIndex >= 0) {
			const activeElement = tocListRef.current?.querySelector(
				`[data-index="${activeHeadingIndex}"]`
			) as HTMLElement;
			const activeIndicator = indicatorsRef.current?.querySelector(
				`[data-index="${activeHeadingIndex}"]`
			) as HTMLElement;

			if (activeElement && tocListRef.current) {
				smoothScroll(tocListRef.current, activeElement);
			}

			if (activeIndicator && indicatorsRef.current) {
				smoothScroll(indicatorsRef.current, activeIndicator);
			}
		}
	}, [activeHeadingIndex]);

	// 计算并设置目录列表高度
	React.useEffect(() => {
		if (tocListRef.current) {
			const height = tocListRef.current.scrollHeight;
			document.documentElement.style.setProperty(
				"--toc-height",
				`${height}px`
			);
		}
	}, [headings]);

	const handlePinClick = React.useCallback(() => {
		onConfigChange?.({ tocAlwaysExpanded: !config.tocAlwaysExpanded });
	}, [config.tocAlwaysExpanded, onConfigChange]);

	const handlePositionFlip = React.useCallback(() => {
		const newPosition = config.position === "left" ? "right" : "left";
		onConfigChange?.({ position: newPosition });
	}, [config.position, onConfigChange]);

	const handleOffsetChange = React.useCallback(
		(direction: "left" | "right") => {
			if (config.position === "left") {
				const newOffset =
					direction === "left"
						? config.offset - 1
						: config.offset + 1;
				onConfigChange?.({ offset: newOffset });
			} else if (config.position === "right") {
				const newOffset =
					direction === "right"
						? config.offset - 1
						: config.offset + 1;
				onConfigChange?.({ offset: newOffset });
			}
		},
		[config.offset, config.position, onConfigChange]
	);

	// 添加复制功能的处理函数
	const handleCopyTOC = React.useCallback(async () => {
		// 生成目录内容，使用制表符保持层级结构
		const tocContent = headings
			.map((heading) => {
				const indent = "\t".repeat(heading.level - 1); // 使用制表符缩进
				return `${indent}${getCleanHeadingText(heading.heading)}`;
			})
			.join("\n");

		try {
			await navigator.clipboard.writeText(tocContent);
			// 可以添加一个临时的成功提示
			const btn = document.querySelector(
				'.rht-toc-toolbar-btn[data-action="copy"]'
			);
			if (btn) {
				btn.classList.add("success");
				setTimeout(() => btn.classList.remove("success"), 1000);
			}
		} catch (err) {
			console.error("Failed to copy TOC:", err);
		}
	}, [headings, getCleanHeadingText]);

	const generateHeadingNumber = React.useCallback(
		(index: number): string => {
			// 如果当前标题是 h1 且配置了跳过 h1，则不显示编号
			if (config.skipH1 && headings[index].level === 1) {
				return "";
			}

			const stack: number[] = [];
			const levels: number[] = [];

			// 从头开始遍历，构建正确的层级关系
			for (let i = 0; i <= index; i++) {
				const heading = headings[i];

				// 如果配置了跳过 h1 且当前是 h1，则跳过
				if (config.skipH1 && heading.level === 1) {
					continue;
				}

				while (
					levels.length > 0 &&
					levels[levels.length - 1] >= heading.level
				) {
					levels.pop();
					stack.pop();
				}

				if (
					levels.length === 0 ||
					heading.level > levels[levels.length - 1]
				) {
					// 新的层级
					let count = 1;
					// 向前查找同级标题
					for (let j = i - 1; j >= 0; j--) {
						if (config.skipH1 && headings[j].level === 1) {
							continue;
						}
						if (
							headings[j].level === heading.level &&
							isUnderSameParent(j, i, headings, config.skipH1)
						) {
							count++;
						}
					}
					levels.push(heading.level);
					stack.push(count);
				}
			}

			return stack.join(".") + ".";
		},
		[headings]
	);

	// 处理折叠/展开
	const handleCollapse = React.useCallback(
		(index: number) => {
			onToggleCollapse(index);
		},
		[onToggleCollapse]
	);

	// 处理全部折叠/展开
	const handleToggleAll = React.useCallback(() => {
		onToggleAll();
	}, [onToggleAll]);

	const shouldShowTOC = React.useMemo(() => {
		if (headings.length === 0) return false;

		if (config.skipH1) {
			// 检查是否所有标题都是一级标题
			const hasOnlyH1 = headings.every((heading) => heading.level === 1);
			// 如果只有一级标题，返回false；否则返回true
			return !hasOnlyH1;
		}

		// 如果不跳过一级标题，只要有标题就显示
		return headings.length > 0;
	}, [headings, config.skipH1]);

	const shouldShowProgressBar = React.useMemo(() => {
		const hasHeadings = headings.length > 0;
		const isProgressBarEnabled =
			config.progressStyle === "bar" || config.progressStyle === "both";
		const shouldShowInTOC = hasHeadings && config.showTOC;
		return isProgressBarEnabled && shouldShowInTOC;
	}, [headings.length, config.progressStyle, config.showTOC]);

	const tocGroupStyle = React.useMemo(
		() => ({
			padding: config.position === "left" ? "0 16px 0 0" : "0 0 0 16px",
			margin: config.position === "left" ? "0 -16px 0 0" : "0 0 0 -16px",
		}),
		[config.position]
	);

	// 计算TOC列表样式
	const tocListStyle = React.useMemo(
		() => ({
			width: `${config.tocWidth}px`,
			cursor: isMouseDragging ? "ew-resize" : undefined,
		}),
		[config.tocWidth, isMouseDragging]
	);

	const containerStyle = React.useMemo(
		() => ({
			[config.position]: `${config.offset}px`,
		}),
		[config.position, config.offset]
	);

	const containerClassName = React.useMemo(() => {
		const classes = ["rht-reading-progress-container"];
		classes.push(`rht-position-${config.position}`);
		return classes.join(" ");
	}, [config.position]);

	const tocGroupClassName = React.useMemo(() => {
		const classes = ["rht-toc-group"];
		if (!config.showTOC) classes.push("rht-hidden");
		return classes.join(" ");
	}, [config.showTOC]);

	const tocListClassName = React.useMemo(() => {
		const classes = ["rht-toc-list"];
		if (config.tocAlwaysExpanded || isHovered) classes.push("rht-expanded");
		return classes.join(" ");
	}, [config.tocAlwaysExpanded, isHovered]);

	return (
		<div className={containerClassName} style={containerStyle}>
			<div
				className="rht-progress-indicator"
				style={{
					display:
						config.progressStyle === "ring" ||
						config.progressStyle === "both"
							? "flex"
							: "none",
				}}
			>
				<ProgressRing
					progress={progress}
					size={28}
					strokeWidth={2}
					showText={true}
					text={`${Math.round(progress)}`}
				/>
			</div>
			<div className="rht-return">
				{isEditing ? (
					config.returnToCursor.enabled && (
						<div
							className="rht-return-btn"
							onClick={() => onReturnClick("cursor")}
							aria-label={t(
								"toolkit.readingProgress.return_button.return_to_cursor"
							)}
							ref={(el) =>
								el && setIcon(el, config.returnToCursor.icon)
							}
						></div>
					)
				) : (
					<>
						{config.returnToTop.enabled && (
							<div
								className="rht-return-btn"
								onClick={() => onReturnClick("top")}
								aria-label={t(
									"toolkit.readingProgress.return_button.return_to_top"
								)}
								ref={(el) =>
									el && setIcon(el, config.returnToTop.icon)
								}
							></div>
						)}
						{config.returnToBottom.enabled && (
							<div
								className="rht-return-btn"
								onClick={() => onReturnClick("bottom")}
								aria-label={t(
									"toolkit.readingProgress.return_button.return_to_bottom"
								)}
								ref={(el) =>
									el &&
									setIcon(el, config.returnToBottom.icon)
								}
							></div>
						)}
					</>
				)}
				{config.jumpToPrevHeading.enabled && (
					<div
						className="rht-return-btn"
						onClick={() => onNavigateHeading("previous")}
						aria-label={t(
							"toolkit.readingProgress.return_button.jump_to_prev_heading"
						)}
						ref={(el) =>
							el && setIcon(el, config.jumpToPrevHeading.icon)
						}
					></div>
				)}
				{config.jumpToNextHeading.enabled && (
					<div
						className="rht-return-btn"
						onClick={() => onNavigateHeading("next")}
						aria-label={t(
							"toolkit.readingProgress.return_button.jump_to_next_heading"
						)}
						ref={(el) =>
							el && setIcon(el, config.jumpToNextHeading.icon)
						}
					></div>
				)}
			</div>

			<div
				className={tocGroupClassName}
				style={tocGroupStyle}
				onMouseEnter={() =>
					!config.tocAlwaysExpanded && setIsHovered(true)
				}
				onMouseLeave={() =>
					!config.tocAlwaysExpanded && setIsHovered(false)
				}
			>
				<div ref={indicatorsRef} className="rht-indicators">
					{headings.map((heading, index) => (
						<span
							key={index}
							className="rht-toc-item-indicator"
							data-index={index}
							data-depth={heading.level}
							data-active={index === activeHeadingIndex}
						/>
					))}
				</div>

				<div
					className={tocListClassName}
					data-state={
						config.tocAlwaysExpanded || isHovered
							? "open"
							: "closed"
					}
				>
					{/* 添加工具栏 */}
					{config.showToolbar && (
						<TOCToolbar
							tocAlwaysExpanded={config.tocAlwaysExpanded}
							onPinClick={handlePinClick}
							onPositionFlip={handlePositionFlip}
							onToggleAll={handleToggleAll}
							allCollapsed={allCollapsed}
							onOffsetChange={handleOffsetChange}
							onCopyTOC={handleCopyTOC}
						/>
					)}
					{/* 添加拖动手柄 */}
					<div
						className="rht-toc-resize-handle"
						onMouseDown={handleMouseDragStart}
					/>
					{/* 目录内容容器 */}
					{shouldShowTOC && (
						<div
							ref={tocListRef}
							className="rht-toc-content"
							style={tocListStyle}
						>
							{shouldShowProgressBar && (
								<div
									className="rht-toc-progress-bar"
									style={
										{
											"--progress-width": `${progress}%`,
										} as React.CSSProperties
									}
								></div>
							)}
							<div className="rht-toc-list-container">
								{headings.map((heading, index) => {
									const actualDepth = calculateActualDepth(
										index,
										headings
									);
									const headingNumber =
										generateHeadingNumber(index);
									const showChildren = hasChildren(
										index,
										headings
									);
									const isCollapsed =
										collapsedItems.has(index);
									const shouldHide = headings
										.slice(0, index)
										.some(
											(h, i) =>
												collapsedItems.has(i) &&
												getChildIndices(
													i,
													headings
												).includes(index)
										);
									if (shouldHide) return null;

									return (
										<TOCItem
											app={app}
											config={config}
											currentView={currentView}
											heading={heading}
											index={index}
											actualDepth={actualDepth}
											headingNumber={headingNumber}
											showChildren={showChildren}
											isCollapsed={isCollapsed}
											isActive={
												index === activeHeadingIndex
											}
											useHeadingNumber={
												config.useHeadingNumber
											}
											onHeadingClick={onHeadingClick}
											onCollapse={handleCollapse}
											getCleanHeadingText={
												getCleanHeadingText
											}
										/>
									);
								})}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
