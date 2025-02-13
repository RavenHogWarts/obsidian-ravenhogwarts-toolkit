import * as React from "react";
import { IReadingProgressConfig } from "../types/config";

interface UseTOCDragProps {
	config: IReadingProgressConfig;
	onConfigChange: (config: Partial<IReadingProgressConfig>) => void;
	tocListRef: React.RefObject<HTMLDivElement>;
}

export const useTOCDrag = ({
	config,
	onConfigChange,
	tocListRef,
}: UseTOCDragProps) => {
	const [isMouseDragging, setIsMouseDragging] = React.useState(false);
	const [startX, setStartX] = React.useState(0);
	const [startWidth, setStartWidth] = React.useState(0);

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
			const widthDelta = config.position === "right" ? -delta : delta;
			const newWidth = startWidth + widthDelta;

			tocListRef.current.style.width = `${newWidth}px`;
		},
		[isMouseDragging, startX, startWidth, config.position, tocListRef]
	);

	const handleMouseDragEnd = React.useCallback(() => {
		if (!isMouseDragging) return;

		setIsMouseDragging(false);

		if (tocListRef.current) {
			const newWidth = tocListRef.current.offsetWidth;
			onConfigChange?.({ tocWidth: newWidth });
		}
	}, [isMouseDragging, onConfigChange, tocListRef]);

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

	return {
		isMouseDragging,
		handleMouseDragStart,
	};
};
