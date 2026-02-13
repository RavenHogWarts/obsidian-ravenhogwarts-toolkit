import {
	ObsidianSettingContainerContext,
	ObsidianSettingContext,
	ObsidianSettingSlotContext,
} from "@src/context/ObsidianSettingContext";
import {
	ButtonComponent,
	ColorComponent,
	DropdownComponent,
	ExtraButtonComponent,
	MomentFormatComponent,
	ProgressBarComponent,
	SearchComponent,
	Setting,
	SliderComponent,
	TextAreaComponent,
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
	visible?: boolean;
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
	visible = true,
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

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			obsidianSetting.clear();
		};
	}, [obsidianSetting]);

	useEffect(() => {
		const args =
			typeof tooltip === "string"
				? ([tooltip, undefined] as const)
				: ([tooltip.tooltip, tooltip.options] as const);

		obsidianSetting.setTooltip(...args);
	}, [obsidianSetting, tooltip]);

	useEffect(() => {
		if (className) {
			// Split multiple classes and apply them individually
			const classes = className.split(/\s+/).filter(Boolean);
			classes.forEach((cls) => {
				obsidianSetting.setClass(cls);
			});
		}
	}, [obsidianSetting, className]);

	useEffect(() => {
		obsidianSetting.setDisabled(disabled);
	}, [obsidianSetting, disabled]);

	useEffect(() => {
		obsidianSetting.setVisibility(visible);
	}, [obsidianSetting, visible]);

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
	className?: string;
	disabled?: boolean;
	icon?: Parameters<ButtonComponent["setIcon"]>[0];
	cta?: boolean;
	warning?: boolean;
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
	className,
	disabled,
	icon,
	cta,
	warning,
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

		if (className !== undefined) {
			button.setClass(className);
		}

		if (disabled !== undefined) {
			button.setDisabled(disabled);
		}

		if (cta) {
			button.setCta();
		}

		if (warning) {
			button.setWarning();
		}
	}, [
		button,
		onClick,
		icon,
		children,
		tooltip,
		className,
		disabled,
		cta,
		warning,
	]);

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
	}, [momentFormat, onChange, value, placeholder, defaultFormat, sampleEl]);

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
	disabled?: boolean;
	onChange?: Parameters<ToggleComponent["onChange"]>[0];
	value?: boolean;
	tooltip?:
		| Parameters<ToggleComponent["setTooltip"]>[0]
		| {
				tooltip: Parameters<ToggleComponent["setTooltip"]>[0];
				options?: Parameters<ToggleComponent["setTooltip"]>[1];
		  };
}
const Toggle: FC<ObsidianSettingToggleProps> = ({
	children,
	disabled,
	onChange,
	value,
	tooltip,
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
		if (disabled !== undefined) toggle.setDisabled(disabled);
		if (tooltip !== undefined) {
			const args =
				typeof tooltip === "string"
					? ([tooltip, undefined] as const)
					: ([tooltip.tooltip, tooltip.options] as const);
			toggle.setTooltip(...args);
		}
	}, [toggle, onChange, value, disabled, tooltip]);

	return !toggle ? undefined : <>{createPortal(children, toggle.toggleEl)}</>;
};

interface ObsidianSettingColorProps {
	children?: ReactNode;
	disabled?: boolean;
	onChange?: Parameters<ColorComponent["onChange"]>[0];
	value?: string;
}
const Color: FC<ObsidianSettingColorProps> = ({
	children,
	disabled,
	onChange,
	value,
}) => {
	const obsidianSettingSlot = useContext(ObsidianSettingSlotContext);

	const color = useMemo(() => {
		if (!obsidianSettingSlot) return;
		return new ColorComponent(obsidianSettingSlot.slotEl);
	}, [obsidianSettingSlot]);

	useEffect(() => {
		if (!color) return;
		return () => {
			color.colorPickerEl?.remove();
		};
	}, [color]);

	useEffect(() => {
		if (!color) return;
		if (onChange) color.onChange(onChange);
		if (value !== undefined) color.setValue(value);
		if (disabled !== undefined) color.setDisabled(disabled);
	}, [color, onChange, value, disabled]);

	return !color ? undefined : (
		<>{createPortal(children, color.colorPickerEl)}</>
	);
};

interface ObsidianSettingProgressBarProps {
	children?: ReactNode;
	value?: number;
	visible?: boolean;
}
const ProgressBar: FC<ObsidianSettingProgressBarProps> = ({
	children,
	value,
	visible = true,
}) => {
	const obsidianSettingSlot = useContext(ObsidianSettingSlotContext);

	const progressBar = useMemo(() => {
		if (!obsidianSettingSlot) return;
		return new ProgressBarComponent(obsidianSettingSlot.slotEl);
	}, [obsidianSettingSlot]);

	useEffect(() => {
		if (!progressBar) return;
		return () => {
			progressBar.progressBar?.remove();
		};
	}, [progressBar]);

	useEffect(() => {
		if (!progressBar) return;
		if (value !== undefined) progressBar.setValue(value);
		progressBar.setVisibility(visible);
	}, [progressBar, value, visible]);

	return !progressBar ? undefined : (
		<>{createPortal(children, progressBar.progressBar)}</>
	);
};

