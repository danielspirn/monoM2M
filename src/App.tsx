import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { LogoMark } from '@/src/brand';
import { MockControlPanel } from '@/components/dev/MockControlPanel';
import { getSelectedPersona, getStateOverrides, setSelectedPersona, setStateOverride } from '@/mocks/mockSessionStore';
import {
  applyReceiptFilesToDraft,
  applyReceiptFixtureScenarioToDraft,
  findReceiptFixtureScenarioByLabel,
  noReceiptFixtureScenarioLabel,
  receiptFixtureScenarioOptions,
  resolveReceiptFixtureFilesFromDraft,
} from '@/mocks/receiptFixtureScenarios';
import {
  applyLiveReceiptOcrResult,
  buildTrustedPurchaseGraphRecord,
  createLiveReceiptBatch,
  getLiveReceiptStudioPayload,
  hasAnyLiveReceiptRecords,
  hasAnyTrustedPurchaseGraphRecords,
  hasLiveReceipt,
  hasTrustedPurchaseGraphReceipt,
  hydrateLiveReceiptGraphRecords,
  hydrateTrustedPurchaseGraphRecords,
  hydrateLiveReceiptGraphRecord,
  type LiveReceiptOcrPayload,
  type ReceiptStudioLivePayload,
  rerunLiveReceiptExtraction,
  saveLiveReceiptHeaderField,
  saveLiveReceiptLineItemField,
  submitLiveReceiptReview,
} from '@/mocks/receiptWorkflowStore';
import type { LiveReceiptGraphUpsertRequest } from '@/contracts/schema/integrations/live-receipt-graph.contract';
import type { LiveReceiptGraphGetResponse } from '@/contracts/schema/integrations/live-receipt-graph.contract';
import type { LiveReceiptGraphListResponse } from '@/contracts/schema/integrations/live-receipt-graph.contract';
import type { ReceiptProcessingCreateResponse } from '@/contracts/schema/integrations/receipt-processing.contract';
import type { TrustedPurchaseGraphListResponse, TrustedPurchaseGraphUpsertRequest } from '@/contracts/schema/integrations/trusted-purchase-graph.contract';
import {
  getDefaultState,
  getPersonaDefinitions,
  hasMockPayload,
  isMissingStatePayload,
  resolveMockPayload,
  type PersonaId,
  type RouteKey,
} from '@/mocks/mockProvider';
import type { FabMenuPayload } from '@/mocks/sharedUniverse';

import { Icon } from './icons';
import {
  AccountView,
  AgentChatView,
  AgentVoiceView,
  HomeView,
  LoadingState,
  MemoriesView,
  MemoryDetailView,
  PeopleView,
  ReceiptStudioView,
  PersonDetailView,
  PlansView,
  RouteError,
  SettingsView,
  ThingDetailView,
  ThingsView,
} from './routeViews';

type NavItem = {
  label: string;
  route: RouteKey;
  icon: 'home' | 'things' | 'people' | 'memories';
};

type DrawerItem = {
  label: string;
  icon: 'account' | 'settings' | 'plan' | 'spark' | 'shield' | 'chat';
  action: string;
};

type ComposerKind = 'receipt' | 'thing' | 'person' | 'memory' | 'note';

const PRIMARY_NAV: NavItem[] = [
  { label: 'Home', route: '/home', icon: 'home' },
  { label: 'Things', route: '/things', icon: 'things' },
  { label: 'People', route: '/people', icon: 'people' },
  { label: 'Memories', route: '/memories', icon: 'memories' },
];

const DRAWER_ITEMS: DrawerItem[] = [
  { label: 'Account', icon: 'account', action: 'route:/account' },
  { label: 'Settings', icon: 'settings', action: 'route:/settings' },
  { label: 'Plan', icon: 'plan', action: 'route:/plans' },
  { label: 'Upgrade', icon: 'spark', action: 'route:/plans' },
  { label: 'Privacy & Security', icon: 'shield', action: 'notice:privacy' },
  { label: 'Help', icon: 'chat', action: 'notice:help' },
  { label: 'Sign Out', icon: 'account', action: 'notice:signout' },
];

const ACTION_STRIPS: Record<RouteKey, string[]> = {
  '/home': ['Recent', 'Follow up', 'Connected'],
  '/things': ['Returns', 'Warranty', 'Linked'],
  '/people': ['Household', 'Gifts', 'Linked'],
  '/memories': ['Timeline', 'People', 'Linked'],
  '/settings': ['General', 'Notifications', 'Privacy'],
  '/account': ['Profile', 'Sessions', 'Household'],
  '/plans': ['Compare', 'Upgrade', 'Family Trust'],
  '/agent/chat': ['Prompts', 'Results', 'Linked'],
  '/agent/voice': ['Voice', 'Examples', 'Linked'],
  '/things/:thingId': ['Summary', 'Related', 'Activity'],
  '/people/:personId': ['Summary', 'Related', 'Activity'],
  '/memories/:memoryId': ['Story', 'Related', 'Timeline'],
  '/fab-menu': ['Create', 'Capture', 'Ask'],
  '/ingest/:receiptId': ['Review', 'Line Items', 'Evidence'],
  '/upgrade-modal': ['Plans', 'Value', 'Compare'],
};

const APP_TITLES: Partial<Record<RouteKey, string>> = {
  '/things': 'Things',
  '/people': 'People',
  '/memories': 'Memories',
  '/settings': 'Settings',
  '/account': 'Account',
  '/plans': 'Plans',
  '/agent/chat': 'Ask Agent',
  '/agent/voice': 'Ask Agent by Voice',
  '/ingest/:receiptId': 'Receipt Review',
  '/things/:thingId': 'Thing detail',
  '/people/:personId': 'Person detail',
  '/memories/:memoryId': 'Memory detail',
};

const BRANDED_TOPBAR_META: Partial<Record<RouteKey, string>> = {
  '/things': 'Inventory, coverage, linked stories',
  '/things/:thingId': 'Inventory, coverage, linked stories',
  '/people': 'Relationships, gifts, context',
  '/people/:personId': 'Relationships, gifts, context',
  '/memories': 'Timeline, people, receipts',
  '/memories/:memoryId': 'Timeline, people, receipts',
};

export function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}

