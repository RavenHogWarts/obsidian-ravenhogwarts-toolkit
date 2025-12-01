import {
	ObsidianSettingContainerContext,
	ObsidianSettingContext,
	ObsidianSettingSlotContext,
} from "@src/context/ObsidianSettingContext";
import {
	ButtonComponent,
	DropdownComponent,
	ExtraButtonComponent,
	MomentFormatComponent,
	Setting,
	TextComponent,
	ToggleComponent,
} from "obsidian";
import {
	ComponentPropsWithoutRef,
	ContextType,
	FC,
	ReactNode,
	useContext,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState,
} from "react";
import { createPortal } from "react-dom";

interface ObsidianSettingProps {
	children?: ReactNode;
	containerEl?: HTMLElement;
	className?: Parameters<Setting["setClass"]>[0];
	disabled?: Parameters<Setting["setDisabled"]>[0];
	heading?: boolean;
	slots?: {
		info?: ReactNode;
		name?: ReactNode;
		desc?: ReactNode;
		control?: ReactNode;
	};
	tooltip?:
		| Parameters<Setting["setTooltip"]>[0]
		| {
				options?: Parameters<Setting["setTooltip"]>[1];
				tooltip: Parameters<Setting["setTooltip"]>[0];
		  };
}

const ObsidianSetting: FC<ObsidianSettingProps> = ({
	children,
	containerEl,
	className = "",
	disabled = false,
	heading = false,
	slots: {
		info: infoSlot,
		name: nameSlot,
		desc: descSlot,
		control: controlSlot,
	} = {},
	tooltip = "",
}) => {
	const obsidianSettingContainerEl = useContext(
		ObsidianSettingContainerContext
	);
	const obsidianSetting = useMemo(() => {
		const el =
			containerEl ??
			obsidianSettingContainerEl ??
			(() => {
				throw new Error(
					`Expected the "${Setting.name}" component to be provided a container element.`
				);
			})();

		const obsidianSetting = new Setting(el);
		if (heading) {
			obsidianSetting.setHeading();
		}
		return obsidianSetting;
	}, [containerEl, heading, obsidianSettingContainerEl]);

	useEffect(() => {
		const args =
			typeof tooltip === "string"
				? ([tooltip, undefined] as const)
				: ([tooltip.tooltip, tooltip.options] as const);

		obsidianSetting.setTooltip(...args);
	}, [obsidianSetting, tooltip]);

	useEffect(() => {
		if (className) {
			obsidianSetting.setClass(className);
		}
	}, [obsidianSetting, className]);

	useEffect(() => {
		obsidianSetting.setDisabled(disabled);
	}, [obsidianSetting, disabled]);

	const obsidianSettingSlotContext = useMemo(() => {
		const context = {
			setting: {
				setting: obsidianSetting,
				slotEl: obsidianSetting.settingEl,
			},
			info: {
				setting: obsidianSetting,
				slotEl: obsidianSetting.infoEl,
			},
			name: {
				setting: obsidianSetting,
				slotEl: obsidianSetting.nameEl,
			},
			desc: {
				setting: obsidianSetting,
				slotEl: obsidianSetting.descEl,
			},
			control: {
				setting: obsidianSetting,
				slotEl: obsidianSetting.controlEl,
			},
		} satisfies Record<
			string,
			ContextType<typeof ObsidianSettingSlotContext>
		>;
		return context;
	}, [obsidianSetting]);

	return (
		<ObsidianSettingContext.Provider value={obsidianSetting}>
			<ObsidianSettingSlotContext.Provider
				value={obsidianSettingSlotContext.setting}
			>
				{createPortal(
					children,
					obsidianSettingSlotContext.setting.slotEl
				)}
			</ObsidianSettingSlotContext.Provider>
			{infoSlot && (
				<ObsidianSettingSlotContext.Provider
					value={obsidianSettingSlotContext.info}
				>
					{createPortal(
						infoSlot,
						obsidianSettingSlotContext.info.slotEl
					)}
				</ObsidianSettingSlotContext.Provider>
			)}
			{nameSlot && (
				<ObsidianSettingSlotContext.Provider
					value={obsidianSettingSlotContext.name}
				>
					{createPortal(
						nameSlot,
						obsidianSettingSlotContext.name.slotEl
					)}
				</ObsidianSettingSlotContext.Provider>
			)}
			{descSlot && (
				<ObsidianSettingSlotContext.Provider
					value={obsidianSettingSlotContext.desc}
				>
					{createPortal(
						descSlot,
						obsidianSettingSlotContext.desc.slotEl
					)}
				</ObsidianSettingSlotContext.Provider>
			)}
			{controlSlot && (
				<ObsidianSettingSlotContext.Provider
					value={obsidianSettingSlotContext.control}
				>
					{createPortal(
						controlSlot,
						obsidianSettingSlotContext.control.slotEl
					)}
				</ObsidianSettingSlotContext.Provider>
			)}
		</ObsidianSettingContext.Provider>
	);
};

