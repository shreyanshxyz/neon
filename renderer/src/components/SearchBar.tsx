import React, { useState, useEffect } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function SearchBar({
  value,
  onChange,
  placeholder = "Search files...",
}: SearchBarProps): JSX.Element {
  const [localValue, setLocalValue] = useState<string>(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleClear = (): void => {
    setLocalValue("");
    onChange("");
  };

  return (
    <div className="search-bar">
      <div className="search-input-container">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={localValue}
          onChange={handleChange}
          autoFocus
        />
        {localValue && (
          <button
            className="clear-button"
            onClick={handleClear}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchBar;
