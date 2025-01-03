import { X } from 'lucide-react';
import * as React from 'react';

interface TagInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}

export const TagInput: React.FC<TagInputProps> = ({ 
  values, 
  onChange, 
  suggestions = [], 
  placeholder 
}) => {
  const [inputValue, setInputValue] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const filteredSuggestions = React.useMemo(() => {
    return suggestions.filter(suggestion => 
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) && 
      !values.includes(suggestion)
    )
  }, [suggestions, inputValue, values]);

  const addValue = (value: string) => {
    if (value && !values.includes(value)) {
      onChange([...values, value]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredSuggestions.length === 0) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setShowSuggestions(true);
        setSelectedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setShowSuggestions(true);
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          addValue(filteredSuggestions[selectedIndex]);
        } else if (inputValue) {
          addValue(inputValue);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (suggestions.filter(s => 
      s.toLowerCase().includes(newValue.toLowerCase()) && 
      !values.includes(s)
    ).length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleFocusCapture = (e: React.FocusEvent) => {
    if (containerRef.current?.contains(e.target)) {
      if (suggestions.filter(s => !values.includes(s)).length > 0) {
        setShowSuggestions(true);
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    addValue(suggestion);
    setInputValue('');
    setSelectedIndex(-1);
    setShowSuggestions(false);
  };

  const handleBlurCapture = (e: React.FocusEvent) => {
    requestAnimationFrame(() => {
      if (!containerRef.current?.contains(e.relatedTarget)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    });
  };

  return (
    <div 
      className="rht-tag-input"
      ref={containerRef}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
    >
      <div className="rht-tag-input-container">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="rht-tag-input-field"
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div 
            className="rht-tag-suggestions"
            onMouseDown={(e) => {
              e.preventDefault();
            }}
          >
            {filteredSuggestions.map((suggestion, index) => (
              <div 
                key={index} 
                className={`rht-tag-suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSuggestionClick(suggestion);
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="rht-tags-container">
        {values.map((value, index) => (
          <div 
            key={index} 
            className="rht-tag-item"
            aria-label={value}
          >
            <span className="rht-tag-text">{value}</span>
            <span
              className="rht-tag-remove"
              onClick={() => onChange(values.filter(v => v !== value))}
              aria-label="Remove tag"
            >
              <X size={14} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};