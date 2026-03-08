import type { PersonaId, RouteKey } from '@/mocks/mockProvider';
import { listAvailableStates } from '@/mocks/mockProvider';

export const PERSONA_OPTIONS: Array<{ value: PersonaId; label: string }> = [
    { value: 'teen', label: 'Teen' },
    { value: 'college_student', label: 'College Student / Young Adult' },
    { value: 'single_adult_male', label: 'Single Adult Male' },
    { value: 'single_adult_female', label: 'Single Adult Female' },
    { value: 'couple_pet', label: 'Couple with Pet' },
    { value: 'parent_2_2', label: 'Parent 2+2 Household' },
    { value: 'single_parent', label: 'Single Parent' },
    { value: 'grandparents', label: 'Grandparents' },
    { value: 'uncle', label: 'Uncle' },
    { value: 'single_elder', label: 'Single Elder' },
    { value: 'adult_caring_for_parents', label: 'Adult Caring for Parents' },
    { value: 'roommates', label: 'Roommates / House-share' },
    { value: 'homeowner_diy', label: 'Homeowner / DIY' },
    { value: 'gig_worker', label: 'Gig Worker / Side-hustle' }
];

export const ROUTE_OPTIONS: Array<{ value: RouteKey; label: string }> = [
    { value: '/home', label: 'Home' },
    { value: '/things', label: 'Things' },
    { value: '/things/:thingId', label: 'Thing Detail' },
    { value: '/people', label: 'People' },
    { value: '/people/:personId', label: 'Person Detail' },
    { value: '/memories', label: 'Memories' },
    { value: '/memories/:memoryId', label: 'Memory Detail' },
    { value: '/settings', label: 'Settings' },
    { value: '/account', label: 'Account' },
    { value: '/plans', label: 'Plans' },
    { value: '/agent/chat', label: 'Agent Chat' },
    { value: '/agent/voice', label: 'Agent Voice' },
    { value: '/fab-menu', label: 'FAB Menu' },
    { value: '/ingest/:receiptId', label: 'Receipt Studio' },
    { value: '/upgrade-modal', label: 'Upgrade Modal' }
];

export function getRouteStateOptions(routeKey: RouteKey): Array<{ value: string; label: string }> {
    return listAvailableStates(routeKey).map((state) => ({
        value: state,
        label: prettifyStateLabel(state)
    }));
}

function prettifyStateLabel(value: string): string {
    return value
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}