import * as React from "react";
import { HeadingCache } from "obsidian";
import { ProgressRing } from "@/src/components/base/ProgressRing/ProgressRing";
import {
	ArrowDownToLine,
	ArrowLeftRight,
	ArrowUpToLine,
	ChevronLeft,
	ChevronRight,
	ChevronsDownUp,
	ChevronsUpDown,
	CircleDot,
	ClipboardCopy,
	Pin,
} from "lucide-react";
import { t } from "@/src/i18n/i18n";
import { IReadingProgressConfig } from "@/src/toolkit/readingProgress/types/config";
import "./styles/ReadingProgress.css";

interface ReadingProgressProps {
	config: IReadingProgressConfig;
	onConfigChange: (config: Partial<IReadingProgressConfig>) => void;
	headings: HeadingCache[];
	progress: number;
	onHeadingClick: (heading: HeadingCache) => void;
	activeHeadingIndex?: number;
	isEditing: boolean;
	onReturnClick: (target: "cursor" | "top" | "bottom") => void;
}

export const ReadingProgress: React.FC<ReadingProgressProps> = ({
	config,
	onConfigChange,
	headings,
	progress,
	onHeadingClick,
	activeHeadingIndex = -1,
	isEditing,
	onReturnClick,
}) => {
	const [isHovered, setIsHovered] = React.useState(false);
	const [isMouseDragging, setIsMouseDragging] = React.useState(false);
	const [startX, setStartX] = React.useState(0);
	const [startWidth, setStartWidth] = React.useState(0);
	const [collapsedItems, setCollapsedItems] = React.useState<Set<number>>(
		new Set()
	);
	const [allCollapsed, setAllCollapsed] = React.useState(false);
	const tocListRef = React.useRef<HTMLDivElement>(null);
	const indicatorsRef = React.useRef<HTMLDivElement>(null);

	// 添加平滑滚动效果
	React.useEffect(() => {
		if (activeHeadingIndex >= 0) {
			const smoothScroll = (
				container: HTMLElement,
				element: HTMLElement,
				duration = 300
			) => {
				const startTime = performance.now();
				const startScroll = container.scrollTop;
				const containerHeight = container.clientHeight;
				const elementOffset = element.offsetTop;
				const elementHeight = element.offsetHeight;
				const targetScroll =
					elementOffset - (containerHeight - elementHeight) / 2;
				const distance = targetScroll - startScroll;

				const animate = (currentTime: number) => {
					const elapsed = currentTime - startTime;
					const progress = Math.min(elapsed / duration, 1);

					// easeOutCubic 缓动函数
					const easeProgress = 1 - Math.pow(1 - progress, 3);
					container.scrollTop = startScroll + distance * easeProgress;

					if (progress < 1) {
						requestAnimationFrame(animate);
					}
				};

				requestAnimationFrame(animate);
			};

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

	// 处理标题文本，移除 Markdown 语法并保留纯文本
	const getCleanHeadingText = (heading: string) => {
		return heading
			.replace(/^#+\s+/, "") // 移除标题标记
			.replace(/\[\[([^\]]+)\]\]/g, "$1") // 处理内部链接
			.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // 处理外部链接
			.replace(/[*_`]/g, "") // 移除强调标记
			.trim();
	};

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

	// 处理鼠标拖动
	const handleMouseDragStart = React.useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			e.preventDefault();
			setIsMouseDragging(true);
			setStartX(e.clientX);
			setStartWidth(config.tocWidth);
		},
		[config.tocWidth]
	);
	const handleMouseDrag = React.useCallback(
		(e: MouseEvent) => {
			if (!isMouseDragging || !tocListRef.current) return;

			const delta = e.clientX - startX;
			// 根据位置调整宽度变化方向
			const widthDelta = config.position === "right" ? -delta : delta;
			const newWidth = startWidth + widthDelta;

			tocListRef.current.style.width = `${newWidth}px`;
		},
		[isMouseDragging, startX, startWidth]
	);
	const handleMouseDragEnd = React.useCallback(() => {
		if (!isMouseDragging) return;

		setIsMouseDragging(false);

		if (tocListRef.current) {
			const newWidth = tocListRef.current.offsetWidth;
			onConfigChange?.({ tocWidth: newWidth });
		}
	}, [isMouseDragging, onConfigChange]);

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

	// 添加和移除全局事件监听器
	React.useEffect(() => {
		if (isMouseDragging) {
			document.addEventListener("mousemove", handleMouseDrag);
			document.addEventListener("mouseup", handleMouseDragEnd);
		}

		return () => {
			document.removeEventListener("mousemove", handleMouseDrag);
			document.removeEventListener("mouseup", handleMouseDragEnd);
		};
	}, [isMouseDragging, handleMouseDrag, handleMouseDragEnd]);

	const generateHeadingNumber = React.useCallback(
		(index: number): string => {
			// 如果当前标题是 h1 且配置了跳过 h1，则不显示编号
			if (config.skipH1Numbering && headings[index].level === 1) {
				return "";
			}

			const stack: number[] = [];
			const levels: number[] = [];

			// 从头开始遍历，构建正确的层级关系
			for (let i = 0; i <= index; i++) {
				const heading = headings[i];

				// 如果配置了跳过 h1 且当前是 h1，则跳过
				if (config.skipH1Numbering && heading.level === 1) {
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
						if (config.skipH1Numbering && headings[j].level === 1) {
							continue;
						}
						if (
							headings[j].level === heading.level &&
							isUnderSameParent(
								j,
								i,
								headings,
								config.skipH1Numbering
							)
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

	// 辅助函数：检查两个标题是否在同一个父标题下
	const isUnderSameParent = (
		index1: number,
		index2: number,
		headings: HeadingCache[],
		skipH1: boolean
	): boolean => {
		const level = headings[index1].level;

		// 向前查找最近的上级标题
		let parent1 = -1;
		let parent2 = -1;

		for (let i = index1; i >= 0; i--) {
			if (skipH1 && headings[i].level === 1) {
				continue;
			}
			if (headings[i].level < level) {
				parent1 = i;
				break;
			}
		}

		for (let i = index2; i >= 0; i--) {
			if (skipH1 && headings[i].level === 1) {
				continue;
			}
			if (headings[i].level < level) {
				parent2 = i;
				break;
			}
		}

		return parent1 === parent2;
	};

	// 判断标题是否有子标题
	const hasChildren = React.useCallback(
		(index: number) => {
			if (index >= headings.length - 1) return false;
			return headings[index + 1].level > headings[index].level;
		},
		[headings]
	);

	// 获取标题的所有子标题索引
	const getChildIndices = React.useCallback(
		(index: number) => {
			const indices: number[] = [];
			const parentLevel = headings[index].level;

			for (let i = index + 1; i < headings.length; i++) {
				if (headings[i].level <= parentLevel) break;
				indices.push(i);
			}

			return indices;
		},
		[headings]
	);

	const calculateActualDepth = React.useCallback(
		(index: number): number => {
			const currentHeading = headings[index];
			let depth = 0;
			let minLevel = currentHeading.level;

			// 向前遍历寻找父级标题
			for (let i = index - 1; i >= 0; i--) {
				const prevHeading = headings[i];
				// 只关注比当前标题级别小的标题
				if (prevHeading.level < currentHeading.level) {
					// 如果找到新的最小级别，增加深度
					if (prevHeading.level < minLevel) {
						depth++;
						minLevel = prevHeading.level;
					}
				}
			}

			return depth;
		},
		[headings]
	);

	// 处理折叠/展开
	const handleCollapse = React.useCallback((index: number) => {
		setCollapsedItems((prev) => {
			const next = new Set(prev);
			if (next.has(index)) {
				next.delete(index);
			} else {
				next.add(index);
			}
			return next;
		});
	}, []);

	// 处理全部折叠/展开
	const handleToggleAll = React.useCallback(() => {
		setAllCollapsed((prev) => {
			if (prev) {
				setCollapsedItems(new Set());
			} else {
				const allParents = new Set(
					headings
						.map((_, index) => index)
						.filter((index) => hasChildren(index))
				);
				setCollapsedItems(allParents);
			}
			return !prev;
		});
	}, [headings, hasChildren]);

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
					<div
						className="rht-return-btn"
						onClick={() => onReturnClick("cursor")}
						aria-label={t(
							"toolkit.readingProgress.return_button.return_to_cursor"
						)}
					>
						<CircleDot size={16} />
					</div>
				) : (
					<>
						<div
							className="rht-return-btn"
							onClick={() => onReturnClick("top")}
							aria-label={t(
								"toolkit.readingProgress.return_button.return_to_top"
							)}
						>
							<ArrowUpToLine size={16} />
						</div>
						<div
							className="rht-return-btn"
							onClick={() => onReturnClick("bottom")}
							aria-label={t(
								"toolkit.readingProgress.return_button.return_to_bottom"
							)}
						>
							<ArrowDownToLine size={16} />
						</div>
					</>
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
						<div className="rht-toc-toolbar">
							<button
								className={`rht-toc-toolbar-btn ${
									config.tocAlwaysExpanded ? "active" : ""
								}`}
								onClick={handlePinClick}
								aria-label={t(
									"toolkit.readingProgress.toolbar.toggle_pin"
								)}
							>
								<Pin size={16} />
							</button>
							<button
								className="rht-toc-toolbar-btn"
								onClick={handlePositionFlip}
								aria-label={t(
									"toolkit.readingProgress.toolbar.toggle_position"
								)}
							>
								<ArrowLeftRight size={16} />
							</button>
							<button
								className="rht-toc-toolbar-btn"
								onClick={handleToggleAll}
								aria-label={t(
									`toolkit.readingProgress.toolbar.${
										allCollapsed ? "expand" : "collapse"
									}_all`
								)}
							>
								{allCollapsed ? (
									<ChevronsUpDown size={16} />
								) : (
									<ChevronsDownUp size={16} />
								)}
							</button>
							<button
								className="rht-toc-toolbar-btn"
								onClick={() => handleOffsetChange("left")}
								aria-label={t(
									"toolkit.readingProgress.toolbar.move_left"
								)}
							>
								<ChevronLeft size={16} />
							</button>
							<button
								className="rht-toc-toolbar-btn"
								onClick={() => handleOffsetChange("right")}
								aria-label={t(
									"toolkit.readingProgress.toolbar.move_right"
								)}
							>
								<ChevronRight size={16} />
							</button>
							<button
								className="rht-toc-toolbar-btn"
								onClick={handleCopyTOC}
								data-action="copy"
								aria-label={t(
									"toolkit.readingProgress.toolbar.copy_toc"
								)}
							>
								<ClipboardCopy size={16} />
							</button>
						</div>
					)}
					{/* 添加拖动手柄 */}
					<div
						className="rht-toc-resize-handle"
						onMouseDown={handleMouseDragStart}
					/>
					{/* 目录内容容器 */}
					{headings.length > 0 && (
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
							{headings.map((heading, index) => {
								const actualDepth = calculateActualDepth(index);
								const headingNumber =
									generateHeadingNumber(index);
								const showChildren = hasChildren(index);
								const isCollapsed = collapsedItems.has(index);
								const shouldHide = headings
									.slice(0, index)
									.some(
										(h, i) =>
											collapsedItems.has(i) &&
											getChildIndices(i).includes(index)
									);
								if (shouldHide) return null;

								return (
									<div
										key={index}
										className="rht-toc-item"
										data-index={index}
										data-depth={heading.level}
										data-relative-depth={actualDepth}
										data-line={heading.position.start.line}
										data-active={
											index === activeHeadingIndex
										}
										onClick={() => onHeadingClick(heading)}
									>
										<div className="rht-toc-item-content">
											{showChildren && (
												<button
													className="rht-toc-collapse-btn clickable-icon"
													onClick={(e) => {
														e.stopPropagation();
														handleCollapse(index);
													}}
												>
													<ChevronRight
														size={14}
														className={`rht-toc-collapse-icon ${
															isCollapsed
																? ""
																: "expanded"
														}`}
													/>
												</button>
											)}
											<span className="rht-toc-item-text">
												<span
													className="rht-toc-item-number"
													style={{
														display:
															config.useHeadingNumber
																? "inline"
																: "none",
													}}
												>
													{headingNumber}
												</span>
												{getCleanHeadingText(
													heading.heading
												)}
											</span>
										</div>
										<span className="rht-toc-item-level">
											H{heading.level}
										</span>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