function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const routeContext = useMemo(() => getRouteContext(location.pathname), [location.pathname]);
  const { params, routeKey } = routeContext;

  const [selectedPersona, setPersona] = useState<PersonaId>('single_adult_female');
  const [stateOverrides, setOverrides] = useState<Record<string, string>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [composer, setComposer] = useState<ComposerKind | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [receiptRefreshToken, setReceiptRefreshToken] = useState(0);
  const [receiptHydrationAttempts, setReceiptHydrationAttempts] = useState<Record<string, true>>({});
  const [receiptGraphListHydrated, setReceiptGraphListHydrated] = useState(false);
  const [trustedPurchaseGraphHydrated, setTrustedPurchaseGraphHydrated] = useState(false);

  useEffect(() => {
    const storedPersona = getSelectedPersona();
    if (storedPersona) {
      setPersona(storedPersona);
    }
    setOverrides(getStateOverrides());
  }, []);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timer = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const activeState = stateOverrides[routeKey] ?? getDefaultState(selectedPersona, routeKey) ?? undefined;
  const payload = useMemo(
    () => {
      void receiptRefreshToken;

      return resolveMockPayload(routeKey, {
        personaId: selectedPersona,
        state: activeState,
        params,
      });
    },
    [activeState, params, receiptRefreshToken, routeKey, selectedPersona]
  );

  const pageTitle = routeKey === '/home' ? undefined : APP_TITLES[routeKey] ?? 'Money to Memories';
  const actionStrip = getActionStrip(payload, routeKey);
  const fabPayload = resolveMockPayload('/fab-menu', {
    personaId: selectedPersona,
    state: getDefaultState(selectedPersona, '/fab-menu') ?? 'default',
  }) as FabMenuPayload;
  const personaMeta = getPersonaDefinitions().find((persona) => persona.id === selectedPersona);
  const searchPlaceholder = routeKey === '/home' ? getHomeSearchPlaceholder(payload) : undefined;
  const receiptStatus =
    routeKey === '/ingest/:receiptId' &&
    payload &&
    typeof payload === 'object' &&
    'receipt' in payload &&
    payload.receipt &&
    typeof payload.receipt === 'object' &&
    'status' in payload.receipt &&
    typeof payload.receipt.status === 'string'
      ? payload.receipt.status
      : null;

  useEffect(() => {
    if (routeKey !== '/ingest/:receiptId' || receiptStatus !== 'processing') {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setReceiptRefreshToken((current) => current + 1);
    }, 900);

    return () => window.clearTimeout(timer);
  }, [receiptStatus, routeKey, params?.receiptId]);

  useEffect(() => {
    const receiptId = params?.receiptId;

    if (
      routeKey !== '/ingest/:receiptId'
      || !receiptId
      || hasLiveReceipt(receiptId)
      || hasTrustedPurchaseGraphReceipt(receiptId)
      || receiptHydrationAttempts[receiptId]
    ) {
      return;
    }

    if (!trustedPurchaseGraphHydrated && !hasAnyTrustedPurchaseGraphRecords()) {
      return;
    }

    setReceiptHydrationAttempts((current) => ({ ...current, [receiptId]: true }));

    void requestLiveReceiptGraphRecord(receiptId)
      .then((graphRecord) => {
        if (!graphRecord) {
          return;
        }

        hydrateLiveReceiptGraphRecord(graphRecord);
        setReceiptRefreshToken((current) => current + 1);
      })
      .catch(() => {
        setNotice('Backend receipt restore was unavailable, so the review screen stayed on the fallback shell.');
      });
  }, [params?.receiptId, receiptHydrationAttempts, routeKey, trustedPurchaseGraphHydrated]);

  useEffect(() => {
    if (receiptGraphListHydrated || hasAnyLiveReceiptRecords()) {
      return;
    }

    void requestLiveReceiptGraphList()
      .then((records) => {
        setReceiptGraphListHydrated(true);

        if (!records.length) {
          return;
        }

        hydrateLiveReceiptGraphRecords(records);
        setReceiptRefreshToken((current) => current + 1);
      })
      .catch(() => {
        setReceiptGraphListHydrated(true);
      });
  }, [receiptGraphListHydrated]);

  useEffect(() => {
    if (trustedPurchaseGraphHydrated || hasAnyTrustedPurchaseGraphRecords()) {
      return;
    }

    void requestTrustedPurchaseGraphList()
      .then((records) => {
        setTrustedPurchaseGraphHydrated(true);

        if (!records.length) {
          return;
        }

        hydrateTrustedPurchaseGraphRecords(records);
        setReceiptRefreshToken((current) => current + 1);
      })
      .catch(() => {
        setTrustedPurchaseGraphHydrated(true);
      });
  }, [trustedPurchaseGraphHydrated]);

  function handlePersonaChange(personaId: PersonaId) {
    setPersona(personaId);
    setSelectedPersona(personaId);
  }

  function handleRouteStateChange(state: string | undefined) {
    if (!state) {
      const nextOverrides = getStateOverrides();
      delete nextOverrides[routeKey];
      setOverrides(nextOverrides);
      return;
    }

    setStateOverride(routeKey, state);
    setOverrides(getStateOverrides());
  }

  function handleRouteChange(nextRoute: RouteKey) {
    navigate(nextRoute === '/home' ? '/home' : nextRoute);
  }

  function handleAction(action: string) {
    if (!action) return;

    if (action === 'open:fabsheet') {
      setFabOpen(true);
      return;
    }

    if (action === 'capture:receipt' || action === 'route:/ingest/new') {
      setFabOpen(false);
      setComposer('receipt');
      return;
    }

    if (action.startsWith('compose:')) {
      setFabOpen(false);
      setComposer(action.replace('compose:add_', '').replace('compose:', '') as ComposerKind);
      return;
    }

    if (action.startsWith('route:')) {
      const target = action.replace('route:', '');
      navigate(target);
      setDrawerOpen(false);
      setFabOpen(false);
      return;
    }

    switch (action) {
      case 'agent:chat':
      case 'fab:ask_agent_chat':
        navigate('/agent/chat');
        setFabOpen(false);
        return;
      case 'agent:voice':
      case 'fab:ask_agent_voice':
        navigate('/agent/voice');
        setFabOpen(false);
        return;
      case 'plans:cta':
      case 'plans:personal_pro':
      case 'plans:trust':
        navigate('/plans');
        return;
      default:
        if (action.startsWith('receipt:submit:')) {
          const receiptId = action.replace('receipt:submit:', '');
          const nextPayload = submitLiveReceiptReview(receiptId);
          if (nextPayload) {
            void syncReceiptMirrors(nextPayload);
          }
          setReceiptRefreshToken((current) => current + 1);
          setNotice(
            nextPayload
              ? `${nextPayload.header.merchantName} is now trusted and ready to feed Things, People, and Memories.`
              : 'Receipt review is only live for newly captured receipts in this slice.'
          );
          return;
        }
        if (action.startsWith('receipt:rerun:')) {
          const receiptId = action.replace('receipt:rerun:', '');
          const nextPayload = rerunLiveReceiptExtraction(receiptId);
          if (nextPayload) {
            void syncReceiptMirrors(nextPayload);
          }
          setReceiptRefreshToken((current) => current + 1);
          setNotice(
            nextPayload
              ? `${nextPayload.header.merchantName} is rerunning extraction so parsed fields and evidence can be refreshed.`
              : 'Receipt rerun is only live for newly captured receipts in this slice.'
          );
          return;
        }
        if (action.startsWith('receipt:edit-header:')) {
          const [, , receiptId, field, encodedValue] = action.split(':');
          const nextPayload = saveLiveReceiptHeaderField(
            receiptId,
            field as 'merchantName' | 'purchasedAt' | 'grandTotal',
            decodeURIComponent(encodedValue ?? ''),
          );
          if (nextPayload) {
            void syncReceiptMirrors(nextPayload);
          }
          setReceiptRefreshToken((current) => current + 1);
          setNotice(nextPayload ? `${nextPayload.header.merchantName} review changes saved.` : 'Receipt header editing is only live for captured receipts in this slice.');
          return;
        }
        if (action.startsWith('receipt:edit-line:')) {
          const [, , receiptId, lineItemId, field, encodedValue] = action.split(':');
          const nextPayload = saveLiveReceiptLineItemField(
            receiptId,
            lineItemId,
            field as 'descriptionNormalized' | 'lineTotal',
            decodeURIComponent(encodedValue ?? ''),
          );
          if (nextPayload) {
            void syncReceiptMirrors(nextPayload);
          }
          setReceiptRefreshToken((current) => current + 1);
          setNotice(nextPayload ? `${nextPayload.header.merchantName} line-item review changes saved.` : 'Receipt line-item editing is only live for captured receipts in this slice.');
          return;
        }
        if (action.startsWith('receipt:convert:')) {
          setNotice('Convert to Thing is the next receipt-core slice. Durable item candidates are now being surfaced here first.');
          return;
        }
        if (action.startsWith('notice:')) {
          setNotice(mockNoticeForAction(action));
          setDrawerOpen(false);
          setFabOpen(false);
          return;
        }
        if (action.startsWith('retry:')) {
          setNotice('Retry is mocked. Use the route-state switcher to move out of the error state.');
          return;
        }
        setNotice(`Mock action: ${action}`);
    }
  }

  async function handleComposerSubmit(kind: ComposerKind, draft: Record<string, string>, files: File[] = []) {
    setComposer(null);
    switch (kind) {
      case 'receipt':
        {
          const captureResult = createLiveReceiptBatch({
            merchant: draft.merchant,
            purchaseDate: draft.date,
            source: draft.source,
            summary: draft.summary,
            fixtureFiles: resolveReceiptFixtureFilesFromDraft(draft),
            previewUrls: parsePreviewUrls(draft.receiptPreviewUrls),
          });

          setNotice(
            captureResult.issueCount
              ? `${captureResult.detectedReceiptCount} receipts detected. We only surfaced ${captureResult.issueCount} issue${captureResult.issueCount === 1 ? '' : 's'} that may need review.`
              : `${captureResult.detectedReceiptCount} receipt${captureResult.detectedReceiptCount === 1 ? '' : 's'} detected and processing quietly.`
          );
          setReceiptRefreshToken((current) => current + 1);
          navigate(`/ingest/${captureResult.primaryReceiptId}`);
          const initialPayload = getLiveReceiptStudioPayload(captureResult.primaryReceiptId);
          if (initialPayload) {
            void syncReceiptMirrors(initialPayload);
          }

          if (files.length && !resolveReceiptFixtureFilesFromDraft(draft).length) {
            void requestLiveReceiptProcessing(files, draft.source)
              .then((ocrPayload) => {
                if (!ocrPayload) {
                  return;
                }

                const nextPayload = applyLiveReceiptOcrResult(captureResult.primaryReceiptId, ocrPayload);

                if (nextPayload) {
                  void syncReceiptMirrors(nextPayload);
                  setReceiptRefreshToken((current) => current + 1);
                  setNotice(`${nextPayload.header.merchantName} OCR details are ready for review.`);
                }
              })
              .catch(() => {
                setNotice('Live OCR was unavailable, so the receipt stayed on the seeded review path.');
              });
          }
        }
        return;
      case 'thing':
        setNotice('Mock Thing created. The overview and detail patterns are ready for backend data later.');
        navigate('/things');
        return;
      case 'person':
        setNotice('Mock person created. People can now act as a real relationship layer.');
        navigate('/people');
        return;
      case 'memory':
        setNotice('Mock memory created. The memory detail pattern is now part of the core experience.');
        navigate('/memories');
        return;
      case 'note':
        setNotice('Quick capture saved as a mocked note.');
        navigate('/home');
    }
  }

  return (
    <div className="app-scene">
      <div className="app-scene__aurora" />
      <div className="workspace">
        <div className="phone-shell">
          <ShellHeader
            pageTitle={pageTitle}
            routeKey={routeKey}
            searchPlaceholder={searchPlaceholder}
            onOpenDrawer={() => setDrawerOpen(true)}
          />

          <main className="route-body">
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<RouteOutlet routeKey="/home" state={activeState} payload={payload} onAction={handleAction} />} />
              <Route path="/things" element={<RouteOutlet routeKey="/things" state={activeState} payload={payload} onAction={handleAction} />} />
              <Route path="/things/:thingId" element={<RouteOutlet routeKey="/things/:thingId" state={activeState} payload={payload} onAction={handleAction} />} />
              <Route path="/people" element={<RouteOutlet routeKey="/people" state={activeState} payload={payload} onAction={handleAction} />} />
              <Route path="/people/:personId" element={<RouteOutlet routeKey="/people/:personId" state={activeState} payload={payload} onAction={handleAction} />} />
              <Route path="/memories" element={<RouteOutlet routeKey="/memories" state={activeState} payload={payload} onAction={handleAction} />} />
              <Route path="/memories/:memoryId" element={<RouteOutlet routeKey="/memories/:memoryId" state={activeState} payload={payload} onAction={handleAction} />} />
              <Route path="/settings" element={<RouteOutlet routeKey="/settings" state={activeState} payload={payload} onAction={handleAction} />} />
              <Route path="/account" element={<RouteOutlet routeKey="/account" state={activeState} payload={payload} onAction={handleAction} />} />
              <Route path="/plans" element={<RouteOutlet routeKey="/plans" state={activeState} payload={payload} onAction={handleAction} />} />
              <Route path="/agent/chat" element={<RouteOutlet routeKey="/agent/chat" state={activeState} payload={payload} onAction={handleAction} />} />
              <Route path="/agent/voice" element={<RouteOutlet routeKey="/agent/voice" state={activeState} payload={payload} onAction={handleAction} />} />
              <Route path="/ingest/:receiptId" element={<RouteOutlet routeKey="/ingest/:receiptId" state={activeState} payload={payload} onAction={handleAction} />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </main>

          <div className="shell-bottom">
            <div aria-label="Secondary navigation" className="context-strip">
              {actionStrip.map((item, index) => (
                <button className={`context-chip ${index === 0 ? 'context-chip--active' : ''}`} key={item} type="button">
                  {item}
                </button>
              ))}
            </div>

            <nav className="bottom-nav" aria-label="Primary navigation">
              {PRIMARY_NAV.slice(0, 2).map((item) => (
                <NavButton key={item.route} active={isPrimaryRouteActive(item.route, routeKey)} item={item} onClick={() => navigate(item.route)} />
              ))}
              <button
                aria-label="Open add or ask menu"
                className="fab-button"
                type="button"
                onClick={() => setFabOpen(true)}
              >
                <Icon name="plus" className="icon-lg" />
              </button>
              {PRIMARY_NAV.slice(2).map((item) => (
                <NavButton key={item.route} active={isPrimaryRouteActive(item.route, routeKey)} item={item} onClick={() => navigate(item.route)} />
              ))}
            </nav>
          </div>
        </div>

        <div className="control-rail">
          <MockControlPanel
            routeKey={routeKey}
            onPersonaChange={handlePersonaChange}
            onRouteChange={handleRouteChange}
            onStateChange={handleRouteStateChange}
          />
          <aside className="review-card">
            <p className="eyebrow">Persona summary</p>
            <h2>{personaMeta?.label}</h2>
            <p>{personaMeta?.summary}</p>
            <div className="chip-row">
              {personaMeta?.premiumTriggers.map((trigger) => (
                <span className="chip" key={trigger}>
                  {trigger.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </aside>
        </div>
      </div>

      {drawerOpen ? (
        <Overlay onClose={() => setDrawerOpen(false)}>
          <aside className="drawer">
            <div className="drawer__header">
              <LogoMark className="drawer__logo" decorative />
              <div>
                <p className="eyebrow">Standard drawer</p>
                <h2>Money to Memories</h2>
              </div>
            </div>
            <div className="drawer__list">
              {DRAWER_ITEMS.map((item) => (
                <button className="drawer-item" key={item.label} type="button" onClick={() => handleAction(item.action)}>
                  <Icon name={item.icon} className="icon-sm" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </aside>
        </Overlay>
      ) : null}

      {fabOpen ? (
        <Overlay onClose={() => setFabOpen(false)}>
          <aside className="fab-sheet fab-sheet--expanded">
            <div className="fab-sheet__header fab-sheet__header--stacked">
              <p className="eyebrow">Add Actions</p>
              <h2>{fabPayload.title}</h2>
            </div>
            <div className="fab-sheet__groups">
              {fabPayload.groups.map((group) => (
                <section className="fab-sheet__group" key={group.title}>
                  <h3>{group.title}</h3>
                  <div className="fab-sheet__list">
                    {group.items.map((item) => (
                      <button className="fab-sheet__item" key={item.label} type="button" onClick={() => handleAction(item.action)}>
                        <span className="fab-sheet__icon">{iconForFabItem(item.icon ?? 'spark')}</span>
                        <span>
                          <strong>{item.label}</strong>
                          {item.suggestedPrompt ? <small>{item.suggestedPrompt}</small> : null}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </aside>
        </Overlay>
      ) : null}

      {composer ? (
        <Overlay onClose={() => setComposer(null)}>
          <CreationSheet
            key={composer}
            kind={composer}
            onClose={() => setComposer(null)}
            onSubmit={(draft, files) => handleComposerSubmit(composer, draft, files)}
          />
        </Overlay>
      ) : null}

      {notice ? <div className="notice-toast">{notice}</div> : null}
    </div>
  );
}

function ShellHeader(props: {
  onOpenDrawer: () => void;
  pageTitle?: string;
  routeKey: RouteKey;
  searchPlaceholder?: string;
}) {
  if (props.routeKey === '/home') {
    return (
      <header className="topbar topbar--home">
        <div className="search-pill">
          <Icon name="search" className="icon-sm" />
          <span>{props.searchPlaceholder ?? 'Search purchases, Things, people, memories'}</span>
        </div>
        <button
          aria-label="Open drawer"
          className="icon-button"
          type="button"
          onClick={props.onOpenDrawer}
        >
          <Icon name="menu" className="icon-md" />
        </button>
      </header>
    );
  }

  if (props.routeKey in BRANDED_TOPBAR_META) {
    return (
      <header className="topbar topbar--branded">
        <div className="topbar__brand">
          <div className="topbar__logo-shell">
            <LogoMark className="topbar__logo" decorative />
          </div>
          <div className="topbar__brand-copy">
            <span>Money to Memories</span>
            <strong>{props.pageTitle}</strong>
            <small>{BRANDED_TOPBAR_META[props.routeKey]}</small>
          </div>
        </div>
        <button
          aria-label="Open drawer"
          className="icon-button icon-button--ghost"
          type="button"
          onClick={props.onOpenDrawer}
        >
          <Icon name="menu" className="icon-md" />
        </button>
      </header>
    );
  }

  return (
    <header className="topbar topbar--secondary">
      <div className="topbar__title">
        <span>{props.pageTitle}</span>
      </div>
      <button
        aria-label="Open drawer"
        className="icon-button"
        type="button"
        onClick={props.onOpenDrawer}
      >
        <Icon name="menu" className="icon-md" />
      </button>
    </header>
  );
}

function RouteOutlet(props: {
  routeKey: RouteKey;
  state?: string;
  payload: unknown;
  onAction: (action: string) => void;
}) {
  if (isMissingStatePayload(props.payload)) {
    if (props.state === 'loading') {
      return <LoadingState label={`Loading ${APP_TITLES[props.routeKey] ?? 'route'}`} blocks={4} />;
    }

    if (props.state === 'error') {
      return (
        <RouteError
          title={`${APP_TITLES[props.routeKey] ?? 'Route'} mock state`}
          body={`The "${props.state}" state is handled generically because no dedicated payload exists for this route yet.`}
        />
      );
    }

    if (props.state && !hasMockPayload(props.routeKey, props.state)) {
      return (
        <RouteError
          title="State not mapped yet"
          body={`The selected mock state "${props.state}" is described in the registry but has no route payload yet.`}
        />
      );
    }
  }

  switch (props.routeKey) {
    case '/home':
      return <HomeView state={props.state ?? 'default'} payload={props.payload as never} onAction={props.onAction} />;
    case '/things':
      return <ThingsView state={props.state ?? 'default'} payload={props.payload as never} onAction={props.onAction} />;
    case '/things/:thingId':
      return <ThingDetailView state={props.state ?? 'default'} payload={props.payload as never} onAction={props.onAction} />;
    case '/people':
      return <PeopleView state={props.state ?? 'default'} payload={props.payload as never} onAction={props.onAction} />;
    case '/people/:personId':
      return <PersonDetailView state={props.state ?? 'default'} payload={props.payload as never} onAction={props.onAction} />;
    case '/memories':
      return <MemoriesView state={props.state ?? 'default'} payload={props.payload as never} onAction={props.onAction} />;
    case '/memories/:memoryId':
      return <MemoryDetailView state={props.state ?? 'default'} payload={props.payload as never} onAction={props.onAction} />;
    case '/settings':
      return <SettingsView state={props.state ?? 'default'} payload={props.payload as never} onAction={props.onAction} />;
    case '/account':
      return <AccountView state={props.state ?? 'default'} payload={props.payload as never} onAction={props.onAction} />;
    case '/plans':
      return <PlansView state={props.state ?? 'default'} payload={props.payload as never} onAction={props.onAction} />;
    case '/agent/chat':
      return <AgentChatView state={props.state ?? 'default'} payload={props.payload as never} onAction={props.onAction} />;
    case '/agent/voice':
      return <AgentVoiceView state={props.state ?? 'default'} payload={props.payload as never} onAction={props.onAction} />;
    case '/ingest/:receiptId':
      return <ReceiptStudioView state={props.state ?? 'default'} payload={props.payload as never} onAction={props.onAction} />;
    default:
      return <RouteError title="Route out of scope" body="This milestone only includes the primary mocked shell routes." />;
  }
}

function NavButton(props: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <button
      className={`nav-button ${props.active ? 'nav-button--active' : ''}`}
      type="button"
      onClick={props.onClick}
    >
      <Icon name={props.item.icon} className="icon-md" />
      <span>{props.item.label}</span>
    </button>
  );
}

function Overlay(props: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="overlay" role="presentation" onClick={props.onClose}>
      <div role="presentation" onClick={(event) => event.stopPropagation()}>
        {props.children}
      </div>
    </div>
  );
}

function CreationSheet(props: { kind: ComposerKind; onClose: () => void; onSubmit: (draft: Record<string, string>, files: File[]) => void }) {
  const [draft, setDraft] = useState<Record<string, string>>(() => getInitialDraft(props.kind));
  const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const config = getComposerConfig(props.kind);

  useEffect(() => () => {
    filePreviewUrls.forEach((url) => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  }, [filePreviewUrls]);

  function updateDraft(fieldId: string, value: string) {
    if (props.kind === 'receipt' && fieldId === 'fixtureScenario') {
      setDraft((current) => applyReceiptFixtureScenarioToDraft(current, value));
      return;
    }

    setDraft((current) => ({ ...current, [fieldId]: value }));
  }

  function updateReceiptFiles(fileList: FileList | null) {
    const nextFiles = Array.from(fileList ?? []);
    setFilePreviewUrls((current) => {
      current.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      return [];
    });

    const previewUrls = nextFiles
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => {
        if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
          return URL.createObjectURL(file);
        }

        return `preview://${encodeURIComponent(file.name)}`;
      });
    const fileNames = nextFiles.map((file) => file.name);
    setSelectedFiles(nextFiles);
    setFilePreviewUrls(previewUrls);
    setDraft((current) => ({
      ...applyReceiptFilesToDraft(current, fileNames),
      receiptPreviewUrls: JSON.stringify(previewUrls),
    }));
  }

  function submitDraft(event?: { preventDefault: () => void }) {
    event?.preventDefault();
    props.onSubmit(draft, selectedFiles);
  }

  function handleFormKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    const target = event.target as HTMLElement | null;

    if (!target || target.tagName === 'BUTTON') {
      return;
    }

    event.preventDefault();
    props.onSubmit(draft, selectedFiles);
  }

  return (
    <aside className="composer-sheet">
      <form className="composer-sheet__layout" onKeyDown={handleFormKeyDown} onSubmit={submitDraft}>
        <div className="composer-sheet__scroller">
          <div className="fab-sheet__header fab-sheet__header--stacked">
            <p className="eyebrow">Mocked create flow</p>
            <h2>{config.title}</h2>
            <p>{config.intro}</p>
          </div>
          <div className="composer-sheet__form">
            {config.fields.map((field) => (
              <label className="composer-field" key={field.id}>
                <span>{field.label}</span>
                {field.type === 'textarea' ? (
                  <textarea
                    rows={4}
                    value={draft[field.id] ?? ''}
                    onChange={(event) => updateDraft(field.id, event.target.value)}
                  />
                ) : field.type === 'file' ? (
                  <div className="mini-stack">
                    <input
                      accept="image/*,.pdf,video/*"
                      aria-label={field.label}
                      multiple
                      type="file"
                      onChange={(event) => updateReceiptFiles(event.target.files)}
                    />
                    <small>{draft.selectedFileNames || 'Choose one or more uploaded receipt images, PDFs, or videos.'}</small>
                  </div>
                ) : field.options ? (
                  <select
                    value={draft[field.id] ?? field.options[0]}
                    onChange={(event) => updateDraft(field.id, event.target.value)}
                  >
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={draft[field.id] ?? ''}
                    onChange={(event) => updateDraft(field.id, event.target.value)}
                  />
                )}
              </label>
            ))}
          </div>
          <div className="composer-sheet__preview">
            <p className="eyebrow">Preview</p>
            <h3>{draft[config.previewTitleField] || config.previewFallback}</h3>
            <p>{config.previewBody(draft)}</p>
            {props.kind === 'receipt' ? (
              <div className="composer-receipt-preview">
                {filePreviewUrls[0] ? (
                  <img alt="Receipt preview" className="composer-receipt-preview__image" src={filePreviewUrls[0]} />
                ) : (
                  <div className="composer-receipt-preview__placeholder">
                    <Icon name="receipt" className="icon-md" />
                    <span>{draft.selectedFileNames || 'Choose a receipt image to preview it here.'}</span>
                  </div>
                )}
                <div className="mini-stack">
                  <small>{draft.selectedFileNames || 'No local image selected yet.'}</small>
                  <small>{draft.source || 'Upload photo'}</small>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div className="composer-sheet__actions composer-sheet__actions--sticky">
          <button className="action-button" type="button" onClick={props.onClose}>
            Cancel
          </button>
          <button className="action-button action-button--primary" type="submit">
            {config.submitLabel}
          </button>
        </div>
      </form>
    </aside>
  );
}

function getRouteContext(pathname: string): { routeKey: RouteKey; params?: Record<string, string> } {
  const thingMatch = pathname.match(/^\/things\/([^/]+)$/);
  if (thingMatch) {
    return { routeKey: '/things/:thingId', params: { thingId: thingMatch[1] } };
  }

  const personMatch = pathname.match(/^\/people\/([^/]+)$/);
  if (personMatch) {
    return { routeKey: '/people/:personId', params: { personId: personMatch[1] } };
  }

  const memoryMatch = pathname.match(/^\/memories\/([^/]+)$/);
  if (memoryMatch) {
    return { routeKey: '/memories/:memoryId', params: { memoryId: memoryMatch[1] } };
  }

  const receiptMatch = pathname.match(/^\/ingest\/([^/]+)$/);
  if (receiptMatch) {
    return { routeKey: '/ingest/:receiptId', params: { receiptId: receiptMatch[1] } };
  }

  switch (pathname) {
    case '/home':
      return { routeKey: '/home' };
    case '/things':
      return { routeKey: '/things' };
    case '/people':
      return { routeKey: '/people' };
    case '/memories':
      return { routeKey: '/memories' };
    case '/settings':
      return { routeKey: '/settings' };
    case '/account':
      return { routeKey: '/account' };
    case '/plans':
      return { routeKey: '/plans' };
    case '/agent/chat':
      return { routeKey: '/agent/chat' };
    case '/agent/voice':
      return { routeKey: '/agent/voice' };
    default:
      return { routeKey: '/home' };
  }
}

function isPrimaryRouteActive(navRoute: RouteKey, routeKey: RouteKey) {
  if (navRoute === '/things') return routeKey === '/things' || routeKey === '/things/:thingId';
  if (navRoute === '/people') return routeKey === '/people' || routeKey === '/people/:personId';
  if (navRoute === '/memories') return routeKey === '/memories' || routeKey === '/memories/:memoryId';
  return navRoute === routeKey;
}

function mockNoticeForAction(action: string) {
  switch (action) {
    case 'notice:privacy':
      return 'Privacy & Security remains represented in Settings for this milestone.';
    case 'notice:help':
      return 'Help is still mocked, but the drawer slot remains stable for future work.';
    case 'notice:signout':
      return 'Production auth remains out of scope. Sign out stays mocked only.';
    default:
      return 'Mock-only action.';
  }
}

function getActionStrip(payload: unknown, routeKey: RouteKey) {
  if (
    payload &&
    typeof payload === 'object' &&
    'actionStrip' in payload &&
    Array.isArray(payload.actionStrip) &&
    payload.actionStrip.every((item) => typeof item === 'string')
  ) {
    return payload.actionStrip;
  }

  return ACTION_STRIPS[routeKey] ?? ACTION_STRIPS['/home'];
}

function getHomeSearchPlaceholder(payload: unknown) {
  if (
    payload &&
    typeof payload === 'object' &&
    'header' in payload &&
    payload.header &&
    typeof payload.header === 'object' &&
    'searchPlaceholder' in payload.header &&
    typeof payload.header.searchPlaceholder === 'string'
  ) {
    return payload.header.searchPlaceholder;
  }

  return 'Search purchases, Things, people, memories';
}

function parsePreviewUrls(rawValue: string | undefined) {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

async function requestLiveReceiptProcessing(files: File[], sourceLabel: string): Promise<LiveReceiptOcrPayload | null> {
  const primaryFile = files[0];

  if (!primaryFile) {
    return null;
  }

  const base64Data = await fileToBase64(primaryFile);
  const response = await fetch('/api/receipt-processing', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: primaryFile.name,
      mimeType: primaryFile.type || inferMimeTypeFromName(primaryFile.name),
      base64Data,
      captureChannel: mapSourceLabelToCaptureChannel(sourceLabel),
      fallbackAllowed: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Receipt processing request failed with ${response.status}`);
  }

  const payload = await response.json() as ReceiptProcessingCreateResponse;
  return {
    ...payload.ocrPayload,
    backendProcessingRecordId: payload.record.id,
    backendExtractionRunId: payload.record.extractionRun.id,
    backendSourceDocumentId: payload.record.sourceDocument.id,
  };
}

async function requestLiveReceiptGraphRecord(receiptId: string) {
  const response = await fetch(`/api/live-receipt-graph/${encodeURIComponent(receiptId)}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Live receipt graph request failed with ${response.status}`);
  }

  const payload = await response.json() as LiveReceiptGraphGetResponse;
  return payload.record;
}

async function requestLiveReceiptGraphList() {
  const response = await fetch('/api/live-receipt-graph');

  if (!response.ok) {
    throw new Error(`Live receipt graph list request failed with ${response.status}`);
  }

  const payload = await response.json() as LiveReceiptGraphListResponse;
  return payload.records;
}

async function requestTrustedPurchaseGraphList() {
  const response = await fetch('/api/trusted-purchase-graph');

  if (!response.ok) {
    throw new Error(`Trusted purchase graph list request failed with ${response.status}`);
  }

  const payload = await response.json() as TrustedPurchaseGraphListResponse;
  return payload.records;
}

async function syncLiveReceiptGraphRecord(payload: ReceiptStudioLivePayload) {
  if (typeof fetch !== 'function') {
    return;
  }

  const body: LiveReceiptGraphUpsertRequest = {
    record: {
      id: payload.receipt.id,
      syncedAt: new Date().toISOString(),
      receipt: {
        id: payload.receipt.id,
        status: payload.receipt.status,
        sourceType: payload.receipt.sourceType,
        capturedAt: payload.receipt.capturedAt,
      },
      header: {
        merchantName: payload.header.merchantName,
        purchasedAt: payload.header.purchasedAt,
        grandTotal: payload.header.grandTotal,
        currency: payload.header.currency,
      },
      sourceDocument: {
        id: payload.sourceDocument.id,
        fileName: payload.sourceDocument.fileName,
        mimeType: payload.sourceDocument.mimeType,
        captureChannel: payload.sourceDocument.captureChannel,
        sourceFileCount: payload.sourceDocument.sourceFiles.length,
        checksum: payload.sourceDocument.checksum,
        detectedReceiptCount: payload.sourceDocument.detectedReceiptCount,
      },
      extractionRun: {
        id: payload.extractionRun.id,
        status: payload.extractionRun.status,
        stage: payload.extractionRun.stage,
        stageLabel: payload.extractionRun.stageLabel,
        providerLabel: payload.extractionRun.providerLabel,
        parserVersion: payload.extractionRun.parserVersion,
      },
      parsedData: {
        parserMode: payload.parsedData.requestProvenance.parserMode,
        parserVersion: payload.parsedData.requestProvenance.parserVersion,
        providerLabel: payload.parsedData.providerTrace.providerLabel,
        sourceFileCount: payload.parsedData.requestProvenance.sourceFileCount,
        sourceDocumentChecksum: payload.parsedData.requestProvenance.sourceDocumentChecksum,
        backendProcessingRecordId: payload.parsedData.requestProvenance.backendProcessingRecordId ?? null,
        backendExtractionRunId: payload.parsedData.requestProvenance.backendExtractionRunId ?? null,
        backendSourceDocumentId: payload.parsedData.requestProvenance.backendSourceDocumentId ?? null,
        fieldCandidateCount: payload.parsedData.fieldCandidates.length,
        lineItemCandidateCount: payload.parsedData.lineItemCandidates.length,
      },
      lineItems: payload.lineItems.map((item) => ({
        id: item.id,
        description: item.descriptionNormalized,
        lineTotal: item.lineTotal,
        reviewState: item.reviewState,
        thingCandidate: item.assetCandidateFlag,
      })),
      alertCount: payload.alerts.length,
      duplicateCandidateCount: payload.duplicateCandidates.length,
      reviewDecisionCount: payload.reviewDecisions.length,
    },
  };

  try {
    await fetch('/api/live-receipt-graph', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    // Keep the UX moving even if the dev backend mirror is unavailable.
  }
}

async function syncTrustedPurchaseGraphRecord(receiptId: string) {
  if (typeof fetch !== 'function') {
    return;
  }

  const record = buildTrustedPurchaseGraphRecord(receiptId);

  if (!record) {
    return;
  }

  const body: TrustedPurchaseGraphUpsertRequest = { record };

  try {
    await fetch('/api/trusted-purchase-graph', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    // Keep the UX moving even if the dev backend trusted purchase mirror is unavailable.
  }
}

async function syncReceiptMirrors(payload: ReceiptStudioLivePayload) {
  await syncLiveReceiptGraphRecord(payload);

  if (payload.receipt.status === 'trusted') {
    await syncTrustedPurchaseGraphRecord(payload.receipt.id);
  }
}

async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index] ?? 0);
  }

  return btoa(binary);
}

function inferMimeTypeFromName(fileName: string) {
  const lower = fileName.toLowerCase();

  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function mapSourceLabelToCaptureChannel(sourceLabel: string) {
  const normalized = sourceLabel.toLowerCase();

  if (normalized.includes('pdf')) return 'upload_pdf' as const;
  if (normalized.includes('video')) return 'video_capture' as const;
  if (normalized.includes('email')) return 'email_forward' as const;
  if (normalized.includes('quick')) return 'quick_snap' as const;
  if (normalized.includes('multi')) return 'multi_receipt_photo' as const;
  return 'upload_photo' as const;
}

function iconForFabItem(icon: string) {
  switch (icon) {
    case 'receipt':
      return <Icon name="receipt" className="icon-sm" />;
    case 'camera':
      return <Icon name="camera" className="icon-sm" />;
    case 'upload':
      return <Icon name="upload" className="icon-sm" />;
    case 'sparkle':
      return <Icon name="spark" className="icon-sm" />;
    case 'chat':
      return <Icon name="chat" className="icon-sm" />;
    case 'mic':
      return <Icon name="mic" className="icon-sm" />;
    case 'things':
      return <Icon name="things" className="icon-sm" />;
    case 'people':
      return <Icon name="people" className="icon-sm" />;
    default:
      return <Icon name="spark" className="icon-sm" />;
  }
}

function getComposerConfig(kind: ComposerKind) {
  switch (kind) {
    case 'receipt':
      return {
        title: 'Add Receipt',
        intro: 'Keep capture simple. One upload can contain one receipt or many, and the system should split, enrich, and process quietly unless something needs attention.',
        submitLabel: 'Process receipt capture',
        previewTitleField: 'merchant',
        previewFallback: 'New receipt',
        fields: [
          { id: 'receiptFiles', label: 'Choose receipt image or video', type: 'file' as const },
          { id: 'fixtureScenario', label: 'Uploaded fixture', options: receiptFixtureScenarioOptions },
          { id: 'merchant', label: 'Merchant' },
          { id: 'date', label: 'Date' },
          { id: 'source', label: 'Capture source', options: ['Upload photo', 'Multi-receipt photo', 'Take quick snap', 'Upload PDF', 'Email receipts', 'Capture video'] },
          { id: 'summary', label: 'Extracted summary', type: 'textarea' as const },
        ],
        previewBody: (draft: Record<string, string>) => {
          const fixtureScenario = findReceiptFixtureScenarioByLabel(draft.fixtureScenario);

          if (fixtureScenario) {
            return `${fixtureScenario.notes} Using ${fixtureScenario.input.fixtureFiles.length} uploaded file${fixtureScenario.input.fixtureFiles.length === 1 ? '' : 's'} from the repo-backed receipt library.`;
          }

          if (draft.selectedFileNames) {
            return `Selected file${draft.selectedFileNames.includes(',') ? 's' : ''}: ${draft.selectedFileNames}. The mocked receipt parser will preserve these files as the raw source document and use the same review flow.`;
          }

          return draft.summary || 'The system will split grouped receipts, check for duplicates, extract line items, and only interrupt the user if review is needed.';
        },
      };
    case 'thing':
      return {
        title: 'Add Thing',
        intro: 'Create a believable item record connected back to a receipt or person.',
        submitLabel: 'Create mocked thing',
        previewTitleField: 'name',
        previewFallback: 'New Thing',
        fields: [
          { id: 'name', label: 'Thing name' },
          { id: 'category', label: 'Category', options: ['Home', 'Kitchen', 'Kids', 'Tech'] },
          { id: 'receipt', label: 'Linked receipt', options: ['Sports Basement', 'IKEA', 'Williams Sonoma'] },
          { id: 'person', label: 'Linked person', options: ['Coco', 'Shanshan', 'You'] },
        ],
        previewBody: (draft: Record<string, string>) =>
          `${draft.category || 'Item'} linked to ${draft.receipt || 'a receipt'} and ${draft.person || 'a person'}.`,
      };
    case 'person':
      return {
        title: 'Add Person',
        intro: 'Create a relationship node that can collect purchases, Things, and memories.',
        submitLabel: 'Create mocked person',
        previewTitleField: 'name',
        previewFallback: 'New person',
        fields: [
          { id: 'name', label: 'Name' },
          { id: 'role', label: 'Relationship', options: ['Family', 'Friend', 'Gift recipient', 'Household'] },
          { id: 'link', label: 'Primary linked area', options: ['Purchases', 'Things', 'Memories'] },
          { id: 'notes', label: 'Notes', type: 'textarea' as const },
        ],
        previewBody: (draft: Record<string, string>) => draft.notes || `${draft.role || 'Relationship'} profile ready for linked purchases and memories.`,
      };
    case 'memory':
      return {
        title: 'Add Memory',
        intro: 'Create a lightweight experiential record tied back to people, things, and receipts.',
        submitLabel: 'Create mocked memory',
        previewTitleField: 'title',
        previewFallback: 'New memory',
        fields: [
          { id: 'title', label: 'Title' },
          { id: 'date', label: 'Date' },
          { id: 'people', label: 'Linked people', options: ['Coco', 'Joe', 'Shanshan'] },
          { id: 'items', label: 'Linked items', options: ['Adidas Predator Cleats', 'KitchenAid Artisan Mixer', 'Entryway Storage Bench'] },
          { id: 'notes', label: 'Notes', type: 'textarea' as const },
        ],
        previewBody: (draft: Record<string, string>) => draft.notes || 'A new memory connected to the receipts and things that support it.',
      };
    case 'note':
    default:
      return {
        title: 'Quick Capture / Note',
        intro: 'Capture a thought that can later be attached to a receipt, person, thing, or memory.',
        submitLabel: 'Save mocked note',
        previewTitleField: 'title',
        previewFallback: 'Quick capture',
        fields: [
          { id: 'title', label: 'Title' },
          { id: 'context', label: 'Attach to', options: ['Home', 'Thing', 'Person', 'Memory'] },
          { id: 'note', label: 'Note', type: 'textarea' as const },
        ],
        previewBody: (draft: Record<string, string>) => draft.note || 'Short capture that can become a stronger record later.',
      };
  }
}

function getInitialDraft(kind: ComposerKind): Record<string, string> {
  switch (kind) {
    case 'receipt':
      return {
        fixtureScenario: noReceiptFixtureScenarioLabel,
        selectedFileNames: '',
        merchant: 'Whole Foods',
        date: '2026-03-08',
        source: 'Multi-receipt photo',
        summary: 'Trader Joe\'s: organic whole milk, greek yogurt, produce bag\nTarget: air fryer, parchment liners\nCVS: pain reliever, toothpaste',
      };
    case 'thing':
      return {
        name: 'Soccer duffel bag',
        category: 'Kids',
        receipt: 'Sports Basement',
        person: 'Coco',
      };
    case 'person':
      return {
        name: 'Coach Mia',
        role: 'Friend',
        link: 'Memories',
        notes: 'Shows up around soccer weekends and shared team events.',
      };
    case 'memory':
      return {
        title: 'Sunday kitchen reset',
        date: '2026-03-09',
        people: 'Shanshan',
        items: 'KitchenAid Artisan Mixer',
        notes: 'A home ritual tied to one clear kitchen purchase.',
      };
    case 'note':
    default:
      return {
        title: 'Need to check the IKEA bench measurements',
        context: 'Thing',
        note: 'Potential follow-up before the return window closes.',
      };
  }
}
