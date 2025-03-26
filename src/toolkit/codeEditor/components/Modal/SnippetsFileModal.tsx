import * as React from "react";
import { useModal } from "@/src/components/base/Modal/BaseModal";
import { Button } from "@/src/components/base/Button/Button";
import { Input } from "@/src/components/base/Input/Input";
import { Logger } from "@/src/core/services/Log";
import { t } from "@/src/i18n/i18n";
import {
	Code2,
	FilePlus2,
	FileX,
	FolderCode,
	RefreshCcwDot,
	Search,
	SquarePen,
	Trash2,
} from "lucide-react";
import "./styles/SnippetsFileModal.css";
import { Toggle } from "@/src/components/base/Button/Toggle";

interface SnippetsFileModalProps {
	onClose: () => void;
}

interface SnippetFile {
	name: string;
	lastModified?: number;
	enabled?: boolean;
}

export const SnippetsFileModal: React.FC<SnippetsFileModalProps> = ({
	onClose,
}) => {
	const { app, additionalProps } = useModal();
	const [files, setFiles] = React.useState<SnippetFile[]>([]);
	const [isCreatingNew, setIsCreatingNew] = React.useState(false);
	const [newFileName, setNewFileName] = React.useState("");
	const [searchQuery, setSearchQuery] = React.useState("");
	const newFileInputRef = React.useRef<HTMLInputElement>(null);

	// @ts-ignore
	const customCss = app.customCss;

	const logger = additionalProps?.logger as Logger;
	const snippetsFolder = additionalProps?.snippetsFolder as string;
	const openExternalFile = additionalProps?.openExternalFile as (
		path: string,
		newTab: boolean
	) => Promise<void>;

	React.useEffect(() => {
		loadSnippetsFiles();
	}, []);

	React.useEffect(() => {
		if (isCreatingNew && newFileInputRef.current) {
			newFileInputRef.current.focus();
		}
	}, [isCreatingNew]);

	const loadSnippetsFiles = async () => {
		const adapter = app.vault.adapter;
		const exists = await adapter.exists(snippetsFolder);

		if (!exists) {
			await adapter.mkdir(snippetsFolder);
		}

		const snippetFiles = await adapter.list(snippetsFolder);
		const cssFiles = await Promise.all(
			snippetFiles.files
				.filter((file) => file.endsWith(".css"))
				.map(async (file) => {
					const fileName = file.split("/").pop() || file;
					const fileNameWithoutExtension = fileName.split(".")[0];
					const stat = await adapter.stat(file);
					const isEnabled = customCss.enabledSnippets.has(
						fileNameWithoutExtension
					);
					return {
						name: fileName,
						lastModified: stat?.mtime || 0,
						enabled: isEnabled,
					};
				})
		);

		// cssFiles.sort((a, b) => b.lastModified - a.lastModified);
		setFiles(cssFiles);
	};

	const handleOpenFile = async (fileName: string) => {
		const filePath = `${snippetsFolder}/${fileName}`;
		await openExternalFile(filePath, true);
		onClose();
	};

	const handleToggleSnippet = async (fileName: string, checked: boolean) => {
		const fileNameWithoutExtension = fileName.split(".")[0];
		customCss.setCssEnabledStatus(fileNameWithoutExtension, checked);

		requestLoadSnippets();
	};

	const requestLoadSnippets = async () => {
		await customCss.requestLoadSnippets();
		await loadSnippetsFiles();
	};

	const handleOpenSnippetsFolder = async () => {
		// @ts-ignore
		await app.openWithDefaultApp(snippetsFolder);
	};

	const handleDeleteFile = async (fileName: string, e: React.MouseEvent) => {
		e.stopPropagation();

		if (
			!confirm(t("toolkit.codeEditor.modal.confirm_delete", [fileName]))
		) {
			return;
		}

		try {
			const filePath = `${snippetsFolder}/${fileName}`;
			const adapter = app.vault.adapter;
			await adapter.remove(filePath);
			logger.notice(
				t("toolkit.codeEditor.notice.file_deleted", [fileName])
			);
			await loadSnippetsFiles();
		} catch (error) {
			logger.error(
				t("toolkit.codeEditor.notice.file_delete_error"),
				error
			);
		}
	};

	const handleCreateFile = async () => {
		if (!newFileName.trim()) {
			logger.error(t("toolkit.codeEditor.notice.file_name_validate"));
			return;
		}

		let fileName = newFileName;
		if (!fileName.endsWith(".css")) {
			fileName += ".css";
		}

		try {
			const filePath = `${snippetsFolder}/${fileName}`;
			const adapter = app.vault.adapter;
			const exists = await adapter.exists(filePath);

			if (exists) {
				logger.error(
					t("toolkit.codeEditor.notice.file_already_exists")
				);
				return;
			}

			await adapter.write(filePath, "/* CSS Snippet */\n");
			logger.notice(
				t("toolkit.codeEditor.notice.create_file_success", [fileName])
			);
			await loadSnippetsFiles();
			setIsCreatingNew(false);
			setNewFileName("");

			// 自动打开新创建的文件
			await openExternalFile(filePath, true);
			onClose();
		} catch (error) {
			logger.error(
				t("toolkit.codeEditor.notice.create_file_failed", [error])
			);
		}
	};

	const filteredFiles = files.filter((file) =>
		file.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<div className="rht-snippets-file-modal">
			<div className="snippets-modal-header">
				<Code2 size={24} className="snippets-modal-header-icon" />
				<h2>{t("toolkit.codeEditor.modal.css_snippets")}</h2>
			</div>
			<div className="snippets-modal-content">
				{isCreatingNew ? (
					<div className="snippets-new-file">
						<Input
							ref={newFileInputRef}
							value={newFileName}
							onChange={setNewFileName}
							placeholder={t(
								"toolkit.codeEditor.modal.new_snippet_name"
							)}
						/>
						<div className="snippets-new-file-actions">
							<Button onClick={handleCreateFile}>
								{t("toolkit.codeEditor.modal.create")}
							</Button>
							<Button
								variant="outline"
								onClick={() => {
									setIsCreatingNew(false);
									setNewFileName("");
								}}
							>
								{t("toolkit.codeEditor.modal.cancel")}
							</Button>
						</div>
					</div>
				) : (
					<div className="snippets-actions">
						<div className="snippets-search">
							<Input
								value={searchQuery}
								onChange={setSearchQuery}
								placeholder={t(
									"toolkit.codeEditor.modal.search_snippets"
								)}
								prefix={<Search size={16} />}
							/>
						</div>
						<div className="snippets-action-buttons">
							<Button
								className="snippets-refresh"
								onClick={requestLoadSnippets}
								aria-label={t(
									"toolkit.codeEditor.modal.refresh"
								)}
							>
								<RefreshCcwDot size={18} />
							</Button>
							<Button
								className="snippets-new"
								onClick={() => setIsCreatingNew(true)}
								aria-label={t(
									"toolkit.codeEditor.modal.new_snippet"
								)}
							>
								<FilePlus2 size={18} />
							</Button>
							<Button
								className="snippets-open-folder"
								onClick={handleOpenSnippetsFolder}
								aria-label={t(
									"toolkit.codeEditor.modal.open_snippetsFolder"
								)}
							>
								<FolderCode size={18} />
							</Button>
						</div>
					</div>
				)}

				<div className="snippets-file-list">
					{filteredFiles.length > 0 ? (
						filteredFiles.map((file, index) => (
							<div key={index} className="snippets-file-item">
								<span className="snippets-file-name">
									{file.name}
									{file.lastModified && (
										<span className="snippets-file-badge">
											{new Date(
												file.lastModified
											).toLocaleDateString()}
										</span>
									)}
								</span>
								<div className="snippets-file-actions">
									<Toggle
										checked={!!file.enabled}
										onChange={(checked) =>
											handleToggleSnippet(
												file.name,
												checked
											)
										}
										className="snippets-toggle"
									/>

									<Button
										className="snippets-edit-btn"
										onClick={(e) => {
											e.stopPropagation();
											handleOpenFile(file.name);
										}}
									>
										<SquarePen size={18} />
									</Button>
									<Button
										className="snippets-delete-btn"
										onClick={(e) =>
											handleDeleteFile(file.name, e)
										}
									>
										<Trash2 size={18} />
									</Button>
								</div>
							</div>
						))
					) : (
						<div className="snippets-empty-state">
							<FileX size={32} className="snippets-empty-icon" />
							{searchQuery
								? t(
										"toolkit.codeEditor.modal.no_matching_snippets"
								  )
								: t("toolkit.codeEditor.modal.no_snippets")}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default SnippetsFileModal;
