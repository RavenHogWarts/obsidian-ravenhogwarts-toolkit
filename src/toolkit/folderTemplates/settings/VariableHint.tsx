import { LL } from "@src/i18n/i18n";
import { Fragment, useState } from "react";
import { Icon } from "./Icon";
import { VariableToken } from "./VariableToken";

/** 可用变量清单：token 为占位符文本，descKey 取自 i18n。 */
const VARIABLES: Array<{ token: string; desc: () => string }> = [
	{
		token: "${notename}",
		desc: () => LL.settings.folder_templates.variables.notename(),
	},
	{
		token: "${folder}",
		desc: () => LL.settings.folder_templates.variables.folder(),
	},
	{
		token: "${folderPath}",
		desc: () => LL.settings.folder_templates.variables.folderPath(),
	},
	{
		token: "${date}",
		desc: () => LL.settings.folder_templates.variables.date(),
	},
	{
		token: "${time}",
		desc: () => LL.settings.folder_templates.variables.time(),
	},
	{
		token: "${year}",
		desc: () => LL.settings.folder_templates.variables.year(),
	},
	{
		token: "${yearMonth}",
		desc: () => LL.settings.folder_templates.variables.yearMonth(),
	},
	{
		token: "${timestamp}",
		desc: () => LL.settings.folder_templates.variables.timestamp(),
	},
	{
		token: "${now.format('YYYY-MM-DD')}",
		desc: () => LL.settings.folder_templates.variables.now(),
	},
	{
		token: "${frontmatter.key}",
		desc: () => LL.settings.folder_templates.variables.frontmatter(),
	},
];

/** 可折叠的变量参考清单，供 renameFormat / 模板内容书写时查阅。 */
export function VariableHint() {
	const [open, setOpen] = useState(false);
	const T = LL.settings.folder_templates.variables;

	return (
		<div className="rht-ft-varhint">
			<button
				className="rht-ft-varhint-toggle"
				type="button"
				aria-expanded={open}
				onClick={() => setOpen((v) => !v)}
			>
				<Icon name={open ? "chevron-down" : "chevron-right"} />
				{T.title()}
			</button>
			{open && (
				<div className="rht-ft-varhint-body">
					<dl className="rht-ft-varhint-list">
						{VARIABLES.map((v) => (
							<Fragment key={v.token}>
								<dt className="rht-ft-varhint-term">
									<VariableToken token={v.token} />
								</dt>
								<dd className="rht-ft-varhint-desc">
									{v.desc()}
								</dd>
							</Fragment>
						))}
					</dl>
					<div className="rht-ft-varhint-legacy">
						{T.legacy({
							date: "{{date}}",
							time: "{{time}}",
						})}
					</div>
				</div>
			)}
		</div>
	);
}
