import { HeadingCache } from "obsidian";

// 处理标题文本，移除 Markdown 语法并保留纯文本
export const getCleanHeadingText = (heading: string) => {
	return heading
		.replace(/^#+\s+/, "") // 移除标题标记
		.replace(/\[\[([^\]]+)\]\]/g, "$1") // 处理内部链接
		.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // 处理外部链接
		.replace(/[*_`]/g, "") // 移除强调标记
		.trim();
};

export // 辅助函数：检查两个标题是否在同一个父标题下
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

export const hasChildren = (
	index: number,
	headings: HeadingCache[]
): boolean => {
	if (index >= headings.length - 1) return false;
	return headings[index + 1].level > headings[index].level;
};

export const getChildIndices = (
	index: number,
	headings: HeadingCache[]
): number[] => {
	const indices: number[] = [];
	const parentLevel = headings[index].level;

	for (let i = index + 1; i < headings.length; i++) {
		if (headings[i].level <= parentLevel) break;
		indices.push(i);
	}

	return indices;
};

export const calculateActualDepth = (
	index: number,
	headings: HeadingCache[]
): number => {
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
};

export const smoothScroll = (
	container: HTMLElement,
	element: HTMLElement,
	duration = 300
): void => {
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
		const easeProgress = 1 - Math.pow(1 - progress, 3);
		container.scrollTop = startScroll + distance * easeProgress;

		if (progress < 1) {
			requestAnimationFrame(animate);
		}
	};

	requestAnimationFrame(animate);
};
