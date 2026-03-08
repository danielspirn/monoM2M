import { useMemo } from 'react';
import { resolveMockPayload, type PersonaId, type RouteKey } from './mockProvider';

type UseMockRouteOptions = {
    personaId?: PersonaId;
    state?: string;
    params?: Record<string, string>;
};

export function useMockRoute<T = unknown>(
    routeKey: RouteKey,
    options: UseMockRouteOptions = {}
): T {
    return useMemo(
        () => resolveMockPayload(routeKey, options) as T,
        [routeKey, options.personaId, options.state, JSON.stringify(options.params)]
    );
}