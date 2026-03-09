import type { ReactNode } from 'react';

import { LogoLockup, LogoMark } from './brand';
import { ChartSurface, type AppChartOption } from './charts';
import { Icon } from './icons';

type ButtonAction = {
  label: string;
  action?: string;
};

type HomePayload = {
  header: { title: string; searchPlaceholder: string };
  hero: {
    headline: string;
    primaryCta: ButtonAction;
    secondaryCta: ButtonAction;
  };
  summary: {
    periodLabel: string;
    purchaseCount: number;
    totalSpend: number;
    currency: string;
  } | null;
  reviewQueue: ReceiptCard[];
  recentReceipts: ReceiptCard[];
  thingsSummary: {
    ownedThingsCount: number;
    recentThingLabel?: string;
    warrantyExpiringCount?: number;
    insuranceReadyCount?: number;
  } | null;
  memorySuggestions: MemorySummary[];
  insightCards: InsightCard[];
  upgradeCard: UpgradeCardData | null;
};

type ThingsPayload = {
  header: {
    title: string;
    viewOptions: string[];
    selectedView: string;
  };
  actionStrip: string[];
  summary:
    | {
        headline: string;
        body: string;
      }
    | {
        dateRangeLabel?: string;
        thingCount?: number;
        ownedThingCount?: number;
        consumableCount?: number;
        warrantyExpiringCount?: number;
      };
  visualization: {
    type: string;
    series: Array<{ id: string; label: string; value: number }>;
  } | null;
  groups: Array<{
    id: string;
    label: string;
    thingCount: number;
    totalSpend: number;
    topItems: string[];
  }>;
  ownedThings: Array<{
    id: string;
    displayName: string;
    category?: string;
    status?: string;
    purchasePrice: number;
    purchaseDate: string;
    hasWarranty?: boolean;
    hasManual?: boolean;
    warrantyEndsAt?: string;
    docCount?: number;
    locked?: boolean;
  }>;
  upgradeCard: UpgradeCardData | null;
};

type PeoplePayload = {
  header: {
    title: string;
    viewOptions: string[];
    selectedView: string;
  };
  actionStrip: string[];
  summary:
    | { headline: string; body: string }
    | { personCount: number; linkedMemoryCount: number; giftCount: number }
    | { headline: string; subheadline: string };
  network: {
    rings: Array<{
      label: string;
      count: number;
      nodes: Array<{ id: string; label: string; relationshipType: string }>;
    }>;
  } | null;
  people: Array<{
    id: string;
    displayName: string;
    relationshipType: string;
    linkedPurchaseCount: number;
    linkedMemoryCount: number;
    giftCount: number;
  }>;
  selectedPerson: {
    id: string;
    displayName: string;
    relationshipType: string;
    notes?: string;
    linkedPurchases: Array<{
      purchaseEventId: string;
      merchantName: string;
      purchasedAt: string;
      grandTotal: number;
    }>;
    linkedMemories: Array<{
      memoryId: string;
      title: string;
      memoryState: string;
      startsAt: string;
    }>;
    giftHistory: Array<{
      purchaseEventId: string;
      merchantName: string;
      purchasedAt: string;
      grandTotal: number;
    }>;
  } | null;
  upgradeCard: UpgradeCardData | null;
};

type MemoriesPayload = {
  header: {
    title: string;
    viewOptions: string[];
    selectedView: string;
  };
  actionStrip: string[];
  summary:
    | { headline: string; body: string }
    | { candidateCount: number; confirmedCount: number }
    | null;
  timeline: Array<MemoryTimelineEntry>;
  selectedMemory: {
    id: string;
    memoryState: string;
    title: string;
    memoryType: string;
    startsAt: string;
    endsAt: string | null;
    placeLabel: string;
    people: Array<{ id: string; displayName: string; relationshipType: string }>;
    linkedPurchases: Array<{ purchaseEventId: string; merchantName: string; grandTotal: number }>;
    linkedThings: Array<{ id: string; displayName: string }>;
    notes: string | null;
  } | null;
};

type SettingsPayload = {
  sections: Array<{
    key: string;
    title: string;
    items: Array<{
      type: 'select' | 'toggle' | 'link';
      key: string;
      label: string;
      value?: string | boolean;
      options?: string[];
      route?: string;
    }>;
  }>;
};

type AccountPayload = {
  profile: {
    displayName: string;
    email: string;
    planTier: string;
    householdName: string;
  };
  subscription: {
    planTier: string;
    billingStatus: string;
    renewalAt: string;
  };
  sessions: Array<{
    id: string;
    deviceLabel: string;
    lastActiveAt: string;
    current: boolean;
  }>;
  householdMemberships: Array<{
    householdId: string;
    householdName: string;
    role: string;
  }>;
  actions: Array<{ label: string; route: string }>;
};

type PlansPayload = {
  currentPlan: string;
  plans: Array<{
    key: string;
    label: string;
    priceLabel: string;
    features: string[];
    ctaLabel: string;
  }>;
  familyTrustCard: {
    label: string;
    description: string;
    ctaLabel: string;
  };
};

type AgentChatPayload = {
  mode: string;
  title: string;
  conversation: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    citations?: Array<{ type: string; id?: string; label: string }>;
    suggestedFollowUps?: string[];
    upgradeCard?: UpgradeCardData;
  }>;
  suggestedPrompts?: string[];
};

type AgentVoicePayload = {
  mode: string;
  title: string;
  state: string;
  prompt?: string;
  transcript?: string;
  response?: {
    content: string;
    citations: Array<{ type: string; id?: string; label: string }>;
    suggestedFollowUps: string[];
  };
};

type ReceiptCard = {
  id: string;
  merchantName: string;
  purchasedAt: string;
  status: string;
  lineItemCount: number;
  grandTotal: number;
  currency: string;
};

