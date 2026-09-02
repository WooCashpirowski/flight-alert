'use client';

import { LoaderCircle } from 'lucide-react';
import {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent,
    type ReactNode,
} from 'react';
import { alertTranslations } from '@/src/translations/pl/alerts';
import type {
    AirportOption,
    getAirportByCode,
    normalizeAirportQuery,
    searchAirports,
} from '@/src/modules/alerts/lib/airport-search';

type AirportSearchModule = {
    getAirportByCode: typeof getAirportByCode;
    normalizeAirportQuery: typeof normalizeAirportQuery;
    searchAirports: typeof searchAirports;
};

type AirportSuggestion = AirportOption & {
    kind: 'airport' | 'any' | 'manual';
};

interface AirportComboboxProps {
    id: string;
    label: string;
    value: string;
    onChange: (code: string) => void;
    onBlur: () => void;
    error?: string;
    icon: ReactNode;
    allowAny?: boolean;
}

const MAX_RESULTS = 8;
let airportSearchPromise: Promise<AirportSearchModule> | undefined;

function loadAirportSearch() {
    airportSearchPromise ??= import(
        '@/src/modules/alerts/lib/airport-search'
    );
    return airportSearchPromise;
}

function displayValue(airport: AirportOption) {
    return `${airport.city} (${airport.code})`;
}

function anySuggestion(): AirportSuggestion {
    return {
        code: 'ANY',
        city: alertTranslations.form.anywhere,
        name: alertTranslations.form.anywhereDescription,
        country: '',
        keywords: '',
        priority: -1,
        kind: 'any',
    };
}

function manualSuggestion(code: string): AirportSuggestion {
    return {
        code,
        city: alertTranslations.form.useAirportCode(code),
        name: alertTranslations.form.externalAirportCode,
        country: '',
        keywords: '',
        priority: 3,
        kind: 'manual',
    };
}

function buildSuggestions(
    airportSearch: AirportSearchModule,
    query: string,
    allowAny: boolean,
) {
    const normalized = airportSearch.normalizeAirportQuery(query);
    if (normalized.length < 2) return [];

    const suggestions: AirportSuggestion[] = airportSearch
        .searchAirports(query, MAX_RESULTS)
        .map((airport) => ({ ...airport, kind: 'airport' }));
    const matchesAny =
        allowAny &&
        ['any', 'dowolne miejsce', 'dowolny kierunek'].some((term) =>
            term.startsWith(normalized),
        );
    if (matchesAny) suggestions.unshift(anySuggestion());

    const trimmed = query.trim();
    const manualCode = /^[a-z]{3}$/i.test(trimmed)
        ? trimmed.toUpperCase()
        : undefined;
    if (
        manualCode &&
        manualCode !== 'ANY' &&
        !suggestions.some(({ code }) => code === manualCode)
    ) {
        suggestions.push(manualSuggestion(manualCode));
    }

    return suggestions.slice(0, MAX_RESULTS);
}

