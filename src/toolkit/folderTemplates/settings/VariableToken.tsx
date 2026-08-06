import { LL } from "@src/i18n/i18n";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

interface Props {
	token: string;
}

/**
 * 变量占位符 token：点击复制到剪贴板，复制成功后短暂显示「已复制」。
 *
 * 独立组件：每个 token 维护各自的反馈状态与计时器，互不影响。
 */
export function VariableToken({ token }: Props) {
	const [copied, setCopied] = useState(false);
	const timerRef = useRef<number | null>(null);

	useEffect(
		() => () => {
			if (timerRef.current !== null) {
				window.clearTimeout(timerRef.current);
			}
		},
		[],
	);

	const handleCopy = () => {
		navigator.clipboard.writeText(token).then(
			() => {
				setCopied(true);
				if (timerRef.current !== null) {
					window.clearTimeout(timerRef.current);
				}
				timerRef.current = window.setTimeout(
					() => setCopied(false),
					1500,
				);
			},
			() => {
				// 复制失败时静默处理：保持可重试，不阻塞交互。
			},
		);
	};

	return (
		<code
			className="rht-ft-varhint-token"
			role="button"
			tabIndex={0}
			title={LL.settings.folder_templates.variables.clickToCopy()}
			aria-label={LL.settings.folder_templates.variables.clickToCopy()}
			onClick={handleCopy}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					handleCopy();
				}
			}}
		>
			{copied ? (
				<>
					<Icon name="check" />
					{LL.settings.folder_templates.variables.copied()}
				</>
			) : (
				token
			)}
		</code>
	);
}
