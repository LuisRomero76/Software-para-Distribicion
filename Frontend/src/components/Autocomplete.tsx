import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import './Autocomplete.css';

interface AutocompleteOption {
    value: number | string;
    label: string;
    subtitle?: string;
}

interface AutocompleteProps {
    options: AutocompleteOption[];
    value: number | string | null;
    onChange: (value: number | string) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    allowClear?: boolean;
    id?: string;
    className?: string;
}

export default function Autocomplete({
    options,
    value,
    onChange,
    placeholder = 'Buscar...',
    disabled = false,
    required = false,
    allowClear = true,
    id,
    className = ''
}: AutocompleteProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    // Filtrar opciones basadas en el término de búsqueda
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.subtitle && option.subtitle.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset highlighted index cuando cambian las opciones filtradas
    useEffect(() => {
        setHighlightedIndex(0);
    }, [searchTerm]);

    const handleSelect = (optionValue: number | string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
        inputRef.current?.blur();
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(0);
        setSearchTerm('');
        setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setIsOpen(true);
                setHighlightedIndex(prev =>
                    prev < filteredOptions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setIsOpen(true);
                setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (isOpen && filteredOptions[highlightedIndex]) {
                    handleSelect(filteredOptions[highlightedIndex].value);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSearchTerm('');
                break;
        }
    };

    return (
        <div
            ref={wrapperRef}
            className={`autocomplete-wrapper ${className}`}
        >
            <div className={`autocomplete-input-container ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}>
                <input
                    ref={inputRef}
                    id={id}
                    type="text"
                    className="autocomplete-input"
                    value={isOpen ? searchTerm : (selectedOption?.label || '')}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => {
                        if (!disabled) {
                            setIsOpen(true);
                            setSearchTerm('');
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required && !value}
                    autoComplete="off"
                />
                <div className="autocomplete-icons">
                    {allowClear && value && !disabled && (
                        <button
                            type="button"
                            className="autocomplete-clear"
                            onClick={handleClear}
                            tabIndex={-1}
                        >
                            <X size={16} />
                        </button>
                    )}
                    <ChevronDown
                        size={18}
                        className={`autocomplete-chevron ${isOpen ? 'rotate' : ''}`}
                    />
                </div>
            </div>

            {isOpen && !disabled && (
                <div className="autocomplete-dropdown">
                    {filteredOptions.length > 0 ? (
                        <ul className="autocomplete-list">
                            {filteredOptions.map((option, index) => (
                                <li
                                    key={option.value}
                                    className={`autocomplete-option ${
                                        index === highlightedIndex ? 'highlighted' : ''
                                    } ${option.value === value ? 'selected' : ''}`}
                                    onClick={() => handleSelect(option.value)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                >
                                    <div className="option-label">{option.label}</div>
                                    {option.subtitle && (
                                        <div className="option-subtitle">{option.subtitle}</div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="autocomplete-empty">
                            No se encontraron resultados
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
