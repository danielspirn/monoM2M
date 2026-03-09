'use client';

import { useEffect, useState } from 'react';

import type { PersonaId } from '@/mocks/mockProvider';
import { getSelectedPersona, setSelectedPersona } from '@/mocks/mockSessionStore';
import { PERSONA_OPTIONS } from './mockDevConfig';

type PersonaSwitcherProps = {
    onChange?: (personaId: PersonaId) => void;
    compact?: boolean;
};

export function PersonaSwitcher(props: PersonaSwitcherProps) {
    const { onChange, compact = false } = props;

    const [personaId, setPersonaId] = useState<PersonaId>('single_adult_female');

    useEffect(() => {
        const stored = getSelectedPersona();
        if (stored) {
            setPersonaId(stored);
        } else {
            setSelectedPersona('single_adult_female');
        }
    }, []);

    function handleChange(nextPersonaId: PersonaId) {
        setPersonaId(nextPersonaId);
        setSelectedPersona(nextPersonaId);
        onChange?.(nextPersonaId);
    }

    return (
        <label className={`mock-control ${compact ? 'mock-control--compact' : ''}`}>
            {!compact && <span className="mock-control__label">Persona</span>}
            <select
                className="mock-control__input"
                value={personaId}
                onChange={(event) => handleChange(event.target.value as PersonaId)}
            >
                {PERSONA_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}