export function AirportCombobox({
    id,
    label,
    value,
    onChange,
    onBlur,
    error,
    icon,
    allowAny = false,
}: AirportComboboxProps) {
    const generatedId = useId();
    const listboxId = `${id}-${generatedId.replace(/:/g, '')}-listbox`;
    const inputRef = useRef<HTMLInputElement>(null);
    const [airportSearch, setAirportSearch] =
        useState<AirportSearchModule>();
    const [draft, setDraft] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    useEffect(() => {
        let active = true;
        void loadAirportSearch().then((loaded) => {
            if (active) setAirportSearch(loaded);
        });
        return () => {
            active = false;
        };
    }, []);

    const selectedAirport = airportSearch?.getAirportByCode(value);
    const selectedDisplay =
        value === 'ANY' && allowAny
            ? displayValue(anySuggestion())
            : selectedAirport
              ? displayValue(selectedAirport)
              : value;
    const query = draft ?? selectedDisplay;
    const suggestions = useMemo(
        () =>
            airportSearch && draft !== null
                ? buildSuggestions(airportSearch, draft, allowAny)
                : [],
        [airportSearch, allowAny, draft],
    );

    function selectSuggestion(suggestion: AirportSuggestion) {
        onChange(suggestion.code);
        setDraft(null);
        setActiveIndex(-1);
        setOpen(false);
        inputRef.current?.focus();
    }

    function changeQuery(nextQuery: string) {
        setDraft(nextQuery);
        if (value) onChange('');
        const length = airportSearch
            ? airportSearch.normalizeAirportQuery(nextQuery).length
            : nextQuery.trim().length;
        setActiveIndex(0);
        setOpen(length >= 2);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'ArrowDown') {
            if (!suggestions.length) return;
            event.preventDefault();
            setOpen(true);
            setActiveIndex((current) =>
                current < suggestions.length - 1 ? current + 1 : 0,
            );
        } else if (event.key === 'ArrowUp') {
            if (!suggestions.length) return;
            event.preventDefault();
            setOpen(true);
            setActiveIndex((current) =>
                current > 0 ? current - 1 : suggestions.length - 1,
            );
        } else if (event.key === 'Enter' && open && activeIndex >= 0) {
            event.preventDefault();
            selectSuggestion(suggestions[activeIndex]);
        } else if (event.key === 'Escape' && open) {
            event.preventDefault();
            setOpen(false);
            setActiveIndex(-1);
        }
    }

    const normalizedLength = airportSearch
        ? airportSearch.normalizeAirportQuery(query).length
        : query.trim().length;
    const loading = open && normalizedLength >= 2 && !airportSearch;
    const noResults =
        open &&
        normalizedLength >= 2 &&
        Boolean(airportSearch) &&
        suggestions.length === 0;

    return (
        <div className='airport-combobox'>
            <label htmlFor={id}>{label}</label>
            <div className='field-control airport-combobox-control'>
                {icon}
                <input
                    ref={inputRef}
                    id={id}
                    className='airport-combobox-input'
                    value={query}
                    onChange={(event) => changeQuery(event.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (draft !== null && normalizedLength >= 2) setOpen(true);
                    }}
                    onBlur={() => {
                        setOpen(false);
                        setActiveIndex(-1);
                        onBlur();
                    }}
                    role='combobox'
                    aria-autocomplete='list'
                    aria-expanded={open}
                    aria-controls={listboxId}
                    aria-activedescendant={
                        open && activeIndex >= 0
                            ? `${listboxId}-option-${activeIndex}`
                            : undefined
                    }
                    aria-invalid={Boolean(error)}
                    placeholder={alertTranslations.form.airportPlaceholder}
                    autoComplete='off'
                    autoCapitalize='words'
                    spellCheck={false}
                />
                {loading && (
                    <LoaderCircle
                        className='spin airport-combobox-loader'
                        size={16}
                        aria-label={alertTranslations.form.loadingAirports}
                    />
                )}
            </div>
            {open && (
                <div
                    className='airport-combobox-list'
                    id={listboxId}
                    role='listbox'
                    aria-label={alertTranslations.form.airportSuggestions}
                >
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={`${suggestion.kind}-${suggestion.code}`}
                            id={`${listboxId}-option-${index}`}
                            type='button'
                            className='airport-combobox-option'
                            role='option'
                            aria-selected={activeIndex === index}
                            onPointerDown={(event) => event.preventDefault()}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => selectSuggestion(suggestion)}
                        >
                            <span className='airport-option-heading'>
                                <strong>{suggestion.city}</strong>
                                <span>{suggestion.code}</span>
                            </span>
                            <small>
                                {suggestion.name}
                                {suggestion.country
                                    ? ` · ${suggestion.country}`
                                    : ''}
                            </small>
                        </button>
                    ))}
                    {noResults && (
                        <p className='airport-combobox-empty'>
                            {alertTranslations.form.noAirportsFound}
                        </p>
                    )}
                </div>
            )}
            {error && <span className='field-error'>{error}</span>}
        </div>
    );
}
