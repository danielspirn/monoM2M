import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { LogoMark } from '@/src/brand';
import { MockControlPanel } from '@/components/dev/MockControlPanel';
import { getSelectedPersona, getStateOverrides, setSelectedPersona, setStateOverride } from '@/mocks/mockSessionStore';
import {
  getDefaultState,
  getPersonaDefinitions,
  hasMockPayload,
  isMissingStatePayload,
  resolveMockPayload,
  type PersonaId,
  type RouteKey,
} from '@/mocks/mockProvider';

import { Icon } from './icons';
import {
  AccountView,
  AgentChatView,
  AgentVoiceView,
  HomeView,
  LoadingState,
  MemoriesView,
  PeopleView,
  PlansView,
  RouteError,
  SettingsView,
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

type FabItem = {
  id: string;
  label: string;
  icon: string;
  action: string;
  suggestedPrompt?: string;
};

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
  '/home': ['Recent', 'Review', 'Insights'],
  '/things': ['Returns', 'Warranty', 'Insurance'],
  '/people': ['Household', 'Gifts', 'Shared'],
  '/memories': ['Timeline', 'Map', 'People'],
  '/settings': ['General', 'Notifications', 'Privacy'],
  '/account': ['Profile', 'Sessions', 'Household'],
  '/plans': ['Compare', 'Upgrade', 'Family Trust'],
  '/agent/chat': ['Chat', 'Sources', 'Follow-ups'],
  '/agent/voice': ['Listen', 'Answer', 'Sources'],
  '/things/:thingId': ['Returns', 'Warranty', 'Insurance'],
  '/people/:personId': ['Household', 'Gifts', 'Shared'],
  '/memories/:memoryId': ['Timeline', 'Map', 'People'],
  '/fab-menu': ['Add', 'Capture', 'Ask'],
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
};

const BRANDED_TOPBAR_META: Partial<Record<RouteKey, string>> = {
  '/things': 'Returns, warranty, insurance',
  '/people': 'Household, gifts, shared',
  '/memories': 'Timeline, map, people',
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
  const routeKey = getRouteKey(location.pathname);

  const [selectedPersona, setPersona] = useState<PersonaId>('single_adult_female');
  const [stateOverrides, setOverrides] = useState<Record<string, string>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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
    () =>
      resolveMockPayload(routeKey, {
        personaId: selectedPersona,
        state: activeState,
      }),
    [activeState, routeKey, selectedPersona]
  );

  const pageTitle = routeKey === '/home' ? undefined : APP_TITLES[routeKey] ?? 'Money to Memories';
  const actionStrip = getActionStrip(payload, routeKey);
  const fabPayload = resolveMockPayload('/fab-menu', {
    personaId: selectedPersona,
    state: getDefaultState(selectedPersona, '/fab-menu') ?? 'default',
  }) as { title: string; items: FabItem[] };
  const personaMeta = getPersonaDefinitions().find((persona) => persona.id === selectedPersona);
  const searchPlaceholder = routeKey === '/home' ? getHomeSearchPlaceholder(payload) : undefined;

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

    if (action.startsWith('route:')) {
      const target = action.replace('route:', '');
      if (target === '/memories/new') {
        navigate('/memories');
        setNotice('Record Experience is mocked in Milestone 1. Memories stays the landing surface.');
        return;
      }
      if (target === '/ingest/new') {
        setNotice('Receipt capture flows are deferred. The FAB structure is implemented and ready for the next slice.');
        return;
      }
      navigate(target);
      setDrawerOpen(false);
      setFabOpen(false);
      return;
    }

    switch (action) {
      case 'fab:add_purchase':
      case 'fab:scan_receipt':
      case 'capture:receipt':
      case 'upload:document':
        setNotice('Capture flows are mocked only. No document upload or receipt extraction is wired in this milestone.');
        setFabOpen(false);
        return;
      case 'fab:record_experience':
        navigate('/memories');
        setFabOpen(false);
        setNotice('Record Experience stays mocked. Memories is the review surface in Milestone 1.');
        return;
      case 'fab:ask_agent_chat':
      case 'agent:chat':
        navigate('/agent/chat');
        setFabOpen(false);
        return;
      case 'fab:ask_agent_voice':
      case 'agent:voice':
        navigate('/agent/voice');
        setFabOpen(false);
        return;
      case 'plans:personal_pro':
      case 'plans:cta':
      case 'plans:trust':
        navigate('/plans');
        return;
      default:
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
              <Route path="/people" element={<RouteOutlet routeKey="/people" state={activeState} payload={payload} onAction={handleAction} />} />
              <Route path="/memories" element={<RouteOutlet routeKey="/memories" state={activeState} payload={payload} onAction={handleAction} />} />
              <Route path="/settings" element={<RouteOutlet routeKey="/settings" state={activeState} payload={payload} onAction={handleAction} />} />
              <Route path="/account" element={<RouteOutlet routeKey="/account" state={activeState} payload={payload} onAction={handleAction} />} />
              <Route path="/plans" element={<RouteOutlet routeKey="/plans" state={activeState} payload={payload} onAction={handleAction} />} />
              <Route path="/agent/chat" element={<RouteOutlet routeKey="/agent/chat" state={activeState} payload={payload} onAction={handleAction} />} />
              <Route path="/agent/voice" element={<RouteOutlet routeKey="/agent/voice" state={activeState} payload={payload} onAction={handleAction} />} />
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
                <NavButton key={item.route} active={routeKey === item.route} item={item} onClick={() => navigate(item.route)} />
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
                <NavButton key={item.route} active={routeKey === item.route} item={item} onClick={() => navigate(item.route)} />
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
          <aside className="fab-sheet">
            <div className="fab-sheet__header">
              <p className="eyebrow">Global action hub</p>
              <h2>{fabPayload.title}</h2>
            </div>
            <div className="fab-sheet__list">
              {fabPayload.items.map((item) => (
                <button className="fab-sheet__item" key={item.id} type="button" onClick={() => handleAction(item.action)}>
                  <span className="fab-sheet__icon">{iconForFabItem(item.icon)}</span>
                  <span>
                    <strong>{item.label}</strong>
                    {item.suggestedPrompt ? <small>{item.suggestedPrompt}</small> : null}
                  </span>
                </button>
              ))}
            </div>
          </aside>
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
    case '/people':
      return <PeopleView state={props.state ?? 'default'} payload={props.payload as never} onAction={props.onAction} />;
    case '/memories':
      return <MemoriesView state={props.state ?? 'default'} payload={props.payload as never} onAction={props.onAction} />;
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

function getRouteKey(pathname: string): RouteKey {
  switch (pathname) {
    case '/home':
      return '/home';
    case '/things':
      return '/things';
    case '/people':
      return '/people';
    case '/memories':
      return '/memories';
    case '/settings':
      return '/settings';
    case '/account':
      return '/account';
    case '/plans':
      return '/plans';
    case '/agent/chat':
      return '/agent/chat';
    case '/agent/voice':
      return '/agent/voice';
    default:
      return '/home';
  }
}

function mockNoticeForAction(action: string) {
  switch (action) {
    case 'notice:privacy':
      return 'Privacy & Security is represented in Settings for this milestone. Dedicated flows are deferred.';
    case 'notice:help':
      return 'Help is deferred. The drawer slot is present so the shell stays honest to spec.';
    case 'notice:signout':
      return 'Production auth is out of scope. Sign out is a mocked drawer action only.';
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
    default:
      return <Icon name="spark" className="icon-sm" />;
  }
}
