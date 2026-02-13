import { Strings } from "@src/util/Strings";
import { ChevronDown, XIcon } from "lucide-react";
import { Popover as RadixPopover } from "radix-ui";
import { useEffect, useRef, useState } from "react";
import "./SelectList.css";

export type SelectOption = {
	id: string;
	value: string;
	label: string;
};

export interface SelectListProps {
	/** 当前选中的值 */
	value: any;
	/** 值变化回调 */
	onValueChange: (value: any) => void;
	/** 获取选项列表的函数 */
	getOptions: (searchText: string) => SelectOption[];
	/** 是否多选 */
	multiple?: boolean;
	/** 自动聚焦 */
	autoFocus?: boolean;
	/** 格式化值的函数（例如：转换为内部链接格式） */
	formatValue?: (value: string) => string;
	/** 占位符文本 */
	placeholder?: string;
	/** 空列表提示文本 */
	emptyText?: string;
	/** 自定义类名 */
	className?: string;
}

export function SelectList(props: SelectListProps) {
	const {
		value,
		onValueChange,
		getOptions,
		multiple = false,
		autoFocus,
		formatValue,
		placeholder,
		emptyText,
		className,
	} = props;

	const [open, setOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState(-1);
	const [searchText, setSearchText] = useState("");
	const contentRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// 获取过滤后的选项
	const items = getOptions(searchText);

	// 转换为数组值
	const values = Array.isArray(value)
		? value.map((v) => v?.toString()).filter((v) => Strings.isNotBlank(v))
		: value && Strings.isNotBlank(value?.toString())
		? [value.toString()]
		: [];

	const addValue = (newValue: string) => {
		const formattedValue = formatValue ? formatValue(newValue) : newValue;

		if (multiple) {
			if (values.includes(formattedValue)) {
				return;
			}
			const updatedValues = [...values, formattedValue].filter((f) =>
				Strings.isNotBlank(f)
			);
			onValueChange(updatedValues);
		} else {
			onValueChange(formattedValue);
		}
		setSearchText("");
		setOpen(false);
	};

	const removeValue = (v: string) => {
		if (values.length === 1) {
			onValueChange("");
			return;
		}
		const newValue = values.filter((item) => item !== v);
		if (newValue.length === 0) {
			onValueChange("");
		} else {
			onValueChange(newValue);
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		// 处理输入法组合
		if (event.nativeEvent.isComposing) {
			return;
		}

		if (event.key === "ArrowDown") {
			event.preventDefault();
			setActiveIndex((prevIndex) =>
				prevIndex < items.length - 1 ? prevIndex + 1 : 0
			);
		} else if (event.key === "ArrowUp") {
			event.preventDefault();
			setActiveIndex((prevIndex) =>
				prevIndex > 0 ? prevIndex - 1 : items.length - 1
			);
		} else if (event.key === "Enter") {
			event.preventDefault();
			if (activeIndex >= 0 && activeIndex < items.length) {
				addValue(items[activeIndex].value);
			} else if (Strings.isNotBlank(searchText)) {
				addValue(searchText);
			}
			setOpen(false);
		} else if (event.key === "Escape") {
			event.preventDefault();
			setOpen(false);
		}
	};

	// 滚动到激活项
	useEffect(() => {
		if (activeIndex >= 0 && activeIndex < items.length && listRef.current) {
			const activeItemId = items[activeIndex].id;
			const activeItem = listRef.current.querySelector(
				`[data-id="${activeItemId}"]`
			);

			if (activeItem) {
				activeItem.scrollIntoView({
					block: "nearest",
					inline: "nearest",
				});
			}
		}
	}, [activeIndex, items]);

	// 当打开弹窗时自动聚焦输入框
	useEffect(() => {
		if (open && inputRef.current) {
			inputRef.current.focus();
		}
	}, [open]);

	return (
		<RadixPopover.Root open={open} onOpenChange={setOpen}>
			<RadixPopover.Trigger asChild>
				<button
					type="button"
					className={`rht__select-list--trigger ${className || ""}`}
					onKeyDown={(e) => {
						if (e.key === "ArrowDown") {
							e.preventDefault();
							setOpen(true);
						}
					}}
				>
					<TriggerItems
						values={values}
						onRemove={removeValue}
						placeholder={placeholder}
					/>
					<ChevronDown
						size={16}
						className="rht__select-list--trigger-arrow"
					/>
				</button>
			</RadixPopover.Trigger>
			<RadixPopover.Portal
				container={window.activeWindow.activeDocument.body}
			>
				<RadixPopover.Content
					className="rht__select-list--content"
					collisionPadding={{
						left: 16,
						right: 16,
						top: 8,
						bottom: 8,
					}}
					sideOffset={8}
					ref={contentRef}
				>
					<input
						ref={inputRef}
						type="text"
						className="rht__select-list--content-input"
						value={searchText}
						onChange={(e) => {
							setSearchText(e.target.value);
							setActiveIndex(0);
						}}
						onKeyDown={handleKeyDown}
						placeholder={placeholder}
					/>
					<div
						className="rht__select-list--content-list"
						ref={listRef}
					>
						{items.map((item, index) => {
							return (
								<div
									key={item.id}
									className="rht__select-list--content-item"
									data-highlighted={
										activeIndex === index ? "true" : "false"
									}
									data-id={item.id}
									onClick={() => {
										addValue(item.value);
									}}
								>
									{item.label}
								</div>
							);
						})}

						{items.length === 0 && (
							<span className="rht__select-list--content-tip">
								{emptyText}:{" "}
								<span className="rht__select-list--content-tip-info">
									{searchText}
								</span>
							</span>
						)}
					</div>
				</RadixPopover.Content>
			</RadixPopover.Portal>
		</RadixPopover.Root>
	);
}

function TriggerItems(props: {
	values: string[];
	onRemove: (value: string) => void;
	placeholder?: string;
}) {
	const { values, onRemove, placeholder } = props;

	if (values.length === 0) {
		return (
			<div className="rht__select-list--trigger-placeholder">
				{placeholder || ""}
			</div>
		);
	}

	return (
		<div className="rht__select-list--trigger-items">
			{values.map((v) => {
				return (
					<span className="rht__select-list--trigger-item" key={v}>
						{v}
						<span
							className="rht__select-list--trigger-item-close"
							onClick={(e) => {
								e.stopPropagation();
								onRemove(v);
							}}
						>
							<XIcon size={10} />
						</span>
					</span>
				);
			})}
		</div>
	);
}
