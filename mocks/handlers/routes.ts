import { http, HttpResponse } from 'msw';

import homePayloads from '../../mock-data/routes/home.payloads.json';
import thingsPayloads from '../../mock-data/routes/things.payloads.json';
import peoplePayloads from '../../mock-data/routes/people.payloads.json';
import memoriesPayloads from '../../mock-data/routes/memories.payloads.json';
import settingsPayloads from '../../mock-data/routes/settings.payloads.json';
import accountPayloads from '../../mock-data/routes/account.payloads.json';
import plansPayloads from '../../mock-data/routes/plans.payloads.json';
import thingDetailPayloads from '../../mock-data/routes/thing-detail.payloads.json';
import personDetailPayloads from '../../mock-data/routes/person-detail.payloads.json';
import memoryDetailPayloads from '../../mock-data/routes/memory-detail.payloads.json';

type PayloadRegistry = { payloads: Record<string, unknown> };
type HandlerContext = { request: Request };
type HandlerWithParams = { request: Request; params: Record<string, string> };

function getState(url: URL, fallback: string) {
    return url.searchParams.get('state') || fallback;
}

export const routeHandlers = [
    http.get('/api/mock/home', ({ request }: HandlerContext) => {
        const url = new URL(request.url);
        const state = getState(url, 'empty');
        return HttpResponse.json((homePayloads as PayloadRegistry).payloads[state]);
    }),

    http.get('/api/mock/things', ({ request }: HandlerContext) => {
        const url = new URL(request.url);
        const state = getState(url, 'overview_populated');
        return HttpResponse.json((thingsPayloads as PayloadRegistry).payloads[state]);
    }),

    http.get('/api/mock/people', ({ request }: HandlerContext) => {
        const url = new URL(request.url);
        const state = getState(url, 'network_populated');
        return HttpResponse.json((peoplePayloads as PayloadRegistry).payloads[state]);
    }),

    http.get('/api/mock/memories', ({ request }: HandlerContext) => {
        const url = new URL(request.url);
        const state = getState(url, 'candidate_timeline');
        return HttpResponse.json((memoriesPayloads as PayloadRegistry).payloads[state]);
    }),

    http.get('/api/mock/settings', () => {
        return HttpResponse.json(settingsPayloads.payloads.default);
    }),

    http.get('/api/mock/account', () => {
        return HttpResponse.json(accountPayloads.payloads.default);
    }),

    http.get('/api/mock/plans', () => {
        return HttpResponse.json(plansPayloads.payloads.comparison);
    }),

    http.get('/api/mock/things/:thingId', ({ params, request }: HandlerWithParams) => {
        const url = new URL(request.url);
        const state = getState(url, 'owned_thing_detail');
        return HttpResponse.json({
            thingId: params.thingId,
            ...((thingDetailPayloads as PayloadRegistry).payloads[state] as Record<string, unknown>)
        });
    }),

    http.get('/api/mock/people/:personId', ({ params, request }: HandlerWithParams) => {
        const url = new URL(request.url);
        const state = getState(url, 'friend_detail');
        return HttpResponse.json({
            personId: params.personId,
            ...((personDetailPayloads as PayloadRegistry).payloads[state] as Record<string, unknown>)
        });
    }),

    http.get('/api/mock/memories/:memoryId', ({ params, request }: HandlerWithParams) => {
        const url = new URL(request.url);
        const state = getState(url, 'candidate_memory_detail');
        return HttpResponse.json({
            memoryId: params.memoryId,
            ...((memoryDetailPayloads as PayloadRegistry).payloads[state] as Record<string, unknown>)
        });
    })
];
