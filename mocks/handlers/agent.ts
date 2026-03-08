import { http, HttpResponse } from 'msw';

import fabMenuPayloads from '../../mock-data/routes/fab-menu.payloads.json';
import agentChatPayloads from '../../mock-data/routes/agent-chat.payloads.json';
import agentVoicePayloads from '../../mock-data/routes/agent-voice.payloads.json';
import upgradeModalPayloads from '../../mock-data/routes/upgrade-modal.payloads.json';
import receiptStudioPayloads from '../../mock-data/routes/receipt-studio.payloads.json';

function getState(url: URL, fallback: string) {
    return url.searchParams.get('state') || fallback;
}

export const agentHandlers = [
    http.get('/api/mock/fab-menu', ({ request }) => {
        const url = new URL(request.url);
        const state = getState(url, 'default');
        // @ts-ignore
        return HttpResponse.json(fabMenuPayloads.payloads[state]);
    }),

    http.get('/api/mock/agent/chat', ({ request }) => {
        const url = new URL(request.url);
        const state = getState(url, 'empty');
        // @ts-ignore
        return HttpResponse.json(agentChatPayloads.payloads[state]);
    }),

    http.get('/api/mock/agent/voice', ({ request }) => {
        const url = new URL(request.url);
        const state = getState(url, 'idle');
        // @ts-ignore
        return HttpResponse.json(agentVoicePayloads.payloads[state]);
    }),

    http.get('/api/mock/upgrade-modal', ({ request }) => {
        const url = new URL(request.url);
        const state = getState(url, 'personal_pro_warranty');
        // @ts-ignore
        return HttpResponse.json(upgradeModalPayloads.payloads[state]);
    }),

    http.get('/api/mock/receipt-studio/:receiptId', ({ params, request }) => {
        const url = new URL(request.url);
        const state = getState(url, 'needs_review');
        // @ts-ignore
        return HttpResponse.json({
            receiptId: params.receiptId,
            ...receiptStudioPayloads.payloads[state]
        });
    })
];