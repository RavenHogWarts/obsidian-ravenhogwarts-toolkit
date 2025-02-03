import * as React from "react";
import { useModal } from "@/src/components/base/Modal/BaseModal";
import { Button } from "@/src/components/base/Button/Button";
import { Input } from "@/src/components/base/Input/Input";
import { Select } from "@/src/components/base/Select/Select";
import "./styles/CreateCodeFileModal.css";
import { Logger } from "@/src/core/services/Log";
import { t } from "@/src/i18n/i18n";

interface CreateCodeFileModalProps {
	onClose: () => void;
}

const FILE_EXTENSIONS = [
	{ value: "custom", label: "Custom filename" },
	{ value: "js", label: "JavaScript (.js)" },
	{ value: "ts", label: "TypeScript (.ts)" },
	{ value: "jsx", label: "React JavaScript (.jsx)" },
	{ value: "tsx", label: "React TypeScript (.tsx)" },
	{ value: "py", label: "Python (.py)" },
	{ value: "java", label: "Java (.java)" },
	{ value: "cpp", label: "C++ (.cpp)" },
	{ value: "c", label: "C (.c)" },
	{ value: "h", label: "C Header (.h)" },
	{ value: "cs", label: "C# (.cs)" },
	{ value: "html", label: "HTML (.html)" },
	{ value: "css", label: "CSS (.css)" },
	{ value: "json", label: "JSON (.json)" },
];

export const CreateCodeFileModal: React.FC<CreateCodeFileModalProps> = ({
	onClose,
}) => {
	const { app, additionalProps } = useModal();
	const [fileName, setFileName] = React.useState("");
	const [fileExtension, setFileExtension] = React.useState("custom");
	const [openAfterCreate, setOpenAfterCreate] = React.useState(true);
	const [isCustomFilename, setIsCustomFilename] = React.useState(true);

	const folderPath = additionalProps?.folderPath as string;
	const logger = additionalProps?.logger as Logger;
	const openInCodeEditor = additionalProps?.openInCodeEditor as (
		path: string,
		newTab: boolean
	) => Promise<void>;

	const handleFileExtensionChange = (value: string) => {
		setFileExtension(value);
		setIsCustomFilename(value === "custom");
	};

	const getFullPath = () => {
		const normalizedFolderPath = folderPath.endsWith("/")
			? folderPath.slice(0, -1)
			: folderPath;

		if (isCustomFilename) {
			return `${normalizedFolderPath}/${fileName}`;
		}
		return `${normalizedFolderPath}/${fileName}.${fileExtension}`;
	};

	const validateFileName = () => {
		if (!fileName.trim()) {
			logger.error(t("toolkit.codeEditor.notice.file_name_validate"));
			return false;
		}

		if (isCustomFilename && !fileName.includes(".")) {
			logger.error(
				t("toolkit.codeEditor.notice.file_name_with_extension_validate")
			);
			return false;
		}

		return true;
	};

	const handleCreate = async () => {
		if (!validateFileName()) {
			return;
		}

		const fullPath = getFullPath();

		try {
			const existingFile = app.vault.getAbstractFileByPath(fullPath);
			if (existingFile) {
				logger.error(
					t("toolkit.codeEditor.notice.file_already_exists")
				);
				return;
			}

			await app.vault.create(fullPath, "");
			logger.notice(
				t("toolkit.codeEditor.notice.create_file_success", [fullPath])
			);

			if (openAfterCreate) {
				await openInCodeEditor(fullPath, true);
			}

			onClose();
		} catch (error) {
			logger.error(
				t("toolkit.codeEditor.notice.create_file_failed", [error])
			);
		}
	};

	return (
		<div className="rht-create-code-file-modal">
			<div className="code-editor-modal-header">
				<h2>{t("toolkit.codeEditor.modal.header")}</h2>
			</div>

			<div className="code-editor-modal-content">
				<div className="code-editor-input-group">
					<label htmlFor="fileType">
						{t("toolkit.codeEditor.modal.file_type")}
					</label>
					<Select
						value={fileExtension}
						onValueChange={handleFileExtensionChange}
						options={FILE_EXTENSIONS}
						placeholder={t(
							"toolkit.codeEditor.modal.file_type_placeholder"
						)}
					/>
				</div>

				<div className="code-editor-input-group">
					<label htmlFor="fileName">
						{isCustomFilename
							? t(
									"toolkit.codeEditor.modal.file_name_with_extension"
							  )
							: t("toolkit.codeEditor.modal.file_name")}
					</label>
					<Input
						id="fileName"
						value={fileName}
						onChange={(value) => setFileName(value)}
						placeholder={
							isCustomFilename
								? t(
										"toolkit.codeEditor.modal.file_name_with_extension_placeholder"
								  )
								: t(
										"toolkit.codeEditor.modal.file_name_placeholder"
								  )
						}
					/>
				</div>

				<div className="code-editor-modal-preview">
					<span className="preview-label">
						{t("toolkit.codeEditor.modal.preview")}
					</span>
					<span className="preview-value">{getFullPath()}</span>
				</div>

				<div className="code-editor-modal-option">
					<label className="checkbox-label">
						<input
							type="checkbox"
							checked={openAfterCreate}
							onChange={(e) =>
								setOpenAfterCreate(e.target.checked)
							}
						/>
						{t("toolkit.codeEditor.modal.open_file_after_creation")}
					</label>
				</div>
			</div>
			<div className="code-editor-modal-footer">
				<Button variant="outline" onClick={onClose}>
					{t("toolkit.codeEditor.modal.cancel")}
				</Button>
				<Button onClick={handleCreate}>
					{t("toolkit.codeEditor.modal.create")}
				</Button>
			</div>
		</div>
	);
};

export default CreateCodeFileModal;