interface ObsidianSettingButtonProps {
	children?: ReactNode;
	icon?: Parameters<ButtonComponent["setIcon"]>[0];
	tooltip?:
		| Parameters<ButtonComponent["setTooltip"]>[0]
		| {
				tooltip: Parameters<ButtonComponent["setTooltip"]>[0];
				options?: Parameters<ButtonComponent["setTooltip"]>[1];
		  };
	onClick?: Parameters<ButtonComponent["onClick"]>[0];
}
const Button: FC<ObsidianSettingButtonProps> = ({
	children,
	icon,
	tooltip,
	onClick,
}) => {
	const obsidianSettingSlot = useContext(ObsidianSettingSlotContext);

	const button = useMemo(() => {
		if (!obsidianSettingSlot) {
			return;
		}
		return new ButtonComponent(obsidianSettingSlot.slotEl);
	}, [obsidianSettingSlot]);

	useEffect(() => {
		if (!button) {
			return;
		}
		return () => {
			button.buttonEl.remove();
		};
	}, [button]);

	useEffect(() => {
		if (!button) {
			return;
		}

		if (onClick) {
			button.onClick(onClick);
		}

		if (icon !== undefined) {
			button.setIcon(icon);
		}

		if (typeof children === "string") {
			button.setButtonText(children);
		}

		if (tooltip !== undefined) {
			const args =
				typeof tooltip === "string"
					? ([tooltip, undefined] as const)
					: ([tooltip.tooltip, tooltip.options] as const);
			button.setTooltip(...args);
		}
	}, [button, onClick, icon, children]);

	return !button ? undefined : <>{createPortal(children, button.buttonEl)}</>;
};

interface ObsidianSettingDropdownProps {
	children?: ReactNode;
	disabled?: boolean;
	options?: Parameters<DropdownComponent["addOptions"]>[0];
	onChange?: Parameters<DropdownComponent["onChange"]>[0];
	value?: string;
}
const Dropdown: FC<ObsidianSettingDropdownProps> = ({
	children,
	options,
	onChange,
	value,
	...rest
}) => {
	const obsidianSettingSlot = useContext(ObsidianSettingSlotContext);

	const dropdown = useMemo(() => {
		if (!obsidianSettingSlot) return;
		const dropdown = new DropdownComponent(obsidianSettingSlot.slotEl);
		if (options) dropdown.addOptions(options);
		return dropdown;
	}, [obsidianSettingSlot, options]);

	useEffect(() => {
		if (!dropdown) return;
		return () => {
			dropdown.selectEl.remove();
		};
	}, [dropdown]);

	useEffect(() => {
		if (!dropdown) return;
		if (onChange) dropdown.onChange(onChange);
		if (value !== undefined) dropdown.setValue(value);
	}, [dropdown, onChange, value]);

	const disabled = useMemo(() => rest.disabled, [rest]);

	useEffect(() => {
		if ("disabled" in rest) {
			dropdown?.setDisabled(rest.disabled === undefined || rest.disabled);
		} else {
			dropdown?.setDisabled(false);
		}
	}, [dropdown, disabled]);

	return !dropdown ? undefined : (
		<>{createPortal(children, dropdown.selectEl)}</>
	);
};

