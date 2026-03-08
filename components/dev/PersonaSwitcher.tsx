'use client';

import { useEffect, useState } from 'react';
import { Select, Space, Typography } from 'antd';

import type { PersonaId } from '@/mocks/mockProvider';
import { getSelectedPersona, setSelectedPersona } from '@/mocks/mockSessionStore';
import { PERSONA_OPTIONS } from './mockDevConfig';

const { Text } = Typography;

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
        <Space direction={compact ? 'horizontal' : 'vertical'} size={4} style={{ width: compact ? 'auto' : '100%' }}>
            {!compact && <Text type="secondary">Persona</Text>}
            <Select<PersonaId>
                value={personaId}
                onChange={handleChange}
                options={PERSONA_OPTIONS}
                style={{ minWidth: compact ? 220 : '100%' }}
                size="middle"
                popupMatchSelectWidth={false}
            />
        </Space>
    );
}