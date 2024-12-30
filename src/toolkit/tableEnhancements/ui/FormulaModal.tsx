import { FC, useState } from "react";
import { ISavedCalculation, OutputType } from "../types/operations";
import { useModal } from "@/src/ui/components/base/BaseModal";

interface IFormulaModalProps {
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
              <label>Output Type</label>
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
              <label>Output Value</label>
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
          <label>Formula</label>
          <textarea
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            placeholder="e.g., Sum([A,B]) or TimeSpan([Date], 'days')"
            className="tableEnhancements-textarea"
          />
        </div>

        <div className="tableEnhancements-formula-footer">
          <button
            className="tableEnhancements-btn"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="tableEnhancements-btn primary"
            onClick={handleSubmit}
            disabled={!formula}
          >
            {isEditing ? 'Update' : 'Add'}
          </button>
        </div>
      </div>
    );
};

export default FormulaModal;