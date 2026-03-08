import type { PersonaId } from './mockProvider';

const PERSONA_KEY = 'm2m.mock.persona';
const STATE_OVERRIDES_KEY = 'm2m.mock.stateOverrides';

export function getSelectedPersona(): PersonaId | null {
    if (typeof window === 'undefined') return null;
    return (window.localStorage.getItem(PERSONA_KEY) as PersonaId | null) ?? null;
}

export function setSelectedPersona(personaId: PersonaId) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PERSONA_KEY, personaId);
}

export function getStateOverrides(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const raw = window.localStorage.getItem(STATE_OVERRIDES_KEY);
    if (!raw) return {};
    try {
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

export function setStateOverride(routeKey: string, state: string) {
    if (typeof window === 'undefined') return;
    const current = getStateOverrides();
    current[routeKey] = state;
    window.localStorage.setItem(STATE_OVERRIDES_KEY, JSON.stringify(current));
}

export function clearStateOverride(routeKey: string) {
    if (typeof window === 'undefined') return;
    const current = getStateOverrides();
    delete current[routeKey];
    window.localStorage.setItem(STATE_OVERRIDES_KEY, JSON.stringify(current));
}