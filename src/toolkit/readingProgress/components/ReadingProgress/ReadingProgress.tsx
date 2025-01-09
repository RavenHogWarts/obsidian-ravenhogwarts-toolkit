import * as React from 'react';
import { HeadingCache } from 'obsidian';
import { ProgressRing } from '@/src/components/base/ProgresssRing/ProgressRing';
import { ArrowUpToLine, CircleDot } from 'lucide-react';
import { t } from '@/src/i18n/i18n';
import { IReadingProgressConfig } from '@/src/toolkit/readingProgress/types/config';
import './styles/ReadingProgress.css';

interface ReadingProgressProps {
    config: IReadingProgressConfig;
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
    readingTime,
    headings,
    progress,
    onHeadingClick,
    activeHeadingIndex = -1,
    isEditing,
    onReturnClick,
}) => {
    const [isHovered, setIsHovered] = React.useState(false);
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


    // 计算TOC列表样式
    const tocListStyle = React.useMemo(() => ({
        minWidth: `${config.tocWidth}px`,
        maxWidth: `${config.tocWidth + 80}px`, // 给一个合理的最大值
    }), [config.tocWidth]);

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
