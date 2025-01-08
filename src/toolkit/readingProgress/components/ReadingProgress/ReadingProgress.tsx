import * as React from 'react';
import { HeadingCache } from 'obsidian';
import { ProgressRing } from '@/src/components/base/ProgresssRing/ProgressRing';
import { ArrowUpFromDot, ArrowUpToLine } from 'lucide-react';
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

    // 添加自动滚动效果
    React.useEffect(() => {
        if (isHovered && tocListRef.current && activeHeadingIndex >= 0) {
            const activeElement = tocListRef.current.querySelector(`[data-index="${activeHeadingIndex}"]`);
            if (activeElement) {
                activeElement.scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth'
                });
            }
        }
    }, [isHovered, activeHeadingIndex]);

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

    return (
        <div className="rht-reading-progress-container">
            <div 
                className="rht-toc-group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{ display: config.showTOC ? 'flex' : 'none' }}
            >
                <div className="rht-indicators">
                    {headings.map((_, index) => (
                        <span
                            key={index}
                            className="rht-toc-item-indicator"
                            data-active={index === activeHeadingIndex}
                        />
                    ))}
                </div>

                <div 
                    ref={tocListRef}
                    className="rht-toc-list"
                    data-state={isHovered ? "open" : "closed"}
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
                            <span className="rht-toc-item-level">
                                H{heading.level}
                            </span>
                            <span className="rht-toc-item-text">
                                {getCleanHeadingText(heading.heading)}
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
                {isEditing ? <ArrowUpFromDot size={16} /> : <ArrowUpToLine size={16} />}
            </div>
        </div>
    );
};
