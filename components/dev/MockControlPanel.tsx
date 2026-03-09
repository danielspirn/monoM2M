'use client';

import type { RouteKey, PersonaId } from '@/mocks/mockProvider';
import { PersonaSwitcher } from './PersonaSwitcher';
import { RouteStateSwitcher } from './RouteStateSwitcher';

type MockControlPanelProps = {
    routeKey?: RouteKey;
    onPersonaChange?: (personaId: PersonaId) => void;
    onRouteChange?: (routeKey: RouteKey) => void;
    onStateChange?: (state: string | undefined) => void;
};

export function MockControlPanel(props: MockControlPanelProps) {
    const { routeKey, onPersonaChange, onRouteChange, onStateChange } = props;

    return (
        <aside className="mock-panel">
            <div className="mock-panel__intro">
                <h2>Mock Controls</h2>
                <p>Switch persona and route state for Milestone 1 review.</p>
            </div>
            <PersonaSwitcher onChange={onPersonaChange} />
            <div className="mock-panel__divider" />
            <RouteStateSwitcher
                routeKey={routeKey}
                onRouteChange={onRouteChange}
                onStateChange={onStateChange}
            />
        </aside>
    );
}
