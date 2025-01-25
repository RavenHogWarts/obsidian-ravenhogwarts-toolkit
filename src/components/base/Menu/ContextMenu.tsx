import * as React from "react";
import "./styles/ContextMenu.css";
import { Circle, CircleCheck } from "lucide-react";

interface MenuOption {
	label: string;
	icon?: React.ReactNode;
	type: "button" | "toggle";
	checked?: boolean;
	onClick: () => void;
}

interface ContextMenuProps {
	options: MenuOption[];
	position: {
		x: number;
		y: number;
	};
	onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
	options,
	position,
	onClose,
}) => {
	const menuRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				menuRef.current &&
				!menuRef.current.contains(event.target as Node)
			) {
				onClose();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [onClose]);

	return (
		<div
			className="rht-context-menu"
			ref={menuRef}
			style={{ left: position.x, top: position.y }}
		>
			{options.map((option, index) => {
				return (
					<button
						key={index}
						className="rht-context-menu-item clickable-icon"
						onClick={() => {
							option.onClick();
							if (option.type === "button") {
								onClose();
							}
						}}
					>
						<div className="rht-context-menu-item-content">
							{option.icon && option.type === "button" && (
								<span className="rht-context-menu-item-icon">
									{option.icon}
								</span>
							)}
							{option.type === "toggle" && (
								<span
									className={`rht-context-menu-item-icon ${
										option.checked ? "checked" : ""
									}`}
								>
									{option.checked ? (
										<CircleCheck />
									) : (
										<Circle />
									)}
								</span>
							)}
							<span className="rht-context-menu-item-label">
								{option.label}
							</span>
						</div>
					</button>
				);
			})}
		</div>
	);
};
