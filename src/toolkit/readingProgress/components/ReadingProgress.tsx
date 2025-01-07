import * as React from 'react';
import { HeadingCache } from 'obsidian';
import './ReadingProgress.css';
import { ProgressRing } from '@/src/components/base/ProgresssRing/ProgressRing';

interface ReadingProgressProps {
  headings: HeadingCache[];
  progress: number;
  onHeadingClick: (heading: HeadingCache) => void;
}

export const ReadingProgress: React.FC<ReadingProgressProps> = ({
    headings,
    progress,
    onHeadingClick
}) => {
    return (
        <div className="rht-reading-progress-container">
            <div className="rht-toc-group">
                <div className="rht-toc-indicators">
                    {headings.map((heading, index) => (
                        <button
                            key={index}
                            className="rht-toc-indicator"
                            data-index={index}
                            onClick={() => onHeadingClick(heading)}
                        />
                    ))}
                </div>
                <div className="rht-toc-list">
                    {headings.map((heading, index) => (
                        <div
                            key={index}
                            className={`rht-toc-item level-${heading.level}`}
                            onClick={() => onHeadingClick(heading)}
                        >
                            {heading.heading}
                        </div>
                    ))}
                </div>
            </div>
            <div className="rht-progress-indicator">
                <ProgressRing progress={progress} size={20} strokeWidth={1.5}/>
                <span className="rht-progress-text">{Math.round(progress)}%</span>
            </div>
        </div>
    );
};