type MemorySummary = {
  id: string;
  memoryState: string;
  suggestedTitle: string;
  startsAt: string;
  placeLabel: string;
  relatedPurchaseEventIds: string[];
};

type MemoryTimelineEntry = {
  id: string;
  memoryState: string;
  autoCreatedFlag?: boolean;
  candidateConfidence?: number;
  suggestedTitle: string;
  title: string | null;
  startsAt: string;
  endsAt: string | null;
  placeLabel: string;
  relatedPurchaseEventIds: string[];
  peoplePreview: string[];
  notes: string | null;
};

type InsightCard = {
  id: string;
  type: string;
  title: string;
  body: string;
  metrics?: Record<string, number | string>;
};

type UpgradeCardData = {
  id?: string;
  tier: string;
  title: string;
  body: string;
  ctaLabel: string;
};

type PageProps<T> = {
  state: string;
  payload: T | null;
  onAction: (action: string) => void;
};

type SummaryMetric = {
  label: string;
  value: string;
  note?: string;
  trend?: number[];
  tone?: 'blue' | 'green' | 'amber';
};

const money = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  style: 'currency',
  maximumFractionDigits: 2,
});

const fullDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const fullDateTime = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function HomeView({ state, payload, onAction }: PageProps<HomePayload>) {
  if (state === 'loading') return <LoadingState label="Loading Home" blocks={5} />;
  if (state === 'error') {
    return (
      <RouteError
        title="Home couldn’t load"
        body="The shell stays stable while mocked content fails. Retry or switch route state in the review panel."
        actionLabel="Retry Home"
        onAction={() => onAction('retry:/home')}
      />
    );
  }
  if (!payload) return <RouteError title="Missing Home mock" body="No payload was found for the selected state." />;

  const summaryMetrics = payload.summary
    ? [
        {
          label: payload.summary.periodLabel,
          value: `${payload.summary.purchaseCount} purchases`,
          note: 'Recent capture volume',
          trend: buildSparklineSeed(payload.summary.purchaseCount, 7),
          tone: 'blue',
        },
        {
          label: 'Spend',
          value: money.format(payload.summary.totalSpend),
          note: 'Across reviewed receipts',
          trend: buildSparklineSeed(Math.round(payload.summary.totalSpend / 22), 7),
          tone: 'amber',
        },
        {
          label: 'Things',
          value: `${payload.thingsSummary?.ownedThingsCount ?? 0} tracked`,
          note: payload.thingsSummary?.recentThingLabel ?? 'Ownership grows from reviewed purchases',
          trend: buildSparklineSeed(payload.thingsSummary?.ownedThingsCount ?? 1, 7),
          tone: 'green',
        },
      ] satisfies SummaryMetric[]
    : null;

  return (
    <div className="route-stack">
      <section className="hero-card hero-card--home">
        <LogoLockup className="hero-card__brand" decorative />
        <p className="eyebrow">Household clarity, one receipt at a time</p>
        <h1>{payload.hero.headline}</h1>
        <p className="hero-copy">
          Search, capture, and organize what matters without drifting into generic finance-app clutter.
        </p>
        <div className="hero-actions">
          <ActionButton label={payload.hero.primaryCta.label} onClick={() => onAction(payload.hero.primaryCta.action ?? '')} tone="primary" />
          <ActionButton label={payload.hero.secondaryCta.label} onClick={() => onAction(payload.hero.secondaryCta.action ?? '')} />
        </div>
      </section>

      {summaryMetrics ? (
        <SummaryBand items={summaryMetrics} />
      ) : (
        <EmptyPanel
          title="Start with one receipt"
          body="Add a purchase or scan a receipt to begin turning spend into Things, people context, and memory candidates."
          actionLabel="Open FAB menu"
          onAction={() => onAction('open:fabsheet')}
        />
      )}

      {payload.reviewQueue.length > 0 && (
        <SectionCard title="Review queue" action="Review" onAction={() => onAction('open:fabsheet')}>
          <div className="card-list">
            {payload.reviewQueue.map((receipt) => (
              <ReceiptRow key={receipt.id} receipt={receipt} />
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Recent receipts">
        {payload.recentReceipts.length > 0 ? (
          <div className="card-list">
            {payload.recentReceipts.map((receipt) => (
              <ReceiptRow key={receipt.id} receipt={receipt} />
            ))}
          </div>
        ) : (
          <BlankCard title="No recent receipts" body="When receipts arrive, they’ll show up here with line-item review status." />
        )}
      </SectionCard>

      <SectionCard title="Things snapshot">
        {payload.thingsSummary ? (
          <div className="mini-stack">
            <MetricLine label="Tracked Things" value={String(payload.thingsSummary.ownedThingsCount)} />
            {payload.thingsSummary.recentThingLabel ? (
              <MetricLine label="Most recent" value={payload.thingsSummary.recentThingLabel} />
            ) : null}
            {payload.thingsSummary.warrantyExpiringCount ? (
              <MetricLine label="Expiring soon" value={String(payload.thingsSummary.warrantyExpiringCount)} />
            ) : null}
            {payload.thingsSummary.insuranceReadyCount ? (
              <MetricLine label="Insurance ready" value={String(payload.thingsSummary.insuranceReadyCount)} />
            ) : null}
          </div>
        ) : (
          <BlankCard title="No Things yet" body="Durable items become easier to manage as purchases are reviewed." />
        )}
      </SectionCard>

      <SectionCard title="Memory suggestions">
        {payload.memorySuggestions.length > 0 ? (
          <div className="card-list">
            {payload.memorySuggestions.map((memory) => (
              <MemoryCandidateRow key={memory.id} memory={memory} />
            ))}
          </div>
        ) : (
          <BlankCard title="No memory candidates yet" body="Dining, events, and clustered purchases become suggestions here." />
        )}
      </SectionCard>

      <SectionCard title="Insights">
        {payload.insightCards.length > 0 ? (
          <div className="card-list">
            {payload.insightCards.map((card) => (
              <article className="insight-card" key={card.id}>
                <div>
                  <p className="eyebrow">{card.type.replace(/_/g, ' ')}</p>
                  <h3>{card.title}</h3>
                </div>
                <p>{card.body}</p>
                {card.metrics ? <CompactMetricBars metrics={card.metrics} /> : null}
              </article>
            ))}
          </div>
        ) : (
          <BlankCard title="Insights arrive with more history" body="As mocked purchases build up, this section highlights drift, habits, and value." />
        )}
      </SectionCard>

      {payload.upgradeCard ? <UpgradeCard data={payload.upgradeCard} onAction={onAction} /> : null}
    </div>
  );
}

export function ThingsView({ state, payload, onAction }: PageProps<ThingsPayload>) {
  if (state === 'loading') return <LoadingState label="Loading Things" blocks={4} />;
  if (state === 'error') {
    return (
      <RouteError
        title="Things couldn’t load"
        body="Returns, warranty, and insurance entry points stay visible while the mocked data fails."
        actionLabel="Retry Things"
        onAction={() => onAction('retry:/things')}
      />
    );
  }
  if (!payload) return <RouteError title="Missing Things mock" body="No payload was found for the selected state." />;

  const thingIntroSummary = isThingsIntroSummary(payload.summary) ? payload.summary : null;
  const thingSummaryMetrics = thingIntroSummary
    ? null
    : (payload.summary as Exclude<ThingsPayload['summary'], { headline: string; body: string }>);

  const metrics: SummaryMetric[] = thingSummaryMetrics
    ? [
        thingSummaryMetrics.dateRangeLabel
          ? {
              label: 'Window',
              value: thingSummaryMetrics.dateRangeLabel,
              note: 'Current grouped view',
              trend: buildSparklineSeed(14, 7),
              tone: 'blue',
            }
          : null,
        thingSummaryMetrics.thingCount
          ? {
              label: 'Things',
              value: String(thingSummaryMetrics.thingCount),
              note: 'Grouped from reviewed purchases',
              trend: buildSparklineSeed(thingSummaryMetrics.thingCount, 7),
              tone: 'blue',
            }
          : null,
        thingSummaryMetrics.ownedThingCount
          ? {
              label: 'Owned',
              value: String(thingSummaryMetrics.ownedThingCount),
              note: 'Durable purchases',
              trend: buildSparklineSeed(thingSummaryMetrics.ownedThingCount, 7),
              tone: 'green',
            }
          : null,
        thingSummaryMetrics.consumableCount
          ? {
              label: 'Consumables',
              value: String(thingSummaryMetrics.consumableCount),
              note: 'Repeat-buy categories',
              trend: buildSparklineSeed(thingSummaryMetrics.consumableCount, 7),
              tone: 'amber',
            }
          : null,
        thingSummaryMetrics.warrantyExpiringCount
          ? {
              label: 'Expiring',
              value: String(thingSummaryMetrics.warrantyExpiringCount),
              note: 'Warranty follow-up',
              trend: buildSparklineSeed(thingSummaryMetrics.warrantyExpiringCount + 2, 7),
              tone: 'amber',
            }
          : null,
      ].filter(Boolean) as SummaryMetric[]
    : [];

  return (
    <div className="route-stack">
      <ScreenToolbar
        eyebrow="Consumer-friendly ownership"
        title="Things"
        selectedView={payload.header.selectedView}
        support="Organize what you own without exposing internal asset jargon."
      />

      {thingIntroSummary ? (
        <SectionCard title="Overview">
          <div className="empty-copy">
            <h2>{thingIntroSummary.headline}</h2>
            <p>{thingIntroSummary.body}</p>
          </div>
        </SectionCard>
      ) : (
        <SummaryBand items={metrics} />
      )}

      {payload.visualization ? (
        <SectionCard title="Spending map">
          <ChartSurface className="chart-surface" height={250} label="Things treemap" option={buildThingsTreemapOption(payload.visualization.series)} />
          <div className="visual-summary-row">
            {payload.visualization.series.map((item) => (
              <div className="compact-count" key={item.id}>
                <span>{item.label}</span>
                <strong>{money.format(item.value)}</strong>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Groups">
        {payload.groups.length > 0 ? (
          <div className="card-list">
            {payload.groups.map((group) => (
              <article className="list-card" key={group.id}>
                <div className="list-card__header">
                  <div>
                    <h3>{group.label}</h3>
                    <p>{group.thingCount} items</p>
                  </div>
                  <strong>{money.format(group.totalSpend)}</strong>
                </div>
                <div className="chip-row">
                  {group.topItems.map((item) => (
                    <span className="chip" key={item}>
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <BlankCard title="Grouped views grow with history" body="Once purchases accumulate, grouped views help the user see what they own and rebuy." />
        )}
      </SectionCard>

      <SectionCard title="Owned Things">
        {payload.ownedThings.length > 0 ? (
          <div className="card-list">
            {payload.ownedThings.map((thing) => (
              <article className="list-card" key={thing.id}>
                <div className="list-card__header">
                  <div>
                    <h3>{thing.displayName}</h3>
                    <p>{thing.category ?? thing.status ?? 'Tracked Thing'}</p>
                  </div>
                  <strong>{money.format(thing.purchasePrice)}</strong>
                </div>
                <div className="chip-row">
                  {thing.hasWarranty ? <span className="chip chip--accent">Warranty</span> : null}
                  {thing.hasManual ? <span className="chip">Manual</span> : null}
                  {thing.docCount ? <span className="chip">{thing.docCount} docs</span> : null}
                  {thing.locked ? <span className="chip chip--locked">Locked</span> : null}
                </div>
                <p>{formatDateOnly(thing.purchaseDate)}</p>
              </article>
            ))}
          </div>
        ) : (
          <BlankCard title="No owned Things yet" body="Important items and durable purchases will appear here once they are confirmed." />
        )}
      </SectionCard>

      {payload.upgradeCard ? <UpgradeCard data={payload.upgradeCard} onAction={onAction} /> : null}
    </div>
  );
}

export function PeopleView({ state, payload, onAction }: PageProps<PeoplePayload>) {
  if (state === 'loading') return <LoadingState label="Loading People" blocks={4} />;
  if (state === 'error') {
    return (
      <RouteError
        title="People couldn’t load"
        body="The relationship layer is mocked separately, so household and gifts context can be reviewed even when data fails."
        actionLabel="Retry People"
        onAction={() => onAction('retry:/people')}
      />
    );
  }
  if (!payload) return <RouteError title="Missing People mock" body="No payload was found for the selected state." />;

  const peopleIntroSummary = isPeopleIntroSummary(payload.summary) ? payload.summary : null;
  const peopleMetricsSummary = isPeopleMetricsSummary(payload.summary) ? payload.summary : null;
  const peopleFocusSummary = isPeopleFocusSummary(payload.summary) ? payload.summary : null;

  return (
    <div className="route-stack">
      <ScreenToolbar
        eyebrow="Grounded relationship context"
        title="People"
        selectedView={payload.header.selectedView}
        support="Keep purchases, memories, and gifts anchored to real relationships."
      />

      {peopleIntroSummary ? (
        <EmptyPanel
          title={peopleIntroSummary.headline}
          body={peopleIntroSummary.body}
          actionLabel="Ask Agent"
          onAction={() => onAction('agent:chat')}
        />
      ) : peopleMetricsSummary ? (
        <SummaryBand
          items={[
            {
              label: 'People',
              value: String(peopleMetricsSummary.personCount),
              note: 'Tracked relationships',
              trend: buildSparklineSeed(peopleMetricsSummary.personCount, 7),
              tone: 'blue',
            },
            {
              label: 'Linked memories',
              value: String(peopleMetricsSummary.linkedMemoryCount),
              note: 'Shared moments with purchase context',
              trend: buildSparklineSeed(peopleMetricsSummary.linkedMemoryCount, 7),
              tone: 'green',
            },
            {
              label: 'Gifts',
              value: String(peopleMetricsSummary.giftCount),
              note: 'Gift-related purchases',
              trend: buildSparklineSeed(peopleMetricsSummary.giftCount + 2, 7),
              tone: 'amber',
            },
          ]}
        />
      ) : peopleFocusSummary ? (
        <section className="section-card person-focus">
          <p className="eyebrow">{peopleFocusSummary.subheadline}</p>
          <h2>{peopleFocusSummary.headline}</h2>
        </section>
      ) : null}

      {payload.network?.rings.length ? (
        <SectionCard title="Relationship map">
          <ChartSurface className="chart-surface" height={278} label="People bubble chart" option={buildPeopleBubbleOption(payload.network.rings)} />
          <div className="visual-summary-row">
            {payload.network.rings.map((ring) => (
              <div className="compact-count compact-count--soft" key={ring.label}>
                <span>{ring.label}</span>
                <strong>{ring.count}</strong>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="People list">
        {payload.people.length > 0 ? (
          <div className="card-list">
            {payload.people.map((person) => (
              <article className="list-card" key={person.id}>
                <div className="list-card__header">
                  <div>
                    <h3>{person.displayName}</h3>
                    <p>{person.relationshipType}</p>
                  </div>
                  <span className="chip chip--accent">{person.linkedPurchaseCount} purchases</span>
                </div>
                <div className="chip-row">
                  <span className="chip">{person.linkedMemoryCount} memories</span>
                  <span className="chip">{person.giftCount} gifts</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <BlankCard title="No linked people yet" body="People context begins when purchases or memories are tagged to someone who matters." />
        )}
      </SectionCard>

      <SectionCard title={payload.selectedPerson ? payload.selectedPerson.displayName : 'Selected person'}>
        {payload.selectedPerson ? (
          <div className="mini-stack">
            <p>{payload.selectedPerson.notes}</p>
            <MetricLine label="Purchases" value={String(payload.selectedPerson.linkedPurchases.length)} />
            <MetricLine label="Memories" value={String(payload.selectedPerson.linkedMemories.length)} />
            <div className="card-list">
              {payload.selectedPerson.linkedPurchases.map((purchase) => (
                <article className="list-card list-card--compact" key={purchase.purchaseEventId}>
                  <div className="list-card__header">
                    <h3>{purchase.merchantName}</h3>
                    <strong>{money.format(purchase.grandTotal)}</strong>
                  </div>
                  <p>{fullDateTime.format(new Date(purchase.purchasedAt))}</p>
                </article>
              ))}
              {payload.selectedPerson.linkedMemories.map((memory) => (
                <article className="list-card list-card--compact" key={memory.memoryId}>
                  <div className="list-card__header">
                    <h3>{memory.title}</h3>
                    <span className={`state-pill state-pill--${memory.memoryState}`}>{memory.memoryState}</span>
                  </div>
                  <p>{fullDateTime.format(new Date(memory.startsAt))}</p>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <BlankCard title="Choose a person" body="Person details surface linked purchases, gifts, and memories when a relationship is selected." />
        )}
      </SectionCard>

      {payload.upgradeCard ? <UpgradeCard data={payload.upgradeCard} onAction={onAction} /> : null}
    </div>
  );
}

export function MemoriesView({ state, payload, onAction }: PageProps<MemoriesPayload>) {
  if (state === 'loading') return <LoadingState label="Loading Memories" blocks={4} />;
  if (state === 'error') {
    return (
      <RouteError
        title="Memories couldn’t load"
        body="Memory candidates are system-assisted, so the screen preserves the timeline structure even when the feed fails."
        actionLabel="Retry Memories"
        onAction={() => onAction('retry:/memories')}
      />
    );
  }
  if (!payload) return <RouteError title="Missing Memories mock" body="No payload was found for the selected state." />;

  return (
    <div className="route-stack">
      <ScreenToolbar
        eyebrow="System-assisted memory creation"
        title="Memories"
        selectedView={payload.header.selectedView}
        support="Timeline stays primary while candidates, places, and people remain easy to review."
      />

      {payload.summary ? (
        'headline' in payload.summary ? (
          <EmptyPanel
            title={payload.summary.headline}
            body={payload.summary.body}
            actionLabel="Record Experience"
            onAction={() => onAction('fab:record_experience')}
          />
        ) : (
          <SummaryBand
            items={[
              {
                label: 'Candidates',
                value: String(payload.summary.candidateCount),
                note: 'System-assisted suggestions',
                trend: buildSparklineSeed(payload.summary.candidateCount, 7),
                tone: 'amber',
              },
              {
                label: 'Confirmed',
                value: String(payload.summary.confirmedCount),
                note: 'Kept memories',
                trend: buildSparklineSeed(payload.summary.confirmedCount, 7),
                tone: 'green',
              },
              {
                label: 'Lens',
                value: 'Timeline',
                note: 'Default view',
                trend: buildSparklineSeed(9, 7),
                tone: 'blue',
              },
            ]}
          />
        )
      ) : null}

      <SectionCard title="Timeline">
        {payload.timeline.length > 0 ? (
          <div className="timeline-list">
            {payload.timeline.map((memory) => (
              <article className="timeline-card" key={memory.id}>
                <span className={`timeline-card__dot timeline-card__dot--${memory.memoryState}`} />
                <div className="timeline-card__body">
                  <div className="list-card__header">
                    <div>
                      <h3>{memory.title ?? memory.suggestedTitle}</h3>
                      <p>{memory.placeLabel}</p>
                    </div>
                    <span className={`state-pill state-pill--${memory.memoryState}`}>{memory.memoryState}</span>
                  </div>
                  <p>{fullDateTime.format(new Date(memory.startsAt))}</p>
                  <div className="chip-row">
                    {memory.peoplePreview.map((person) => (
                      <span className="chip" key={person}>
                        {person}
                      </span>
                    ))}
                    {memory.autoCreatedFlag ? <span className="chip chip--accent">Auto-created</span> : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <BlankCard title="No timeline yet" body="Candidates will appear when receipts, places, and timing cluster into something meaningful." />
        )}
      </SectionCard>

      {payload.selectedMemory ? (
        <SectionCard title="Selected memory">
          <div className="mini-stack">
            <div className="list-card__header">
              <div>
                <p className="eyebrow">{payload.selectedMemory.memoryType}</p>
                <h3>{payload.selectedMemory.title}</h3>
              </div>
              <span className={`state-pill state-pill--${payload.selectedMemory.memoryState}`}>
                {payload.selectedMemory.memoryState}
              </span>
            </div>
            <p>{payload.selectedMemory.placeLabel}</p>
            <p>{fullDateTime.format(new Date(payload.selectedMemory.startsAt))}</p>
            {payload.selectedMemory.notes ? <p>{payload.selectedMemory.notes}</p> : null}
            <div className="chip-row">
              {payload.selectedMemory.people.map((person) => (
                <span className="chip" key={person.id}>
                  {person.displayName}
                </span>
              ))}
            </div>
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}

export function SettingsView({ payload, state }: PageProps<SettingsPayload>) {
  if (state === 'loading') return <LoadingState label="Loading Settings" blocks={3} />;
  if (!payload) return <RouteError title="Missing Settings mock" body="No payload was found for this state." />;

  return (
    <div className="route-stack">
      <section className="route-header-card">
        <div>
          <p className="eyebrow">Preferences and privacy</p>
          <h1>Settings</h1>
        </div>
      </section>
      {payload.sections.map((section) => (
        <SectionCard key={section.key} title={section.title}>
          <div className="settings-list">
            {section.items.map((item) => (
              <article className="settings-item" key={item.key}>
                <div>
                  <h3>{item.label}</h3>
                  {item.route ? <p>{item.route}</p> : null}
                </div>
                {item.type === 'toggle' ? (
                  <span className={`toggle-pill ${item.value ? 'toggle-pill--on' : ''}`}>{item.value ? 'On' : 'Off'}</span>
                ) : item.type === 'select' ? (
                  <span className="chip">{String(item.value)}</span>
                ) : (
                  <Icon name="chevron" className="icon-sm" />
                )}
              </article>
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  );
}

export function AccountView({ payload, state }: PageProps<AccountPayload>) {
  if (state === 'loading') return <LoadingState label="Loading Account" blocks={3} />;
  if (!payload) return <RouteError title="Missing Account mock" body="No payload was found for this state." />;

  return (
    <div className="route-stack">
      <section className="route-header-card">
        <div>
          <p className="eyebrow">Identity and household access</p>
          <h1>Account</h1>
        </div>
      </section>
      <div className="two-up">
        <SectionCard title="Profile">
          <div className="mini-stack">
            <MetricLine label="Name" value={payload.profile.displayName} />
            <MetricLine label="Email" value={payload.profile.email} />
            <MetricLine label="Plan" value={prettifyTier(payload.profile.planTier)} />
            <MetricLine label="Household" value={payload.profile.householdName} />
          </div>
        </SectionCard>
        <SectionCard title="Subscription">
          <div className="mini-stack">
            <MetricLine label="Tier" value={prettifyTier(payload.subscription.planTier)} />
            <MetricLine label="Status" value={payload.subscription.billingStatus} />
            <MetricLine label="Renews" value={fullDate.format(new Date(payload.subscription.renewalAt))} />
          </div>
        </SectionCard>
      </div>
      <SectionCard title="Sessions">
        <div className="card-list">
          {payload.sessions.map((session) => (
            <article className="list-card" key={session.id}>
              <div className="list-card__header">
                <h3>{session.deviceLabel}</h3>
                {session.current ? <span className="chip chip--accent">Current</span> : null}
              </div>
              <p>{fullDateTime.format(new Date(session.lastActiveAt))}</p>
            </article>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Households">
        <div className="card-list">
          {payload.householdMemberships.map((membership) => (
            <article className="list-card" key={membership.householdId}>
              <div className="list-card__header">
                <h3>{membership.householdName}</h3>
                <span className="chip">{membership.role}</span>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function PlansView({ payload, state, onAction }: PageProps<PlansPayload>) {
  if (state === 'loading') return <LoadingState label="Loading Plans" blocks={3} />;
  if (!payload) return <RouteError title="Missing Plans mock" body="No payload was found for this state." />;

  return (
    <div className="route-stack">
      <section className="route-header-card">
        <div>
          <p className="eyebrow">Upgrade only when the moment is right</p>
          <h1>Plans</h1>
        </div>
      </section>
      <div className="plan-grid">
        {payload.plans.map((plan) => (
          <article className={`plan-card ${payload.currentPlan === plan.key ? 'plan-card--current' : ''}`} key={plan.key}>
            <div className="list-card__header">
              <div>
                <p className="eyebrow">{plan.label}</p>
                <h2>{plan.priceLabel}</h2>
              </div>
              {payload.currentPlan === plan.key ? <span className="chip chip--accent">Current</span> : null}
            </div>
            <div className="mini-stack">
              {plan.features.map((feature) => (
                <MetricLine key={feature} label="" value={feature} />
              ))}
            </div>
            <ActionButton
              label={plan.ctaLabel}
              onClick={() => onAction('plans:cta')}
              tone={payload.currentPlan === plan.key ? 'secondary' : 'primary'}
            />
          </article>
        ))}
      </div>
      <SectionCard title={payload.familyTrustCard.label}>
        <p>{payload.familyTrustCard.description}</p>
        <ActionButton label={payload.familyTrustCard.ctaLabel} onClick={() => onAction('plans:trust')} />
      </SectionCard>
    </div>
  );
}

export function AgentChatView({ payload, state, onAction }: PageProps<AgentChatPayload>) {
  if (state === 'loading') return <LoadingState label="Loading Agent chat" blocks={4} />;
  if (!payload) return <RouteError title="Missing Agent chat mock" body="No payload was found for this state." />;

  return (
    <div className="route-stack">
      <section className="route-header-card">
        <div>
          <p className="eyebrow">Grounded, cited, mocked</p>
          <h1>{payload.title}</h1>
        </div>
      </section>
      {payload.conversation.length === 0 ? (
        <EmptyPanel
          title="Ask about purchases, Things, people, or memories"
          body="Agent answers stay mocked in Milestone 1, but the UX already shows citations and follow-up patterns."
          actionLabel="Try a prompt"
          onAction={() => onAction('agent:prompt')}
        />
      ) : (
        <div className="conversation">
          {payload.conversation.map((message) => (
            <article className={`message-bubble message-bubble--${message.role}`} key={message.id}>
              <p>{message.content}</p>
              {message.citations?.length ? (
                <div className="chip-row">
                  {message.citations.map((citation) => (
                    <span className="chip" key={`${citation.type}-${citation.label}`}>
                      {citation.label}
                    </span>
                  ))}
                </div>
              ) : null}
              {message.suggestedFollowUps?.length ? (
                <div className="chip-row">
                  {message.suggestedFollowUps.map((followUp) => (
                    <button className="chip chip--button" key={followUp} type="button">
                      {followUp}
                    </button>
                  ))}
                </div>
              ) : null}
              {message.upgradeCard ? <UpgradeCard data={message.upgradeCard} onAction={onAction} /> : null}
            </article>
          ))}
        </div>
      )}
      {payload.suggestedPrompts?.length ? (
        <SectionCard title="Suggested prompts">
          <div className="chip-row">
            {payload.suggestedPrompts.map((prompt) => (
              <button className="chip chip--button" key={prompt} type="button">
                {prompt}
              </button>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}

export function AgentVoiceView({ payload, state }: PageProps<AgentVoicePayload>) {
  if (state === 'loading') return <LoadingState label="Loading Agent voice" blocks={3} />;
  if (!payload) return <RouteError title="Missing Agent voice mock" body="No payload was found for this state." />;

  return (
    <div className="route-stack">
      <section className="route-header-card">
        <div>
          <p className="eyebrow">Voice mode</p>
          <h1>{payload.title}</h1>
        </div>
      </section>
      <section className="voice-stage">
        <div className={`voice-orb voice-orb--${payload.state}`}>
          <Icon name="mic" className="icon-lg" />
        </div>
        <h2>{payload.prompt ?? prettifyState(payload.state)}</h2>
        {payload.transcript ? <p className="voice-transcript">"{payload.transcript}"</p> : null}
      </section>
      {payload.response ? (
        <SectionCard title="Answer">
          <p>{payload.response.content}</p>
          <div className="chip-row">
            {payload.response.citations.map((citation) => (
              <span className="chip" key={`${citation.type}-${citation.label}`}>
                {citation.label}
              </span>
            ))}
          </div>
          <div className="chip-row">
            {payload.response.suggestedFollowUps.map((followUp) => (
              <span className="chip chip--button" key={followUp}>
                {followUp}
              </span>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}

export function RouteError(props: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <section className="empty-panel empty-panel--error">
      <div className="empty-panel__icon">
        <Icon name="shield" className="icon-lg" />
      </div>
      <h2>{props.title}</h2>
      <p>{props.body}</p>
      {props.actionLabel ? (
        <ActionButton label={props.actionLabel} onClick={props.onAction ?? (() => undefined)} tone="primary" />
      ) : null}
    </section>
  );
}

export function LoadingState(props: { label: string; blocks: number }) {
  return (
    <section className="route-stack">
      <div className="route-header-card">
        <div>
          <p className="eyebrow">Mock loading state</p>
          <h1>{props.label}</h1>
        </div>
      </div>
      <div className="skeleton-stack">
        {Array.from({ length: props.blocks }).map((_, index) => (
          <div className="skeleton-card" key={index} />
        ))}
      </div>
    </section>
  );
}

function ScreenToolbar(props: { eyebrow: string; title: string; selectedView: string; support: string }) {
  return (
    <section className="screen-toolbar">
      <div className="screen-toolbar__identity">
        <div className="screen-toolbar__logo">
          <LogoMark className="screen-toolbar__logo-mark" decorative />
        </div>
        <div>
          <p className="eyebrow">{props.eyebrow}</p>
          <h1>{props.title}</h1>
          <p>{props.support}</p>
        </div>
      </div>
      <div className="pill-select">
        <span>{props.selectedView}</span>
        <Icon name="chevron" className="icon-sm" />
      </div>
    </section>
  );
}

function SummaryBand(props: { items: SummaryMetric[] }) {
  return (
    <section className="summary-band">
      {props.items.map((item) => (
        <SummaryStatCard item={item} key={`${item.label}-${item.value}`} />
      ))}
    </section>
  );
}

function SummaryStatCard(props: { item: SummaryMetric }) {
  return (
    <article className={`summary-stat summary-stat--${props.item.tone ?? 'blue'}`}>
      <div className="summary-stat__copy">
        <span>{props.item.label}</span>
        <strong>{props.item.value}</strong>
        {props.item.note ? <small>{props.item.note}</small> : null}
      </div>
      {props.item.trend?.length ? <MiniSparkline tone={props.item.tone ?? 'blue'} values={props.item.trend} /> : null}
    </article>
  );
}

function SectionCard(props: {
  title: string;
  children: ReactNode;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <section className="section-card">
      <div className="section-card__header">
        <h2>{props.title}</h2>
        {props.action ? (
          <button className="text-link" type="button" onClick={props.onAction}>
            {props.action}
          </button>
        ) : null}
      </div>
      {props.children}
    </section>
  );
}

function EmptyPanel(props: { title: string; body: string; actionLabel: string; onAction: () => void }) {
  return (
    <section className="empty-panel">
      <div className="empty-panel__icon">
        <Icon name="spark" className="icon-lg" />
      </div>
      <h2>{props.title}</h2>
      <p>{props.body}</p>
      <ActionButton label={props.actionLabel} onClick={props.onAction} tone="primary" />
    </section>
  );
}

function BlankCard(props: { title: string; body: string }) {
  return (
    <div className="blank-card">
      <h3>{props.title}</h3>
      <p>{props.body}</p>
    </div>
  );
}

function MetricLine(props: { label: string; value: string }) {
  return (
    <div className="metric-line">
      {props.label ? <span>{props.label}</span> : null}
      <strong>{props.value}</strong>
    </div>
  );
}

function ReceiptRow(props: { receipt: ReceiptCard }) {
  const { receipt } = props;

  return (
    <article className="list-card list-card--receipt">
      <div className="list-card__header">
        <div>
          <h3>{receipt.merchantName}</h3>
          <p>{fullDateTime.format(new Date(receipt.purchasedAt))}</p>
        </div>
        <strong>{money.format(receipt.grandTotal)}</strong>
      </div>
      <div className="chip-row">
        <span className={`chip chip--status chip--${receipt.status}`}>{receipt.status.replace('_', ' ')}</span>
        <span className="chip">{receipt.lineItemCount} items</span>
      </div>
    </article>
  );
}

function MemoryCandidateRow(props: { memory: MemorySummary }) {
  const { memory } = props;

  return (
    <article className="list-card">
      <div className="list-card__header">
        <div>
          <h3>{memory.suggestedTitle}</h3>
          <p>{memory.placeLabel}</p>
        </div>
        <span className={`state-pill state-pill--${memory.memoryState}`}>{memory.memoryState}</span>
      </div>
      <p>{fullDateTime.format(new Date(memory.startsAt))}</p>
    </article>
  );
}

function CompactMetricBars(props: { metrics: Record<string, number | string> }) {
  const values = Object.entries(props.metrics).filter(
    ([key, value]) => key !== 'currency' && typeof value === 'number'
  ) as Array<[string, number]>;

  if (!values.length) {
    return null;
  }

  const max = Math.max(...values.map(([, value]) => value), 1);

  return (
    <div className="mini-bars">
      {values.map(([label, value]) => (
        <div className="mini-bars__row" key={label}>
          <span>{label}</span>
          <div className="mini-bars__track">
            <div className="mini-bars__fill" style={{ width: `${(value / max) * 100}%` }} />
          </div>
          <strong>{money.format(value)}</strong>
        </div>
      ))}
    </div>
  );
}

function MiniSparkline(props: { tone: 'blue' | 'green' | 'amber'; values: number[] }) {
  const width = 88;
  const height = 28;
  const max = Math.max(...props.values, 1);
  const min = Math.min(...props.values, 0);
  const range = Math.max(max - min, 1);
  const points = props.values
    .map((value, index) => {
      const x = (index / Math.max(props.values.length - 1, 1)) * (width - 4) + 2;
      const y = height - (((value - min) / range) * (height - 6) + 3);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className={`mini-sparkline mini-sparkline--${props.tone}`} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline fill="none" points={points} />
    </svg>
  );
}

function UpgradeCard(props: { data: UpgradeCardData; onAction: (action: string) => void }) {
  return (
    <section className="upgrade-card">
      <div className="upgrade-card__copy">
        <p className="eyebrow">{prettifyTier(props.data.tier)}</p>
        <h2>{props.data.title}</h2>
        <p>{props.data.body}</p>
      </div>
      <ActionButton label={props.data.ctaLabel} onClick={() => props.onAction('route:/plans')} tone="primary" />
    </section>
  );
}

function ActionButton(props: { label: string; onClick: () => void; tone?: 'primary' | 'secondary' }) {
  return (
    <button
      className={`action-button ${props.tone === 'primary' ? 'action-button--primary' : ''}`}
      type="button"
      onClick={props.onClick}
    >
      {props.label}
    </button>
  );
}

function buildThingsTreemapOption(
  series: Array<{ id: string; label: string; value: number }>
): AppChartOption {
  const colors = ['#5270d5', '#4aac75', '#ff8c52', '#9a71dc', '#36aba4'];

  return {
    animation: false,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(17, 16, 22, 0.94)',
      borderWidth: 0,
      textStyle: {
        color: '#f7f4ef',
      },
      formatter: (params: unknown) => {
        const data = (params as { data?: { name?: string; value?: number } }).data;
        return `${data?.name ?? 'Group'}<br/>${money.format(data?.value ?? 0)}`;
      },
    },
    series: [
      {
        type: 'treemap',
        roam: false,
        nodeClick: false,
        breadcrumb: {
          show: false,
        },
        itemStyle: {
          borderColor: '#f7f8fc',
          borderWidth: 4,
          gapWidth: 4,
          borderRadius: 20,
        },
        upperLabel: {
          show: false,
        },
        label: {
          show: true,
          formatter: '{b}',
          color: '#ffffff',
          fontSize: 13,
          fontWeight: 600,
          overflow: 'truncate',
        },
        data: series.map((item, index) => ({
          id: item.id,
          name: item.label,
          value: item.value,
          itemStyle: {
            color: colors[index % colors.length],
          },
        })),
      },
    ],
  };
}

function buildPeopleBubbleOption(
  rings: Array<{
    label: string;
    count: number;
    nodes: Array<{ id: string; label: string; relationshipType: string }>;
  }>
): AppChartOption {
  const centers = [
    { x: 30, y: 54, color: '#4aac75' },
    { x: 71, y: 36, color: '#5270d5' },
    { x: 54, y: 76, color: '#ff8c52' },
    { x: 82, y: 72, color: '#9a71dc' },
  ];

  const data = rings.flatMap((ring, ringIndex) => {
    const center = centers[ringIndex % centers.length];
    const step = (Math.PI * 2) / Math.max(ring.nodes.length, 1);

    return ring.nodes.map((node, nodeIndex) => {
      const angle = step * nodeIndex - Math.PI / 2;
      const radius = 10 + ringIndex * 8;
      const size = 32 + ring.count * 4 - nodeIndex;

      return {
        name: node.label,
        value: [
          center.x + Math.cos(angle) * radius,
          center.y + Math.sin(angle) * radius,
          size,
          ring.label,
          node.relationshipType,
        ],
        itemStyle: {
          color: center.color,
          shadowBlur: 12,
          shadowColor: `${center.color}55`,
        },
        label: {
          color: '#ffffff',
          fontWeight: 600,
          fontSize: 11,
        },
      };
    });
  });

  return {
    animation: false,
    grid: {
      left: 0,
      right: 0,
      top: 6,
      bottom: 0,
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(17, 16, 22, 0.94)',
      borderWidth: 0,
      textStyle: {
        color: '#f7f4ef',
      },
      formatter: (params: unknown) => {
        const bubble = params as { name?: string; value?: (string | number)[] };
        return `${bubble.name ?? 'Person'}<br/>${String(bubble.value?.[3] ?? 'Circle')} · ${String(bubble.value?.[4] ?? 'Relationship')}`;
      },
    },
    xAxis: {
      min: 0,
      max: 100,
      show: false,
    },
    yAxis: {
      min: 0,
      max: 100,
      show: false,
      inverse: true,
    },
    series: [
      {
        type: 'scatter',
        data,
        symbolSize: (value: number[]) => value[2],
        label: {
          show: true,
          formatter: '{b}',
          position: 'inside',
        },
        emphasis: {
          scale: false,
        },
      },
    ],
  };
}

function buildSparklineSeed(seed: number, length: number) {
  const base = Math.max(seed, 1);
  return Array.from({ length }, (_, index) => {
    const wave = ((base + index * 7) % 9) + 3;
    return Math.max(1, Math.round(base * (0.34 + wave / 16)));
  });
}

function prettifyTier(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function prettifyState(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDateOnly(value: string) {
  return fullDate.format(new Date(`${value}T12:00:00`));
}

function isThingsIntroSummary(
  summary: ThingsPayload['summary']
): summary is Extract<ThingsPayload['summary'], { headline: string; body: string }> {
  return 'headline' in summary;
}

function isPeopleIntroSummary(
  summary: PeoplePayload['summary']
): summary is Extract<PeoplePayload['summary'], { headline: string; body: string }> {
  return 'headline' in summary && 'body' in summary;
}

function isPeopleMetricsSummary(
  summary: PeoplePayload['summary']
): summary is Extract<PeoplePayload['summary'], { personCount: number }> {
  return 'personCount' in summary;
}

function isPeopleFocusSummary(
  summary: PeoplePayload['summary']
): summary is Extract<PeoplePayload['summary'], { headline: string; subheadline: string }> {
  return 'headline' in summary && 'subheadline' in summary;
}
