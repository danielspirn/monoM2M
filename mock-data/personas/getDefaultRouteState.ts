type PersonaId =
    | 'teen'
    | 'college_student'
    | 'single_adult_male'
    | 'single_adult_female'
    | 'couple_pet'
    | 'parent_2_2'
    | 'single_parent'
    | 'grandparents'
    | 'uncle'
    | 'single_elder'
    | 'adult_caring_for_parents'
    | 'roommates'
    | 'homeowner_diy'
    | 'gig_worker';

type RouteKey =
    | '/home'
    | '/things'
    | '/things/:thingId'
    | '/people'
    | '/people/:personId'
    | '/memories'
    | '/memories/:memoryId'
    | '/settings'
    | '/account'
    | '/plans'
    | '/agent/chat'
    | '/agent/voice'
    | '/fab-menu'
    | '/ingest/:receiptId'
    | '/upgrade-modal';

import defaults from './persona-to-route-defaults.json';

type PersonaDefaultsMap = {
    personas?: Partial<Record<PersonaId, Partial<Record<RouteKey, string>>>>;
};

export function getDefaultRouteState(
    personaId: PersonaId,
    routeKey: RouteKey
): string | null {
    const persona = (defaults as PersonaDefaultsMap).personas?.[personaId];
    if (!persona) return null;
    return persona[routeKey] ?? null;
}