interface ObsidianSettingExtraButtonProps {
	children?: ReactNode;
	disabled?: Parameters<ExtraButtonComponent["setDisabled"]>[0];
	icon?: Parameters<ExtraButtonComponent["setIcon"]>[0];
	tooltip?:
		| Parameters<ExtraButtonComponent["setTooltip"]>[0]
		| {
				tooltip: Parameters<ExtraButtonComponent["setTooltip"]>[0];
				options?: Parameters<ExtraButtonComponent["setTooltip"]>[1];
		  };
	onClick?: Parameters<ExtraButtonComponent["onClick"]>[0];
}
const ExtraButton: FC<ObsidianSettingExtraButtonProps> = ({
	children,
	onClick,
	icon,
	tooltip,
	disabled,
}) => {
	const obsidianSettingSlot = useContext(ObsidianSettingSlotContext);

	const extraButton = useMemo(() => {
		if (!obsidianSettingSlot) return;
		return new ExtraButtonComponent(obsidianSettingSlot.slotEl);
	}, [obsidianSettingSlot]);

	useEffect(() => {
		if (!extraButton) return;
		return () => {
			extraButton.extraSettingsEl.remove();
		};
	}, [extraButton]);

	useLayoutEffect(() => {
		if (!extraButton) return;
		if (onClick) extraButton.onClick(onClick);
		if (icon !== undefined) extraButton.setIcon(icon);
		if (tooltip !== undefined) {
			const args =
				typeof tooltip === "string"
					? ([tooltip, undefined] as const)
					: ([tooltip.tooltip, tooltip.options] as const);
			extraButton.setTooltip(...args);
		}
		if (disabled) extraButton.setDisabled(disabled);
	}, [extraButton, onClick, icon, tooltip, disabled]);

	return !extraButton ? undefined : (
		<>{createPortal(children, extraButton.extraSettingsEl)}</>
	);
};

interface ObsidianSettingContainerProps
	extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
	children: ReactNode | ((containerEl: HTMLElement) => ReactNode);
}
const Container: FC<ObsidianSettingContainerProps> = ({
	children,
	...otherContainerProps
}) => {
	const [contentEl, setContentEl] = useState<HTMLElement | null>(null);
	return (
		<div ref={setContentEl} {...otherContainerProps}>
			{!contentEl ? undefined : (
				<ObsidianSettingContainerContext.Provider value={contentEl}>
					{typeof children === "function"
						? children(contentEl)
						: children}
				</ObsidianSettingContainerContext.Provider>
			)}
		</div>
	);
};

interface ObsidianSettingMomentFormatProps {
	children?: ReactNode;
	placeholder?: string;
	defaultFormat?: string;
	onChange?: Parameters<MomentFormatComponent["onChange"]>[0];
	value?: string;
	sampleEl?: HTMLElement;
}
const MomentFormat: FC<ObsidianSettingMomentFormatProps> = ({
	children,
	placeholder,
	defaultFormat,
	onChange,
	value,
	sampleEl,
}) => {
	const obsidianSettingSlot = useContext(ObsidianSettingSlotContext);
	const momentFormat = useMemo(() => {
		if (!obsidianSettingSlot) return;
		return new MomentFormatComponent(obsidianSettingSlot.slotEl);
	}, [obsidianSettingSlot]);

	useEffect(() => {
		if (!momentFormat) return;
		return () => {
			momentFormat.inputEl.remove();
		};
	}, [momentFormat]);

	useEffect(() => {
		if (!momentFormat) return;
		if (onChange) momentFormat.onChange(onChange);
		if (value !== undefined) momentFormat.setValue(value);
		if (placeholder !== undefined) momentFormat.setPlaceholder(placeholder);
		if (defaultFormat !== undefined)
			momentFormat.setDefaultFormat(defaultFormat);
		if (sampleEl) momentFormat.setSampleEl(sampleEl);
	}, [momentFormat, onChange, value, placeholder, sampleEl]);

	return !momentFormat ? undefined : (
		<>{createPortal(children, momentFormat.inputEl)}</>
	);
};

