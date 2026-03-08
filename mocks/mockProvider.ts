import personaDefaults from '../mock-data/personas/persona-to-route-defaults.json';

import homePayloads from '../mock-data/routes/home.payloads.json';
import thingsPayloads from '../mock-data/routes/things.payloads.json';
import peoplePayloads from '../mock-data/routes/people.payloads.json';
import memoriesPayloads from '../mock-data/routes/memories.payloads.json';
import settingsPayloads from '../mock-data/routes/settings.payloads.json';
import accountPayloads from '../mock-data/routes/account.payloads.json';
import plansPayloads from '../mock-data/routes/plans.payloads.json';

import thingDetailPayloads from '../mock-data/routes/thing-detail.payloads.json';
import personDetailPayloads from '../mock-data/routes/person-detail.payloads.json';
import memoryDetailPayloads from '../mock-data/routes/memory-detail.payloads.json';

import receiptStudioPayloads from '../mock-data/routes/receipt-studio.payloads.json';
import fabMenuPayloads from '../mock-data/routes/fab-menu.payloads.json';
import agentChatPayloads from '../mock-data/routes/agent-chat.payloads.json';
import agentVoicePayloads from '../mock-data/routes/agent-voice.payloads.json';
import upgradeModalPayloads from '../mock-data/routes/upgrade-modal.payloads.json';

export type PersonaId =
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

export type RouteKey =
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

type PayloadMap = Record<string, unknown>;

const ROUTE_PAYLOADS: Record<RouteKey, PayloadMap> = {
    '/home': homePayloads.payloads as PayloadMap,
    '/things': thingsPayloads.payloads as PayloadMap,
    '/things/:thingId': thingDetailPayloads.payloads as PayloadMap,
    '/people': peoplePayloads.payloads as PayloadMap,
    '/people/:personId': personDetailPayloads.payloads as PayloadMap,
    '/memories': memoriesPayloads.payloads as PayloadMap,
    '/memories/:memoryId': memoryDetailPayloads.payloads as PayloadMap,
    '/settings': settingsPayloads.payloads as PayloadMap,
    '/account': accountPayloads.payloads as PayloadMap,
    '/plans': plansPayloads.payloads as PayloadMap,
    '/agent/chat': agentChatPayloads.payloads as PayloadMap,
    '/agent/voice': agentVoicePayloads.payloads as PayloadMap,
    '/fab-menu': fabMenuPayloads.payloads as PayloadMap,
    '/ingest/:receiptId': receiptStudioPayloads.payloads as PayloadMap,
    '/upgrade-modal': upgradeModalPayloads.payloads as PayloadMap
};

type ResolveOptions = {
    personaId?: PersonaId;
    state?: string;
    params?: Record<string, string>;
};

function structuredCloneSafe<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
}

export function getDefaultState(
    personaId: PersonaId | undefined,
    routeKey: RouteKey
): string | null {
    if (!personaId) return null;
    const personas = (personaDefaults as any).personas ?? {};
    return personas[personaId]?.[routeKey] ?? null;
}

export function resolveMockPayload(
    routeKey: RouteKey,
    options: ResolveOptions = {}
): unknown {
    const { personaId, state, params } = options;
    const payloads = ROUTE_PAYLOADS[routeKey];

    if (!payloads) {
        throw new Error(`No mock payloads registered for route: ${routeKey}`);
    }

    const resolvedState =
        state ||
        getDefaultState(personaId, routeKey) ||
        Object.keys(payloads)[0];

    const payload = payloads[resolvedState];

    if (!payload) {
        throw new Error(
            `No payload found for route "${routeKey}" and state "${resolvedState}"`
        );
    }

    const result = structuredCloneSafe(payload);

    if (params && typeof result === 'object' && result !== null) {
        return { ...result, ...params };
    }

    return result;
}

export function listAvailableStates(routeKey: RouteKey): string[] {
    const payloads = ROUTE_PAYLOADS[routeKey];
    return payloads ? Object.keys(payloads) : [];
}

export function listRoutes(): RouteKey[] {
    return Object.keys(ROUTE_PAYLOADS) as RouteKey[];
}