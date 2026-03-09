import { http, HttpResponse } from 'msw';

import fabMenuPayloads from '../../mock-data/routes/fab-menu.payloads.json';
import agentChatPayloads from '../../mock-data/routes/agent-chat.payloads.json';
import agentVoicePayloads from '../../mock-data/routes/agent-voice.payloads.json';
import upgradeModalPayloads from '../../mock-data/routes/upgrade-modal.payloads.json';
import receiptStudioPayloads from '../../mock-data/routes/receipt-studio.payloads.json';

type PayloadRegistry = { payloads: Record<string, unknown> };
type HandlerContext = { request: Request };
type HandlerWithParams = { request: Request; params: Record<string, string> };

function getState(url: URL, fallback: string) {
    return url.searchParams.get('state') || fallback;
}

export const agentHandlers = [
    http.get('/api/mock/fab-menu', ({ request }: HandlerContext) => {
        const url = new URL(request.url);
        const state = getState(url, 'default');
        return HttpResponse.json((fabMenuPayloads as PayloadRegistry).payloads[state]);
    }),

    http.get('/api/mock/agent/chat', ({ request }: HandlerContext) => {
        const url = new URL(request.url);
        const state = getState(url, 'empty');
        return HttpResponse.json((agentChatPayloads as PayloadRegistry).payloads[state]);
    }),

    http.get('/api/mock/agent/voice', ({ request }: HandlerContext) => {
        const url = new URL(request.url);
        const state = getState(url, 'idle');
        return HttpResponse.json((agentVoicePayloads as PayloadRegistry).payloads[state]);
    }),

    http.get('/api/mock/upgrade-modal', ({ request }: HandlerContext) => {
        const url = new URL(request.url);
        const state = getState(url, 'personal_pro_warranty');
        return HttpResponse.json((upgradeModalPayloads as PayloadRegistry).payloads[state]);
    }),

    http.get('/api/mock/receipt-studio/:receiptId', ({ params, request }: HandlerWithParams) => {
        const url = new URL(request.url);
        const state = getState(url, 'needs_review');
        return HttpResponse.json({
            receiptId: params.receiptId,
            ...((receiptStudioPayloads as PayloadRegistry).payloads[state] as Record<string, unknown>)
        });
    })
];