interface ObsidianSettingTextProps {
	children?: ReactNode;
	placeholder?: string;
	onChange?: Parameters<TextComponent["onChange"]>[0];
	value?: string;
	readonly?: boolean;
}
const Text: FC<ObsidianSettingTextProps> = ({
	children,
	placeholder,
	onChange,
	value,
	readonly = false,
}) => {
	const obsidianSettingSlot = useContext(ObsidianSettingSlotContext);

	const text = useMemo(() => {
		if (!obsidianSettingSlot) return;
		return new TextComponent(obsidianSettingSlot.slotEl);
	}, [obsidianSettingSlot]);

	useEffect(() => {
		if (!text) return;
		return () => {
			text.inputEl.remove();
		};
	}, [text]);

	useEffect(() => {
		if (!text) return;
		if (onChange) text.onChange(onChange);
		text.setValue(value ?? "");
		if (placeholder !== undefined) text.setPlaceholder(placeholder);
		text.inputEl.readOnly = !!readonly;
	}, [text, onChange, value, placeholder, readonly]);

	return !text ? undefined : <>{createPortal(children, text.inputEl)}</>;
};

interface ObsidianSettingToggleProps {
	children?: ReactNode;
	onChange?: Parameters<ToggleComponent["onChange"]>[0];
	value?: boolean;
}
const Toggle: FC<ObsidianSettingToggleProps> = ({
	children,
	onChange,
	value,
}) => {
	const obsidianSettingSlot = useContext(ObsidianSettingSlotContext);

	const toggle = useMemo(() => {
		if (!obsidianSettingSlot) return;
		return new ToggleComponent(obsidianSettingSlot.slotEl);
	}, [obsidianSettingSlot]);

	useEffect(() => {
		if (!toggle) return;
		return () => {
			toggle.toggleEl.remove();
		};
	}, [toggle]);

	useEffect(() => {
		if (!toggle) return;
		if (onChange) toggle.onChange(onChange);
		if (value !== undefined) toggle.setValue(value);
	}, [toggle, onChange, value]);

	return !toggle ? undefined : <>{createPortal(children, toggle.toggleEl)}</>;
};

type ObsidianSettingWithComponents = FC<ObsidianSettingProps> & {
	Button: FC<ObsidianSettingButtonProps>;
	Dropdown: FC<ObsidianSettingDropdownProps>;
	ExtraButton: FC<ObsidianSettingExtraButtonProps>;
	Container: FC<ObsidianSettingContainerProps>;
	MomentFormat: FC<ObsidianSettingMomentFormatProps>;
	Text: FC<ObsidianSettingTextProps>;
	Toggle: FC<ObsidianSettingToggleProps>;
};

// 将ObsidianSetting转换为带有子组件的类型
const ObsidianSettingComponent =
	ObsidianSetting as ObsidianSettingWithComponents;

// 将子组件作为ObsidianSetting的静态属性
ObsidianSettingComponent.Button = Button;
ObsidianSettingComponent.Dropdown = Dropdown;
ObsidianSettingComponent.ExtraButton = ExtraButton;
ObsidianSettingComponent.Container = Container;
ObsidianSettingComponent.MomentFormat = MomentFormat;
ObsidianSettingComponent.Text = Text;
ObsidianSettingComponent.Toggle = Toggle;

// 重新导出ObsidianSetting（现在包含所有子组件作为静态属性）
export default ObsidianSettingComponent;

// 同时导出ObsidianSetting本身，以便可以直接使用
export { ObsidianSetting };
