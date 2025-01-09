import * as React from 'react';
import { HeadingCache } from 'obsidian';
import { ProgressRing } from '@/src/components/base/ProgresssRing/ProgressRing';
import { ArrowLeftRight, ArrowUpToLine, ChevronLeft, ChevronRight, CircleDot, Pin } from 'lucide-react';
import { t } from '@/src/i18n/i18n';
import { IReadingProgressConfig } from '@/src/toolkit/readingProgress/types/config';
import './styles/ReadingProgress.css';

interface ReadingProgressProps {
    config: IReadingProgressConfig;
    onConfigChange: (config: Partial<IReadingProgressConfig>) => void;
    readingTime: number;
    headings: HeadingCache[];
    progress: number;
    onHeadingClick: (heading: HeadingCache) => void;
    activeHeadingIndex?: number;
    isEditing: boolean;
    onReturnClick: () => void;
}

export const ReadingProgress: React.FC<ReadingProgressProps> = ({
    config,
    onConfigChange,
    readingTime,
    headings,
    progress,
    onHeadingClick,
    activeHeadingIndex = -1,
    isEditing,
    onReturnClick,
}) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const [isDragging, setIsDragging] = React.useState(false);
    const [startX, setStartX] = React.useState(0);
    const [startWidth, setStartWidth] = React.useState(0);
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
                const targetScroll = elementOffset - (containerHeight - elementHeight) / 2;
                const distance = targetScroll - startScroll;

                const animate = (currentTime: number) => {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);

                    // easeOutCubic 缓动函数
                    const easeProgress = 1 - Math.pow(1 - progress, 3);
                    container.scrollTop = startScroll + (distance * easeProgress);

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    }
                };

                requestAnimationFrame(animate);
            };

            const activeElement = tocListRef.current?.querySelector(`[data-index="${activeHeadingIndex}"]`) as HTMLElement;
            const activeIndicator = indicatorsRef.current?.querySelector(`[data-index="${activeHeadingIndex}"]`) as HTMLElement;

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
            .replace(/^#+\s+/, '')  // 移除标题标记
            .replace(/\[\[([^\]]+)\]\]/g, '$1')  // 处理内部链接
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // 处理外部链接
            .replace(/[*_`]/g, '')  // 移除强调标记
            .trim();
    };

    // 计算并设置目录列表高度
    React.useEffect(() => {
        if (tocListRef.current) {
            const height = tocListRef.current.scrollHeight;
            document.documentElement.style.setProperty('--toc-height', `${height}px`);
        }
    }, [headings]);

    // 处理拖动开始
    const handleDragStart = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
        setStartX(e.clientX);
        setStartWidth(config.tocWidth);
    }, [config.tocWidth]);

    // 处理拖动过程
    const handleDrag = React.useCallback((e: MouseEvent) => {
        if (!isDragging || !tocListRef.current) return;

        const delta = e.clientX - startX;
        // 根据位置调整宽度变化方向
        const widthDelta = config.position === 'right' ? -delta : delta;
        const newWidth = startWidth + widthDelta;
        
        tocListRef.current.style.width = `${newWidth}px`;
    }, [isDragging, startX, startWidth]);

    // 处理拖动结束
    const handleDragEnd = React.useCallback(() => {
        if (!isDragging) return;

        setIsDragging(false);
        
        if (tocListRef.current) {
            const newWidth = tocListRef.current.offsetWidth;
            onConfigChange?.({ tocWidth: newWidth });
        }
    }, [isDragging, onConfigChange]);

    const handlePinClick = React.useCallback(() => {
        onConfigChange?.({ tocAlwaysExpanded: !config.tocAlwaysExpanded });
    }, [config.tocAlwaysExpanded, onConfigChange]);

    const handlePositionFlip = React.useCallback(() => {
        const newPosition = config.position === 'left' ? 'right' : 'left';
        onConfigChange?.({ position: newPosition });
    }, [config.position, onConfigChange]);

    const handleOffsetChange = React.useCallback((direction: 'left' | 'right') => {
        if (config.position === 'left') {
            const newOffset = direction === 'left' ? config.offset - 1 : config.offset + 1;
            onConfigChange?.({ offset: newOffset });
        } else if (config.position === 'right') {
            const newOffset = direction === 'right' ? config.offset - 1 : config.offset + 1;
            onConfigChange?.({ offset: newOffset });
        }
    }, [config.offset, config.position, onConfigChange]);

    // 添加和移除全局事件监听器
    React.useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', handleDragEnd);
        }

        return () => {
            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', handleDragEnd);
        };
    }, [isDragging, handleDrag, handleDragEnd]);

    // 计算TOC列表样式
    const tocListStyle = React.useMemo(() => ({
        width: `${config.tocWidth}px`,
        cursor: isDragging ? 'ew-resize' : undefined,
    }), [config.tocWidth, isDragging]);

    const containerStyle = React.useMemo(() => ({
        [config.position]: `${config.offset}px`
    }), [config.position, config.offset]);

    const containerClassName = React.useMemo(() => {
        const classes = ['rht-reading-progress-container'];
        classes.push(`rht-position-${config.position}`);
        return classes.join(' ');
    }, [config.position]);

    const tocGroupClassName = React.useMemo(() => {
        const classes = ['rht-toc-group'];
        if (!config.showTOC) classes.push('rht-hidden');
        return classes.join(' ');
    }, [config.showTOC]);

    const tocListClassName = React.useMemo(() => {
        const classes = ['rht-toc-list'];
        if (config.tocAlwaysExpanded || isHovered) classes.push('rht-expanded');
        return classes.join(' ');
    }, [config.tocAlwaysExpanded, isHovered]);

    return (
        <div 
            className={containerClassName}
            style={containerStyle}
        >
            <div 
                className={tocGroupClassName}
                onMouseEnter={() => !config.tocAlwaysExpanded && setIsHovered(true)}
                onMouseLeave={() => !config.tocAlwaysExpanded && setIsHovered(false)}
            >
                <div 
                    ref={indicatorsRef}
                    className="rht-indicators"
                >
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
                    ref={tocListRef}
                    className={tocListClassName}
                    data-state={config.tocAlwaysExpanded || isHovered ? "open" : "closed"}
                    style={tocListStyle}
                >
                    {/* 添加工具栏 */}
                    <div className="rht-toc-toolbar">
                        <button
                            className={`rht-toc-toolbar-btn ${config.tocAlwaysExpanded ? 'active' : ''}`}
                            onClick={handlePinClick}
                            aria-label={t('toolkit.readingProgress.toolbar.toggle_pin')}
                        >
                            <Pin size={16} />
                        </button>
                        <button
                            className="rht-toc-toolbar-btn"
                            onClick={handlePositionFlip}
                            aria-label={t('toolkit.readingProgress.toolbar.toggle_position')}
                        >
                            <ArrowLeftRight size={16} />
                        </button>
                        <button
                            className="rht-toc-toolbar-btn"
                            onClick={() => handleOffsetChange('left')}
                            aria-label={t('toolkit.readingProgress.toolbar.move_left')}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            className="rht-toc-toolbar-btn"
                            onClick={() => handleOffsetChange('right')}
                            aria-label={t('toolkit.readingProgress.toolbar.move_right')}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    {/* 添加拖动手柄 */}
                    <div 
                        className="rht-toc-resize-handle"
                        onMouseDown={handleDragStart}
                    />
                    {/* 目录内容容器 */}
                    <div className="rht-toc-content">
                        {headings.map((heading, index) => (
                            <div
                                key={index}
                                className="rht-toc-item"
                                data-index={index}
                                data-depth={heading.level}
                                data-active={index === activeHeadingIndex}
                                onClick={() => onHeadingClick(heading)}
                            >
                                <span className="rht-toc-item-text">
                                    {getCleanHeadingText(heading.heading)}
                                </span>
                                <span className="rht-toc-item-level">
                                    H{heading.level}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div 
                className="rht-progress-indicator" 
                style={{ display: config.showProgress ? 'flex' : 'none' }}
                aria-label={config.showReadingTime ? t('toolkit.readingProgress.progress_indicator.reading_time', [readingTime]) : undefined}
            >
                <ProgressRing 
                    progress={progress} 
                    size={28} 
                    strokeWidth={2}
                    showText={true}
                    text={`${Math.round(progress)}%`}
                />
            </div>
            <div 
                className="rht-return-button"
                onClick={onReturnClick}
                aria-label={isEditing ? t('toolkit.readingProgress.return_button.return_to_cursor') : t('toolkit.readingProgress.return_button.return_to_top')}
                style={{ display: config.showProgress ? 'flex' : 'none' }}
            >
                {isEditing ? <CircleDot size={16} /> : <ArrowUpToLine size={16} />}
            </div>
        </div>
    );
};
