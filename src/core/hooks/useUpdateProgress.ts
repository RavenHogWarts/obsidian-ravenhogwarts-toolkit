import * as React from "react";
import { UpdateProgress } from "../interfaces/types";
import { t } from "@/src/i18n/i18n";

export interface UpdateStatus {
	isChecking: boolean;
	needsUpdate: boolean;
	progress: number;
	currentFile: string;
	status: string;
	error?: string;
}

export function useUpdateProgress() {
	const [updateStatus, setUpdateStatus] = React.useState<UpdateStatus>({
		isChecking: false,
		needsUpdate: false,
		progress: 0,
		currentFile: "",
		status: "",
	});

	// 添加状态清除计时器
	const [clearTimer, setClearTimer] = React.useState<NodeJS.Timeout | null>(
		null
	);

	// 清理函数
	React.useEffect(() => {
		return () => {
			if (clearTimer) {
				clearTimeout(clearTimer);
			}
		};
	}, [clearTimer]);

	const handleUpdateProgress = React.useCallback(
		(progress: UpdateProgress) => {
			// 取消之前的计时器
			if (clearTimer) {
				clearTimeout(clearTimer);
				setClearTimer(null);
			}

			let timer: NodeJS.Timeout | null = null;

			switch (progress.stage) {
				case "checking":
					setUpdateStatus((prev) => ({
						...prev,
						isChecking: true,
						status: t("notice.checking_update"),
					}));
					break;

				case "downloading":
					setUpdateStatus((prev) => ({
						...prev,
						isChecking: false,
						needsUpdate: true,
						progress: progress.progress || 0,
						currentFile: progress.message || "",
						status: "",
					}));
					break;

				case "installing":
					setUpdateStatus((prev) => ({
						...prev,
						status: t("notice.installing_update"),
					}));
					break;

				case "completed":
					setUpdateStatus((prev) => ({
						...prev,
						isChecking: false,
						needsUpdate: false,
						progress: 100,
						status:
							progress.message || t("notice.update_completed"),
					}));
					timer = setTimeout(() => resetStatus(), 5000);
					break;

				case "error":
					setUpdateStatus((prev) => ({
						...prev,
						isChecking: false,
						error: progress.error?.message,
						status: t("notice.update_error"),
					}));
					timer = setTimeout(() => resetStatus(), 5000);
					break;
			}

			if (timer) {
				setClearTimer(timer);
			}
		},
		[]
	);

	const resetStatus = React.useCallback(() => {
		if (clearTimer) {
			clearTimeout(clearTimer);
			setClearTimer(null);
		}
		setUpdateStatus({
			isChecking: false,
			needsUpdate: false,
			progress: 0,
			currentFile: "",
			status: "",
		});
	}, [clearTimer]);

	const showUpdateStatus = React.useMemo(() => {
		return (
			updateStatus.isChecking ||
			updateStatus.needsUpdate ||
			updateStatus.error
		);
	}, [updateStatus]);

	return {
		showUpdateStatus,
		updateStatus,
		handleUpdateProgress,
		resetStatus,
	};
}
