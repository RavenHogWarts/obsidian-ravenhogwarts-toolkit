import * as React from "react";
import { useModal } from "@/src/components/base/Modal/BaseModal";
import { Button } from "@/src/components/base/Button/Button";
import { t } from "@/src/i18n/i18n";
import { Ace } from "ace-builds";
import { AceService } from "../../services/AceService";
import { Logger } from "@/src/core/services/Log";
import "./styles/EditCodeBlockModal.css";
import { ICodeEditorConfig } from "../../types/config";

interface EditCodeBlockModalProps {
	onClose: () => void;
}

export const EditCodeBlockModal: React.FC<EditCodeBlockModalProps> = ({
	onClose,
}) => {
	const { additionalProps } = useModal();
	const editorRef = React.useRef<HTMLDivElement>(null);
	const aceEditorRef = React.useRef<Ace.Editor | null>(null);
	const aceServiceRef = React.useRef<AceService | null>(null);

	const codeBlock = additionalProps?.codeBlock as {
		language: string;
		code: string;
		range: { start: number; end: number };
	};
	const logger = additionalProps?.logger as Logger;
	const onSave = additionalProps?.onSave as (code: string) => Promise<void>;
	const config = additionalProps?.config as ICodeEditorConfig;

	React.useEffect(() => {
		if (editorRef.current && !aceEditorRef.current) {
			aceServiceRef.current = new AceService(logger);
			aceEditorRef.current = aceServiceRef.current.createEditor(
				editorRef.current
			);
			aceServiceRef.current.configureEditor(config, codeBlock.language);
			aceServiceRef.current.setValue(codeBlock.code);
		}

		return () => {
			if (aceServiceRef.current) {
				aceServiceRef.current.destroy();
				aceServiceRef.current = null;
				aceEditorRef.current = null;
			}
		};
	}, []);

	const handleSave = async () => {
		if (!aceServiceRef.current) return;

		const newCode = aceServiceRef.current.getValue();
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
				<div ref={editorRef} className="ace-editor-container" />
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
