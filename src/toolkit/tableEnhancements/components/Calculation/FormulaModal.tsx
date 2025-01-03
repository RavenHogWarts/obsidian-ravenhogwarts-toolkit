import { FC, useState } from "react";
import { ISavedCalculation, OutputType } from "../../types/operations";
import { useModal } from "@/src/components/base/Modal/BaseModal";
import { IMarkdownTable } from "../../types/table";
import FormulaEditor from "./FormulaEditor";
import { t } from "@/src/i18n/i18n";
import './styles/FormulaModal.css';

interface IFormulaModalProps {
  table: IMarkdownTable;
  initialFormula?: string;
  initialOutput?: OutputType;
  initialOutputValue?: string;
  isEditing: boolean;
  onSubmit: (calculation: Partial<ISavedCalculation>) => void;
  onClose: () => void;
}

const OUTPUT_TYPE_OPTIONS = Object.values(OutputType).map(type => ({
  value: type,
  label: type.toUpperCase()
}));

const FormulaModal: FC = () => {
  const { additionalProps } = useModal();
  const {
    table,
    initialFormula = '',
    initialOutput = OutputType.FRONTMATTER,
    initialOutputValue = '',
    isEditing,
    onSubmit,
    onClose
  } = additionalProps as IFormulaModalProps;

  const [formula, setFormula] = useState(initialFormula);
  const [output, setOutput] = useState(initialOutput);
  const [outputValue, setOutputValue] = useState(initialOutputValue);

  const handleSubmit = () => {
    onSubmit({
      config: {
        formula,
        output: {
          type: output,
          value: outputValue
        }
      }
    });
  };

  return (
    <div className="tableEnhancements-formula-modal">
      <div className="tableEnhancements-formula-header">
          <div className="tableEnhancements-form-group">
            <label>{t('toolkit.tableEnhancements.formula.output_type')}</label>
            <select
              value={output}
              onChange={(e) => setOutput(e.target.value as OutputType)}
              className="tableEnhancements-select"
            >
              {OUTPUT_TYPE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="tableEnhancements-form-group">
            <label>{t('toolkit.tableEnhancements.formula.output_value')}</label>
            <input
              type="text"
              value={outputValue}
              onChange={(e) => setOutputValue(e.target.value)}
              placeholder="e.g., frontmatter key"
              className="tableEnhancements-input"
            />
          </div>
      </div>

      <div className="tableEnhancements-formula-content">
        <FormulaEditor
          table={table}
          value={formula}
          onChange={setFormula}
        />
      </div>

      <div className="tableEnhancements-formula-footer">
        <button
          className="tableEnhancements-btn"
          onClick={onClose}
        >
          {t('toolkit.tableEnhancements.formula.cancel')}
        </button>
        <button
          className="tableEnhancements-btn primary"
          onClick={handleSubmit}
          disabled={!formula}
        >
          {isEditing ? t('toolkit.tableEnhancements.formula.update') : t('toolkit.tableEnhancements.formula.add')}
        </button>
      </div>
    </div>
  );
};

export default FormulaModal;