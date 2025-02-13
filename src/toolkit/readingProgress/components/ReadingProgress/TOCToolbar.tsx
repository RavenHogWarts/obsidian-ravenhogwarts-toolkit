import * as React from "react";
import {
	ArrowLeftRight,
	ChevronLeft,
	ChevronRight,
	ChevronsDownUp,
	ChevronsUpDown,
	ClipboardCopy,
	Pin,
} from "lucide-react";
import { t } from "@/src/i18n/i18n";

interface TOCToolbarProps {
	tocAlwaysExpanded: boolean;
	onPinClick: () => void;
	onPositionFlip: () => void;
	onToggleAll: () => void;
	allCollapsed: boolean;
	onOffsetChange: (direction: "left" | "right") => void;
	onCopyTOC: () => void;
}

export const TOCToolbar: React.FC<TOCToolbarProps> = ({
	tocAlwaysExpanded,
	onPinClick,
	onPositionFlip,
	onToggleAll,
	allCollapsed,
	onOffsetChange,
	onCopyTOC,
}) => {
	return (
		<div className="rht-toc-toolbar">
			<button
				className={`rht-toc-toolbar-btn ${
					tocAlwaysExpanded ? "active" : ""
				}`}
				onClick={onPinClick}
				aria-label={t("toolkit.readingProgress.toolbar.toggle_pin")}
			>
				<Pin size={16} />
			</button>
			<button
				className="rht-toc-toolbar-btn"
				onClick={onPositionFlip}
				aria-label={t(
					"toolkit.readingProgress.toolbar.toggle_position"
				)}
			>
				<ArrowLeftRight size={16} />
			</button>
			<button
				className="rht-toc-toolbar-btn"
				onClick={onToggleAll}
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
				onClick={() => onOffsetChange("left")}
				aria-label={t("toolkit.readingProgress.toolbar.move_left")}
			>
				<ChevronLeft size={16} />
			</button>
			<button
				className="rht-toc-toolbar-btn"
				onClick={() => onOffsetChange("right")}
				aria-label={t("toolkit.readingProgress.toolbar.move_right")}
			>
				<ChevronRight size={16} />
			</button>
			<button
				className="rht-toc-toolbar-btn"
				onClick={onCopyTOC}
				data-action="copy"
				aria-label={t("toolkit.readingProgress.toolbar.copy_toc")}
			>
				<ClipboardCopy size={16} />
			</button>
		</div>
	);
};
