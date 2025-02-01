import * as React from "react";
import RavenHogwartsToolkitPlugin from "@/src/main";
import { IReadingProgressConfig } from "@/src/toolkit/readingProgress/types/config";
import { useModuleConfig } from "@/src/core/hooks/useModuleConfig";
import { SettingItem } from "@/src/components/base/Setting/SettingItem";
import { Toggle } from "@/src/components/base/Button/Toggle";
import { t } from "@/src/i18n/i18n";
import { Select } from "@/src/components/base/Select/Select";
import { Input } from "@/src/components/base/Input/Input";

interface ReadingProgressSettingsProps {
	plugin: RavenHogwartsToolkitPlugin;
}

export const ReadingProgressSettings: React.FC<
	ReadingProgressSettingsProps
> = ({ plugin }) => {
	const { config, updateConfig } = useModuleConfig<IReadingProgressConfig>(
		plugin,
		"readingProgress"
	);

	const handleUpdateConfig = async (
		updates: Partial<IReadingProgressConfig>
	) => {
		try {
			await updateConfig(updates);
		} catch (err) {
			console.error("Failed to update config:", err);
		}
	};

	return (
		<div className="rht-toolkit-detail-settings">
			<h3>{t("toolkit.readingProgress.settings.segment.general")}</h3>
			<SettingItem
				name={t("toolkit.readingProgress.settings.position.title")}
				desc={t(
					"toolkit.readingProgress.settings.position.description"
				)}
			>
				<Select
					value={config.position}
					onValueChange={(value) =>
						handleUpdateConfig({
							position: value as "left" | "right",
						})
					}
					options={[
						{
							label: t(
								"toolkit.readingProgress.settings.position.left"
							),
							value: "left",
						},
						{
							label: t(
								"toolkit.readingProgress.settings.position.right"
							),
							value: "right",
						},
					]}
				></Select>
			</SettingItem>

			<SettingItem
				name={t("toolkit.readingProgress.settings.offset.title")}
				desc={t("toolkit.readingProgress.settings.offset.description")}
			>
				<Input
					type="number"
					value={config.offset}
					onChange={(value) =>
						handleUpdateConfig({ offset: parseInt(value) })
					}
				/>
			</SettingItem>

			<h3>{t("toolkit.readingProgress.settings.segment.toc")}</h3>
			<SettingItem
				name={t("toolkit.readingProgress.settings.showTOC.title")}
				desc={t("toolkit.readingProgress.settings.showTOC.description")}
			>
				<Toggle
					checked={config.showTOC}
					onChange={(checked) =>
						handleUpdateConfig({ showTOC: checked })
					}
				/>
			</SettingItem>

			{config.showTOC && (
				<>
					<SettingItem
						name={t(
							"toolkit.readingProgress.settings.tocAlwaysExpanded.title"
						)}
						desc={t(
							"toolkit.readingProgress.settings.tocAlwaysExpanded.description"
						)}
					>
						<Toggle
							checked={config.tocAlwaysExpanded}
							onChange={(checked) =>
								handleUpdateConfig({
									tocAlwaysExpanded: checked,
								})
							}
						/>
					</SettingItem>

					<SettingItem
						name={t(
							"toolkit.readingProgress.settings.useHeadingNumber.title"
						)}
						desc={t(
							"toolkit.readingProgress.settings.useHeadingNumber.description"
						)}
					>
						<Toggle
							checked={config.useHeadingNumber}
							onChange={(checked) =>
								handleUpdateConfig({
									useHeadingNumber: checked,
								})
							}
						/>
					</SettingItem>

					{config.useHeadingNumber && (
						<SettingItem
							name={t(
								"toolkit.readingProgress.settings.skipH1Numbering.title"
							)}
							desc={t(
								"toolkit.readingProgress.settings.skipH1Numbering.description"
							)}
						>
							<Toggle
								checked={config.skipH1Numbering}
								onChange={(checked) =>
									handleUpdateConfig({
										skipH1Numbering: checked,
									})
								}
							/>
						</SettingItem>
					)}

					<SettingItem
						name={t(
							"toolkit.readingProgress.settings.showToolbar.title"
						)}
						desc={t(
							"toolkit.readingProgress.settings.showToolbar.description"
						)}
					>
						<Toggle
							checked={config.showToolbar}
							onChange={(checked) =>
								handleUpdateConfig({ showToolbar: checked })
							}
						/>
					</SettingItem>

					<SettingItem
						name={t(
							"toolkit.readingProgress.settings.tocWidth.title"
						)}
						desc={t(
							"toolkit.readingProgress.settings.tocWidth.description"
						)}
					>
						<Input
							type="number"
							value={config.tocWidth}
							onChange={(value) =>
								handleUpdateConfig({
									tocWidth: parseInt(value),
								})
							}
						/>
					</SettingItem>
				</>
			)}

			<h3>{t("toolkit.readingProgress.settings.segment.progress")}</h3>
			<SettingItem
				name={t("toolkit.readingProgress.settings.progressStyle.title")}
				desc={t(
					"toolkit.readingProgress.settings.progressStyle.description"
				)}
			>
				<Select
					value={config.progressStyle}
					onValueChange={(value) =>
						handleUpdateConfig({
							progressStyle: value as
								| "bar"
								| "ring"
								| "none"
								| "both",
						})
					}
					options={[
						{
							label: t(
								"toolkit.readingProgress.settings.progressStyle.bar"
							),
							value: "bar",
						},
						{
							label: t(
								"toolkit.readingProgress.settings.progressStyle.ring"
							),
							value: "ring",
						},
						{
							label: t(
								"toolkit.readingProgress.settings.progressStyle.none"
							),
							value: "none",
						},
						{
							label: t(
								"toolkit.readingProgress.settings.progressStyle.both"
							),
							value: "both",
						},
					]}
				></Select>
			</SettingItem>
		</div>
	);
};
