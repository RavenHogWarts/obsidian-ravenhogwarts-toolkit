import * as React from "react";
import { useModal } from "@/src/components/base/Modal/BaseModal";
import { Button } from "@/src/components/base/Button/Button";
import { t } from "@/src/i18n/i18n";
import * as monaco from "monaco-editor";
import { Logger } from "@/src/core/services/Log";
import "./styles/EditCodeBlockModal.css";
import { ICodeEditorConfig } from "../../types/config";
import { getMonacoSettings } from "../CodeEditorView";

interface EditCodeBlockModalProps {
	onClose: () => void;
}

export const EditCodeBlockModal: React.FC<EditCodeBlockModalProps> = ({
	onClose,
}) => {
	const { additionalProps } = useModal();
	const editorRef = React.useRef<HTMLDivElement>(null);
	const monacoEditorRef =
		React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

	const codeBlock = additionalProps?.codeBlock as {
		language: string;
		code: string;
		range: { start: number; end: number };
	};
	const logger = additionalProps?.logger as Logger;
	const onSave = additionalProps?.onSave as (code: string) => Promise<void>;
	const config = additionalProps?.config as ICodeEditorConfig;

	React.useEffect(() => {
		if (editorRef.current && !monacoEditorRef.current) {
			monacoEditorRef.current = monaco.editor.create(editorRef.current, {
				value: codeBlock.code,
				...getMonacoSettings(codeBlock.language, config),
			});
		}

		return () => {
			if (monacoEditorRef.current) {
				monacoEditorRef.current.dispose();
			}
		};
	}, []);

	const handleSave = async () => {
		if (!monacoEditorRef.current) return;

		const newCode = monacoEditorRef.current.getValue();
		await onSave(newCode);
		onClose();
	};

	return (
		<div className="rht-edit-code-block-modal">
			<div className="rht-code-editor-modal-header">
				<h2>{t("toolkit.codeEditor.modal.edit_code_block")}</h2>
				<div className="language-indicator">
					{codeBlock.language || "plain text"}
				</div>
			</div>

			<div className="rht-code-editor-modal-content">
				<div ref={editorRef} className="monaco-editor-container" />
			</div>

			<div className="rht-code-editor-modal-footer">
				<Button variant="outline" onClick={onClose}>
					{t("toolkit.codeEditor.modal.cancel")}
				</Button>
				<Button onClick={handleSave}>
					{t("toolkit.codeEditor.modal.save")}
				</Button>
			</div>
		</div>
	);
};

export default EditCodeBlockModal;