interface ObsidianSettingSearchProps {
	children?: ReactNode;
	className?: string;
	disabled?: boolean;
	placeholder?: string;
	onChange?: Parameters<SearchComponent["onChange"]>[0];
	value?: string;
}
const Search: FC<ObsidianSettingSearchProps> = ({
	children,
	className,
	disabled,
	placeholder,
	onChange,
	value,
}) => {
	const obsidianSettingSlot = useContext(ObsidianSettingSlotContext);

	const search = useMemo(() => {
		if (!obsidianSettingSlot) return;
		return new SearchComponent(obsidianSettingSlot.slotEl);
	}, [obsidianSettingSlot]);

	useEffect(() => {
		if (!search) return;
		return () => {
			search.containerEl?.remove();
		};
	}, [search]);

	useEffect(() => {
		if (!search) return;
		if (onChange) search.onChange(onChange);
		if (value !== undefined) search.setValue(value);
		if (placeholder !== undefined) search.setPlaceholder(placeholder);
		if (disabled !== undefined) search.setDisabled(disabled);
		if (className !== undefined) search.setClass(className);
	}, [search, onChange, value, placeholder, disabled, className]);

	return !search ? undefined : <>{createPortal(children, search.inputEl)}</>;
};

interface ObsidianSettingSliderProps {
	children?: ReactNode;
	disabled?: boolean;
	dynamicTooltip?: boolean;
	instant?: boolean;
	limits?: {
		min: number;
		max: number;
		step: number | "any";
	};
	onChange?: Parameters<SliderComponent["onChange"]>[0];
	value?: number;
}
const Slider: FC<ObsidianSettingSliderProps> = ({
	children,
	disabled,
	dynamicTooltip,
	instant,
	limits,
	onChange,
	value,
}) => {
	const obsidianSettingSlot = useContext(ObsidianSettingSlotContext);

	const slider = useMemo(() => {
		if (!obsidianSettingSlot) return;
		const slider = new SliderComponent(obsidianSettingSlot.slotEl);
		if (limits) {
			slider.setLimits(limits.min, limits.max, limits.step);
		}
		return slider;
	}, [obsidianSettingSlot, limits]);

	useEffect(() => {
		if (!slider) return;
		return () => {
			slider.sliderEl.remove();
		};
	}, [slider]);

	useEffect(() => {
		if (!slider) return;
		if (onChange) slider.onChange(onChange);
		if (value !== undefined) slider.setValue(value);
		if (disabled !== undefined) slider.setDisabled(disabled);
		if (dynamicTooltip) slider.setDynamicTooltip();
		if (instant !== undefined) slider.setInstant(instant);
	}, [slider, onChange, value, disabled, dynamicTooltip, instant]);

	return !slider ? undefined : <>{createPortal(children, slider.sliderEl)}</>;
};

interface ObsidianSettingTextAreaProps {
	children?: ReactNode;
	disabled?: boolean;
	placeholder?: string;
	onChange?: Parameters<TextAreaComponent["onChange"]>[0];
	value?: string;
}
const TextArea: FC<ObsidianSettingTextAreaProps> = ({
	children,
	disabled,
	placeholder,
	onChange,
	value,
}) => {
	const obsidianSettingSlot = useContext(ObsidianSettingSlotContext);

	const textArea = useMemo(() => {
		if (!obsidianSettingSlot) return;
		return new TextAreaComponent(obsidianSettingSlot.slotEl);
	}, [obsidianSettingSlot]);

	useEffect(() => {
		if (!textArea) return;
		return () => {
			textArea.inputEl.remove();
		};
	}, [textArea]);

	useEffect(() => {
		if (!textArea) return;
		if (onChange) textArea.onChange(onChange);
		if (value !== undefined) textArea.setValue(value);
		if (placeholder !== undefined) textArea.setPlaceholder(placeholder);
		if (disabled !== undefined) textArea.setDisabled(disabled);
	}, [textArea, onChange, value, placeholder, disabled]);

	return !textArea ? undefined : (
		<>{createPortal(children, textArea.inputEl)}</>
	);
};

type ObsidianSettingComponent = FC<ObsidianSettingProps> & {
	Button: typeof Button;
	Color: typeof Color;
	Container: typeof Container;
	Dropdown: typeof Dropdown;
	ExtraButton: typeof ExtraButton;
	MomentFormat: typeof MomentFormat;
	ProgressBar: typeof ProgressBar;
	Search: typeof Search;
	Slider: typeof Slider;
	Text: typeof Text;
	TextArea: typeof TextArea;
	Toggle: typeof Toggle;
};

const ObsidianSettingWithSubComponents = Object.assign(
	ObsidianSetting as FC<ObsidianSettingProps>,
	{
		Button,
		Color,
		Container,
		Dropdown,
		ExtraButton,
		MomentFormat,
		ProgressBar,
		Search,
		Slider,
		Text,
		TextArea,
		Toggle,
	}
) as ObsidianSettingComponent;

export { ObsidianSettingWithSubComponents as ObsidianSetting };

export default ObsidianSettingWithSubComponents;

export type {
	ObsidianSettingButtonProps,
	ObsidianSettingColorProps,
	ObsidianSettingContainerProps,
	ObsidianSettingDropdownProps,
	ObsidianSettingExtraButtonProps,
	ObsidianSettingMomentFormatProps,
	ObsidianSettingProgressBarProps,
	ObsidianSettingProps,
	ObsidianSettingSearchProps,
	ObsidianSettingSliderProps,
	ObsidianSettingTextAreaProps,
	ObsidianSettingTextProps,
	ObsidianSettingToggleProps,
};
