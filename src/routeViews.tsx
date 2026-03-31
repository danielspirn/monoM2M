import type { ReactNode } from 'react';

import { LogoLockup, LogoMark } from './brand';
import { ChartSurface, type AppChartOption } from './charts';
import { Icon } from './icons';
import type { ReceiptStudioLivePayload } from '@/mocks/receiptWorkflowStore';
import type {
  ActivityItem,
  AgentChatPayload,
  AgentStructuredResult,
  AgentVoicePayload,
  HomePayload,
  MemoriesPayload,
  MemoryCardData,
  MemoryDetailPayload,
  PeoplePayload,
  PersonCardData,
  PersonDetailPayload,
  ReceiptCardData,
  SummaryMetric,
  ThingCardData,
  ThingDetailPayload,
  ThingsPayload,
  UpgradeCardData,
} from '@/mocks/sharedUniverse';

type ReceiptStudioPayload = {
  receipt: {
    id: string;
    status: string;
    sourceType: string;
    capturedAt?: string | null;
  };
  header: {
    title: string;
    merchantName?: string | null;
    purchasedAt?: string | null;
    grandTotal?: number | null;
    currency: string;
  };
  progress?: {
    stage: string;
    label: string;
  } | null;
  lineItems: ReceiptStudioLivePayload['lineItems'];
  selectedLineItemId?: string | null;
  evidence?: {
    targetObjectType: string;
    targetObjectId: string;
    evidenceType: string;
    pageNumber?: number | null;
    x?: number | null;
    y?: number | null;
    width?: number | null;
    height?: number | null;
    snippet?: string | null;
  } | null;
  evidenceTrail?: Array<{
    id: string;
    label: string;
    snippet: string;
    targetObjectId: string;
  }>;
  peopleSuggestions?: Array<{
    id: string;
    displayName: string;
    relationshipType: string;
  }>;
  memorySuggestions?: Array<{
    id: string;
    memoryState: string;
    suggestedTitle: string;
  }>;
  actions: {
    canSave: boolean;
    canConvertToThing: boolean;
    canTagPeople: boolean;
    canAddToMemory: boolean;
  };
  captureSession?: ReceiptStudioLivePayload['captureSession'];
  sourceDocument?: ReceiptStudioLivePayload['sourceDocument'];
  extractionRun?: ReceiptStudioLivePayload['extractionRun'];
  parsedData?: ReceiptStudioLivePayload['parsedData'];
  structuredData?: ReceiptStudioLivePayload['structuredData'];
  searchDocument?: ReceiptStudioLivePayload['searchDocument'];
  alerts?: ReceiptStudioLivePayload['alerts'];
  upgradeCard?: UpgradeCardData;
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

type PageProps<T> = {
  state: string;
  payload: T | null;
  onAction: (action: string) => void;
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
  const continueCard = payload.continueCard;

  return (
    <div className="route-stack">
      <section className="hero-card hero-card--home">
        <LogoLockup className="hero-card__brand" decorative />
        <p className="eyebrow">Receipt to life graph</p>
        <h1>{payload.hero.headline}</h1>
        <p className="hero-copy">{payload.hero.body}</p>
        <div className="hero-actions">
          <ActionButton label={payload.hero.primaryCta.label} onClick={() => onAction(payload.hero.primaryCta.action)} tone="primary" />
          <ActionButton label={payload.hero.secondaryCta.label} onClick={() => onAction(payload.hero.secondaryCta.action)} />
        </div>
      </section>

      {payload.summaryMetrics.length ? <SummaryBand items={payload.summaryMetrics} /> : null}

      {continueCard ? (
        <FeaturePanel
          eyebrow="Continue"
          title={continueCard.title}
          body={continueCard.body}
          actionLabel={continueCard.actionLabel}
          onAction={() => onAction(continueCard.action)}
        />
      ) : (
        <EmptyPanel
          title="Start with one receipt"
          body="Add a purchase, thing, person, or memory to begin building a believable life inventory."
          actionLabel="Open Add Actions"
          onAction={() => onAction('open:fabsheet')}
        />
      )}

      {payload.reminders.length ? (
        <SectionCard title="Needs attention">
          <div className="card-list">
            {payload.reminders.map((reminder) => (
              <article className={`feature-panel feature-panel--${reminder.tone}`} key={reminder.id}>
                <div>
                  <p className="eyebrow">Next best action</p>
                  <h3>{reminder.title}</h3>
                </div>
                <p>{reminder.body}</p>
                <ActionButton label={reminder.actionLabel} onClick={() => onAction(reminder.action)} />
              </article>
            ))}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Recent activity">
        {payload.recentActivity.length ? <ActivityFeed items={payload.recentActivity} onAction={onAction} /> : <BlankCard title="No recent activity" body="The dashboard fills in as receipts and linked entities appear." />}
      </SectionCard>

      <SectionCard title="Recent receipts" action="Add Receipt" onAction={() => onAction('compose:add_receipt')}>
        {payload.recentReceipts.length ? (
          <div className="card-list">
            {payload.recentReceipts.map((receipt) => (
              <ReceiptRow key={receipt.id} receipt={receipt} onAction={onAction} />
            ))}
          </div>
        ) : (
          <BlankCard title="No recent receipts" body="Receipt capture is the start of the model." />
        )}
      </SectionCard>

      <SectionCard title="Things that matter">
        {payload.topThings.length ? (
          <div className="card-list">
            {payload.topThings.map((thing) => (
              <ThingRow key={thing.id} thing={thing} onAction={onAction} />
            ))}
          </div>
        ) : (
          <BlankCard title="No Things yet" body="Meaningful items show up here once the receipt graph deepens." />
        )}
      </SectionCard>

      <SectionCard title="People connected to purchases">
        {payload.topPeople.length ? (
          <div className="card-list">
            {payload.topPeople.map((person) => (
              <PersonRow key={person.id} person={person} onAction={onAction} />
            ))}
          </div>
        ) : (
          <BlankCard title="No linked people yet" body="People help the product feel contextual instead of transactional." />
        )}
      </SectionCard>

      <SectionCard title="Recent memories">
        {payload.recentMemories.length ? (
          <div className="card-list">
            {payload.recentMemories.map((memory) => (
              <MemoryRow key={memory.id} memory={memory} onAction={onAction} />
            ))}
          </div>
        ) : (
          <BlankCard title="No memories yet" body="Memory candidates appear when purchases, places, and people connect into a story." />
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
        body="The inventory surface is mocked independently so the product graph can still be reviewed."
        actionLabel="Retry Things"
        onAction={() => onAction('retry:/things')}
      />
    );
  }
  if (!payload) return <RouteError title="Missing Things mock" body="No payload was found for the selected state." />;

  return (
    <div className="route-stack">
      <ScreenToolbar
        eyebrow="Consumer-friendly ownership"
        title="Things"
        selectedView={payload.header.selectedView}
        support="Items stay grounded in the receipts, people, and memories around them."
      />
      <SurfaceControls
        searchLabel={payload.header.searchPlaceholder}
        controls={[payload.header.filterLabel, payload.header.sortLabel]}
      />
      {payload.summaryMetrics.length ? <SummaryBand items={payload.summaryMetrics} /> : <BlankCard title="No Things yet" body="Add a receipt or thing to start the inventory layer." />}

      {payload.visualization ? (
        <SectionCard title="Things by category">
          <ChartSurface className="chart-surface" height={250} label="Things treemap" option={buildThingsTreemapOption(payload.visualization.series)} />
          <div className="visual-summary-row">
            {payload.categories.map((category) => (
              <div className="compact-count" key={category.id}>
                <span>{category.label}</span>
                <strong>{category.thingCount} items</strong>
                <small>{money.format(category.spend)}</small>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="All Things">
        {payload.things.length ? (
          <div className="card-list">
            {payload.things.map((thing) => (
              <ThingRow key={thing.id} thing={thing} onAction={onAction} featured={payload.highlightedThingIds.includes(thing.id)} />
            ))}
          </div>
        ) : (
          <BlankCard title="No Things yet" body="Durable items and meaningful purchases will gather here." />
        )}
      </SectionCard>

      {payload.upgradeCard ? <UpgradeCard data={payload.upgradeCard} onAction={onAction} /> : null}
    </div>
  );
}

export function ThingDetailView({ state, payload, onAction }: PageProps<ThingDetailPayload>) {
  if (state === 'loading') return <LoadingState label="Loading Thing detail" blocks={4} />;
  if (!payload) return <RouteError title="Missing Thing detail mock" body="No payload was found for this state." />;

  const summaryItems: SummaryMetric[] = [
    {
      label: 'Price',
      value: money.format(payload.detail.purchasePrice),
      note: payload.detail.category,
      tone: 'blue',
      trend: [2, 2, 3, 3, 4, 4, 5],
    },
    {
      label: 'People',
      value: String(payload.linkedPeople.length),
      note: 'Linked profiles',
      tone: 'green',
      trend: [1, 1, 1, 2, 2, 2, 3],
    },
    {
      label: 'Memories',
      value: String(payload.linkedMemories.length),
      note: 'Story connections',
      tone: 'amber',
      trend: [1, 1, 1, 1, 2, 2, 2],
    },
  ];

  return (
    <div className="route-stack">
      <DetailHeader
        eyebrow={payload.detail.category}
        title={payload.detail.title}
        summary={payload.detail.headerSummary}
        backLabel="Back to Things"
        onBack={() => onAction('route:/things')}
        chips={payload.detail.badges}
      />

      <SummaryBand items={summaryItems} />

      <SectionCard title="Key details">
        <MetadataList items={payload.metadata} />
      </SectionCard>

      {payload.purchaseSource ? (
        <SectionCard title="Purchase source">
          <ReceiptRow receipt={payload.purchaseSource} onAction={onAction} />
        </SectionCard>
      ) : null}

      <SectionCard title="Linked people">
        {payload.linkedPeople.length ? (
          <div className="card-list">
            {payload.linkedPeople.map((person) => (
              <PersonRow key={person.id} person={person} onAction={onAction} />
            ))}
          </div>
        ) : (
          <BlankCard title="No linked people yet" body="People links will show who this item matters to." />
        )}
      </SectionCard>

      <SectionCard title="Linked memories">
        {payload.linkedMemories.length ? (
          <div className="card-list">
            {payload.linkedMemories.map((memory) => (
              <MemoryRow key={memory.id} memory={memory} onAction={onAction} />
            ))}
          </div>
        ) : (
          <BlankCard title="No linked memories yet" body="This item is ready to attach to household moments when they matter." />
        )}
      </SectionCard>

      {payload.relatedThings.length ? (
        <SectionCard title="Related Things">
          <div className="card-list">
            {payload.relatedThings.map((thing) => (
              <ThingRow key={thing.id} thing={thing} onAction={onAction} />
            ))}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Activity">
        <ActivityFeed items={payload.activity} onAction={onAction} />
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
        body="The relationship layer is mocked separately so the emotional context survives data gaps."
        actionLabel="Retry People"
        onAction={() => onAction('retry:/people')}
      />
    );
  }
  if (!payload) return <RouteError title="Missing People mock" body="No payload was found for the selected state." />;
  const spotlight = payload.spotlight;

  return (
    <div className="route-stack">
      <ScreenToolbar
        eyebrow="Grounded relationship context"
        title="People"
        selectedView={payload.header.selectedView}
        support="People help explain who matters behind a receipt, item, or memory."
      />
      <SurfaceControls searchLabel={payload.header.searchPlaceholder} controls={[payload.header.filterLabel]} />
      {payload.summaryMetrics.length ? <SummaryBand items={payload.summaryMetrics} /> : <BlankCard title="No people yet" body="Add a person to turn spending into context." />}

      {payload.network ? (
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

      {spotlight ? (
        <FeaturePanel
          eyebrow="Spotlight"
          title={spotlight.title}
          body={spotlight.body}
          actionLabel={spotlight.actionLabel}
          onAction={() => onAction(spotlight.action)}
        />
      ) : null}

      <SectionCard title="All people">
        {payload.people.length ? (
          <div className="card-list">
            {payload.people.map((person) => (
              <PersonRow key={person.id} person={person} onAction={onAction} />
            ))}
          </div>
        ) : (
          <BlankCard title="No people yet" body="People profiles will appear here as purchases and memories connect." />
        )}
      </SectionCard>

      {payload.upgradeCard ? <UpgradeCard data={payload.upgradeCard} onAction={onAction} /> : null}
    </div>
  );
}

export function PersonDetailView({ state, payload, onAction }: PageProps<PersonDetailPayload>) {
  if (state === 'loading') return <LoadingState label="Loading Person detail" blocks={4} />;
  if (!payload) return <RouteError title="Missing Person detail mock" body="No payload was found for this state." />;

  return (
    <div className="route-stack">
      <DetailHeader
        eyebrow={payload.detail.relationshipType}
        title={payload.detail.title}
        summary={payload.detail.headerSummary}
        backLabel="Back to People"
        onBack={() => onAction('route:/people')}
        chips={payload.detail.tags}
      />
      <SummaryBand items={payload.summaryMetrics} />

      <SectionCard title="Associated Things">
        {payload.associatedThings.length ? (
          <div className="card-list">
            {payload.associatedThings.map((thing) => (
              <ThingRow key={thing.id} thing={thing} onAction={onAction} />
            ))}
          </div>
        ) : (
          <BlankCard title="No associated Things" body="This person can gain item context as purchases are linked." />
        )}
      </SectionCard>

      <SectionCard title="Associated memories">
        {payload.associatedMemories.length ? (
          <div className="card-list">
            {payload.associatedMemories.map((memory) => (
              <MemoryRow key={memory.id} memory={memory} onAction={onAction} />
            ))}
          </div>
        ) : (
          <BlankCard title="No associated memories" body="Memories will help the person graph feel more human." />
        )}
      </SectionCard>

      <SectionCard title="Related purchases">
        {payload.relatedReceipts.length ? (
          <div className="card-list">
            {payload.relatedReceipts.map((receipt) => (
              <ReceiptRow key={receipt.id} receipt={receipt} onAction={onAction} />
            ))}
          </div>
        ) : (
          <BlankCard title="No related purchases" body="Receipts anchor the relationship graph to real evidence." />
        )}
      </SectionCard>

      <SectionCard title="Recent interaction">
        <ActivityFeed items={payload.activity} onAction={onAction} />
      </SectionCard>
    </div>
  );
}

export function MemoriesView({ state, payload, onAction }: PageProps<MemoriesPayload>) {
  if (state === 'loading') return <LoadingState label="Loading Memories" blocks={4} />;
  if (state === 'error') {
    return (
      <RouteError
        title="Memories couldn’t load"
        body="Memories are mocked as a first-class layer, so timeline structure remains stable even when data fails."
        actionLabel="Retry Memories"
        onAction={() => onAction('retry:/memories')}
      />
    );
  }
  if (!payload) return <RouteError title="Missing Memories mock" body="No payload was found for the selected state." />;
  const featuredMemory = payload.featuredMemory;

  return (
    <div className="route-stack">
      <ScreenToolbar
        eyebrow="System-assisted memory creation"
        title="Memories"
        selectedView={payload.header.selectedView}
        support="Receipts become events, then stories, with people and things attached where useful."
      />
      <SurfaceControls searchLabel={payload.header.searchPlaceholder} controls={[payload.header.filterLabel]} />
      {payload.summaryMetrics.length ? <SummaryBand items={payload.summaryMetrics} /> : <BlankCard title="No memories yet" body="Memories appear when purchases cluster into meaning." />}

      {featuredMemory ? (
        <FeaturePanel
          eyebrow="Featured memory"
          title={featuredMemory.title}
          body={featuredMemory.summary}
          actionLabel="Open memory"
          onAction={() => onAction(featuredMemory.action)}
          chips={[featuredMemory.memoryState, featuredMemory.memoryType]}
        />
      ) : null}

      <SectionCard title="Timeline">
        {payload.timeline.length ? (
          <div className="card-list">
            {payload.timeline.map((memory) => (
              <MemoryRow key={memory.id} memory={memory} onAction={onAction} rich />
            ))}
          </div>
        ) : (
          <BlankCard title="No timeline yet" body="The timeline becomes useful once receipts and people start clustering." />
        )}
      </SectionCard>

      {payload.upgradeCard ? <UpgradeCard data={payload.upgradeCard} onAction={onAction} /> : null}
    </div>
  );
}

export function MemoryDetailView({ state, payload, onAction }: PageProps<MemoryDetailPayload>) {
  if (state === 'loading') return <LoadingState label="Loading Memory detail" blocks={4} />;
  if (!payload) return <RouteError title="Missing Memory detail mock" body="No payload was found for this state." />;

  return (
    <div className="route-stack">
      <DetailHeader
        eyebrow={payload.detail.memoryType}
        title={payload.detail.title}
        summary={payload.detail.headerSummary}
        backLabel="Back to Memories"
        onBack={() => onAction('route:/memories')}
        chips={[payload.detail.memoryState, payload.detail.significance]}
      />
      <SummaryBand items={payload.summaryMetrics} />

      <SectionCard title="Story">
        <article className="story-card">
          <p>{payload.detail.summary}</p>
          <p>{payload.detail.notes}</p>
          <div className="chip-row">
            <span className="chip">{payload.detail.placeLabel}</span>
            <span className="chip">{fullDateTime.format(new Date(payload.detail.startsAt))}</span>
          </div>
        </article>
      </SectionCard>

      <SectionCard title="People in this memory">
        {payload.people.length ? (
          <div className="card-list">
            {payload.people.map((person) => (
              <PersonRow key={person.id} person={person} onAction={onAction} />
            ))}
          </div>
        ) : (
          <BlankCard title="No people attached" body="People links help the memory layer feel alive." />
        )}
      </SectionCard>

      <SectionCard title="Linked Things">
        {payload.linkedThings.length ? (
          <div className="card-list">
            {payload.linkedThings.map((thing) => (
              <ThingRow key={thing.id} thing={thing} onAction={onAction} />
            ))}
          </div>
        ) : (
          <BlankCard title="No linked Things" body="Not every memory needs a thing, but the pattern is ready when it matters." />
        )}
      </SectionCard>

      <SectionCard title="Related receipts">
        {payload.relatedReceipts.length ? (
          <div className="card-list">
            {payload.relatedReceipts.map((receipt) => (
              <ReceiptRow key={receipt.id} receipt={receipt} onAction={onAction} />
            ))}
          </div>
        ) : (
          <BlankCard title="No related receipts" body="Receipts remain the evidence layer behind the story." />
        )}
      </SectionCard>

      <SectionCard title="Sequence">
        <ActivityFeed items={payload.sequence} onAction={onAction} />
      </SectionCard>
    </div>
  );
}

export function ReceiptStudioView({ state, payload, onAction }: PageProps<ReceiptStudioPayload>) {
  if (state === 'loading') return <LoadingState label="Loading receipt review" blocks={4} />;
  if (!payload) return <RouteError title="Missing Receipt Studio payload" body="No receipt payload was found for this route." />;

  const selectedLineItem = payload.lineItems.find((lineItem) => lineItem.id === payload.selectedLineItemId) ?? payload.lineItems[0] ?? null;
  const issueAlerts = (payload.alerts ?? []).filter((alert) => alert.level === 'issue');
  const infoAlerts = (payload.alerts ?? []).filter((alert) => alert.level === 'info');
  const summaryMetrics: SummaryMetric[] = [
    {
      label: 'Raw document',
      value: payload.sourceDocument ? 'Stored' : 'Present',
      note: payload.sourceDocument?.sourceType.replace('_', ' ') ?? payload.receipt.sourceType.replace('_', ' '),
      tone: 'blue',
      trend: [1, 2, 3, 4],
    },
    {
      label: 'Line items',
      value: String(payload.lineItems.length),
      note: selectedLineItem ? `${selectedLineItem.reviewState.replace('_', ' ')} focus` : 'Waiting on extraction',
      tone: 'green',
      trend: [1, 2, Math.max(2, payload.lineItems.length), Math.max(2, payload.lineItems.length)],
    },
    {
      label: 'Receipts detected',
      value: String(payload.captureSession?.detectedReceiptCount ?? 1),
      note: issueAlerts.length ? `${issueAlerts.length} issue${issueAlerts.length === 1 ? '' : 's'} flagged` : 'Quiet processing',
      tone: 'amber',
      trend: [1, 1, Math.max(1, payload.captureSession?.detectedReceiptCount ?? 1), Math.max(1, payload.captureSession?.detectedReceiptCount ?? 1)],
    },
  ];

  return (
    <div className="route-stack">
      <DetailHeader
        eyebrow="Receipt core"
        title={payload.header.merchantName ?? payload.header.title}
        summary={
          payload.receipt.status === 'processing'
            ? 'The original receipt is already stored while parsed and structured layers are being prepared.'
            : 'Use this review surface to move from raw receipt evidence to trustworthy purchase data.'
        }
        backLabel="Back to Home"
        onBack={() => onAction('route:/home')}
        chips={[payload.receipt.status.replace('_', ' '), payload.receipt.sourceType.replace('_', ' ')]}
      />

      <SummaryBand items={summaryMetrics} />

      {payload.progress ? (
        <FeaturePanel
          eyebrow="Extraction running"
          title={payload.progress.label}
          body={
            payload.captureSession && payload.captureSession.detectedReceiptCount > 1
              ? 'One upload can quietly split into multiple receipts. Each one keeps its own parsed, structured, and search-ready layers.'
              : 'The receipt core keeps the raw file first, then layers parsed output, structured purchase data, and search-ready text on top.'
          }
          actionLabel="Return Home"
          onAction={() => onAction('route:/home')}
          chips={[
            payload.extractionRun?.providerLabel ?? payload.extractionRun?.parserVersion ?? 'receipt-core-v1',
            payload.progress.stage.replace(/_/g, ' '),
          ]}
        />
      ) : null}

      {payload.receipt.status === 'trusted' ? (
        <FeaturePanel
          eyebrow="Review complete"
          title="Receipt trusted"
          body="This receipt is now ready to feed Things, People, Memories, and future search or agent retrieval."
          actionLabel="Back to Home"
          onAction={() => onAction('route:/home')}
          chips={['structured', 'search-ready']}
        />
      ) : null}

      {issueAlerts.length ? (
        <SectionCard title="Needs attention">
          <div className="card-list">
            {issueAlerts.map((alert) => (
              <article className="feature-panel feature-panel--amber" key={alert.id}>
                <div>
                  <p className="eyebrow">Issue alert</p>
                  <h3>{alert.title}</h3>
                </div>
                <p>{alert.body}</p>
              </article>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {payload.captureSession && payload.captureSession.detectedReceiptCount > 1 ? (
        <SectionCard title="Detected from this upload">
          <div className="card-list">
            {payload.captureSession.siblings.map((receipt) => (
              <button className="entity-row entity-row--receipt" key={receipt.id} type="button" onClick={() => onAction(receipt.action)}>
                <div className="entity-row__body">
                  <div className="list-card__header">
                    <div>
                      <h3>{receipt.merchantName}</h3>
                      <p>Processed independently from the same upload</p>
                    </div>
                    <span className={`chip chip--${receipt.status}`}>{receipt.status.replace('_', ' ')}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Raw document">
        <div className="receipt-grid">
          <article className="list-card receipt-layer-card">
            <p className="eyebrow">Source document</p>
            <div className="mini-stack">
              <MetricLine label="Receipt ID" value={payload.receipt.id} />
              <MetricLine label="File" value={payload.sourceDocument?.fileName ?? 'Original receipt preserved'} />
              <MetricLine label="Mime type" value={payload.sourceDocument?.mimeType ?? payload.receipt.sourceType.replace('_', '/')} />
              <MetricLine label="Capture" value={payload.sourceDocument?.captureChannel.replace(/_/g, ' ') ?? 'Upload'} />
              <MetricLine label="Uploaded files" value={String(payload.sourceDocument?.sourceFiles.length ?? 0)} />
              <MetricLine label="Stored at" value={payload.sourceDocument?.capturedAt ?? payload.receipt.capturedAt ?? 'Pending'} />
              <MetricLine label="Receipts found" value={String(payload.sourceDocument?.detectedReceiptCount ?? 1)} />
              <MetricLine label="Checksum" value={payload.sourceDocument?.checksum ?? 'Traceability pending'} />
            </div>
          </article>
          <article className="list-card receipt-layer-card">
            <p className="eyebrow">Purchase header</p>
            <div className="mini-stack">
              <MetricLine label="Merchant" value={payload.header.merchantName ?? 'Detecting merchant'} />
              <MetricLine label="Purchased at" value={payload.header.purchasedAt ?? 'Detecting purchase time'} />
              <MetricLine
                label="Grand total"
                value={typeof payload.header.grandTotal === 'number' ? money.format(payload.header.grandTotal) : 'Detecting total'}
              />
              <MetricLine label="Currency" value={payload.header.currency} />
            </div>
          </article>
        </div>
      </SectionCard>

      <SectionCard title="Parsed data">
        {payload.parsedData ? (
          <div className="card-list">
            <article className="list-card receipt-layer-card">
              <p className="eyebrow">Field candidates</p>
              <div className="mini-stack">
                {payload.parsedData.fieldCandidates.map((field) => (
                  <MetricLine key={`${field.label}-${field.value}`} label={field.label} value={`${field.value} · ${Math.round(field.confidence * 100)}%`} />
                ))}
              </div>
            </article>
            <article className="list-card receipt-layer-card">
              <p className="eyebrow">Raw text</p>
              <pre className="receipt-raw-text">{payload.parsedData.rawText}</pre>
              <div className="chip-row">
                {payload.parsedData.returnPolicySnippet ? <span className="chip">{payload.parsedData.returnPolicySnippet}</span> : null}
                {payload.parsedData.warrantySnippet ? <span className="chip chip--accent">{payload.parsedData.warrantySnippet}</span> : null}
              </div>
            </article>
            {payload.evidenceTrail?.length ? (
              <article className="list-card receipt-layer-card">
                <p className="eyebrow">Evidence trail</p>
                <div className="mini-stack">
                  {payload.evidenceTrail.map((evidence) => (
                    <MetricLine key={evidence.id} label={evidence.label} value={evidence.snippet} />
                  ))}
                </div>
              </article>
            ) : null}
          </div>
        ) : (
          <BlankCard title="Parsed output pending" body="Extraction is still turning the raw receipt into reviewable text and field candidates." />
        )}
      </SectionCard>

      <SectionCard title="Structured purchase">
        {payload.lineItems.length ? (
          <div className="card-list">
            {payload.lineItems.map((lineItem) => (
              <article className={`list-card receipt-line-item ${lineItem.id === payload.selectedLineItemId ? 'receipt-line-item--selected' : ''}`} key={lineItem.id}>
                <div className="list-card__header">
                  <div>
                    <h3>{lineItem.descriptionNormalized}</h3>
                    <p>{lineItem.descriptionRaw}</p>
                  </div>
                  <strong>{money.format(lineItem.lineTotal)}</strong>
                </div>
                <div className="chip-row">
                  <span className={`chip chip--${lineItem.reviewState}`}>{lineItem.reviewState.replace('_', ' ')}</span>
                  <span className="chip">{lineItem.quantity} qty</span>
                  {lineItem.assetCandidateFlag ? <span className="chip chip--accent">Thing candidate</span> : null}
                  <span className="chip">{lineItem.productMatchStatus}</span>
                </div>
              </article>
            ))}
            {selectedLineItem && payload.evidence?.snippet ? (
              <article className="list-card receipt-layer-card">
                <p className="eyebrow">Selected evidence</p>
                <p>{payload.evidence.snippet}</p>
                <div className="chip-row">
                  <span className="chip">{selectedLineItem.descriptionNormalized}</span>
                  <span className="chip">{payload.evidence.evidenceType.replace('_', ' ')}</span>
                  {payload.evidence.pageNumber ? <span className="chip">Page {payload.evidence.pageNumber}</span> : null}
                </div>
              </article>
            ) : null}
          </div>
        ) : (
          <BlankCard title="Line items pending" body="The receipt is still being structured into purchase line items." />
        )}
      </SectionCard>

      <SectionCard title="Retailer and category enrichment">
        {payload.structuredData ? (
          <div className="receipt-grid">
            <article className="list-card receipt-layer-card">
              <p className="eyebrow">Retailer knowledge</p>
              <div className="mini-stack">
                <MetricLine label="Merchant profile" value={payload.structuredData.retailerProfile} />
                <MetricLine label="Returnability" value={payload.structuredData.returnWindowLabel} />
                <MetricLine label="Warranty support" value={payload.structuredData.warrantySupportLabel} />
              </div>
            </article>
            <article className="list-card receipt-layer-card">
              <p className="eyebrow">Tags</p>
              <div className="chip-row">
                {payload.structuredData.taxTags.map((tag) => (
                  <span className="chip" key={`tax-${tag}`}>
                    Tax: {tag}
                  </span>
                ))}
                {payload.structuredData.lifestyleTags.map((tag) => (
                  <span className="chip chip--accent" key={`life-${tag}`}>
                    {tag}
                  </span>
                ))}
                {payload.structuredData.productCategories.map((tag) => (
                  <span className="chip" key={`product-${tag}`}>
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          </div>
        ) : (
          <BlankCard title="Enrichment pending" body="Retailer lookups and category tagging show up once parsed purchase data is ready." />
        )}
      </SectionCard>

      <SectionCard title="Search and retrieval">
        {payload.searchDocument ? (
          <article className="list-card receipt-layer-card">
            <p className="eyebrow">Embedded data preview</p>
            <p>{payload.searchDocument.textPreview}</p>
            <div className="chip-row">
              <span className="chip chip--accent">{payload.searchDocument.status}</span>
              {payload.searchDocument.keywords.map((keyword) => (
                <span className="chip" key={keyword}>
                  {keyword}
                </span>
              ))}
            </div>
            {infoAlerts.length ? (
              <div className="mini-stack">
                {infoAlerts.map((alert) => (
                  <MetricLine key={alert.id} label={alert.title} value={alert.body} />
                ))}
              </div>
            ) : null}
          </article>
        ) : (
          <BlankCard title="Search layer pending" body="Semantic retrieval gets created after raw and parsed receipt data are available." />
        )}
      </SectionCard>

      <SectionCard title="People and memory suggestions">
        <div className="receipt-grid">
          <article className="list-card receipt-layer-card">
            <p className="eyebrow">People</p>
            {payload.peopleSuggestions?.length ? (
              <div className="chip-row">
                {payload.peopleSuggestions.map((person) => (
                  <span className="chip" key={person.id}>
                    {person.displayName} · {person.relationshipType}
                  </span>
                ))}
              </div>
            ) : (
              <p>No people suggestions yet.</p>
            )}
          </article>
          <article className="list-card receipt-layer-card">
            <p className="eyebrow">Memories</p>
            {payload.memorySuggestions?.length ? (
              <div className="chip-row">
                {payload.memorySuggestions.map((memory) => (
                  <span className="chip chip--accent" key={memory.id}>
                    {memory.suggestedTitle}
                  </span>
                ))}
              </div>
            ) : (
              <p>No memory suggestions yet.</p>
            )}
          </article>
        </div>
      </SectionCard>

      <SectionCard title="Next actions">
        <div className="receipt-action-row">
          <ActionButton
            label={payload.receipt.status === 'trusted' ? 'Receipt trusted' : 'Mark review complete'}
            onClick={() => onAction(`receipt:submit:${payload.receipt.id}`)}
            tone="primary"
          />
          <ActionButton
            label={payload.actions.canConvertToThing ? 'Thing candidates ready' : 'Wait for Things'}
            onClick={() => onAction(payload.actions.canConvertToThing ? `receipt:convert:${payload.receipt.id}` : 'route:/things')}
          />
        </div>
      </SectionCard>

      {payload.upgradeCard ? <UpgradeCard data={payload.upgradeCard} onAction={onAction} /> : null}
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
          <p className="eyebrow">Queryable product graph</p>
          <h1>{payload.title}</h1>
          <p>Believable mocked responses now point back into Things, People, Memories, and their shared receipts.</p>
        </div>
      </section>

      {payload.conversation.length === 0 ? (
        <EmptyPanel
          title="Ask about purchases, Things, people, or memories"
          body="Suggested prompts below are designed to demonstrate the shared relationship graph."
          actionLabel="Try a prompt"
          onAction={() => onAction('route:/agent/chat')}
        />
      ) : (
        <div className="conversation">
          {payload.conversation.map((message) => (
            <article className={`message-bubble message-bubble--${message.role}`} key={message.id}>
              <p>{message.content}</p>
              {message.citations?.length ? (
                <div className="chip-row">
                  {message.citations.map((citation) => (
                    <button className="chip chip--button" key={`${citation.type}-${citation.label}`} type="button" onClick={() => citation.action ? onAction(citation.action) : undefined}>
                      {citation.label}
                    </button>
                  ))}
                </div>
              ) : null}
              {message.structuredResults?.length ? (
                <div className="card-list">
                  {message.structuredResults.map((result) => (
                    <StructuredResultCard key={result.id} result={result} onAction={onAction} />
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

      <SectionCard title="Suggested prompts">
        <div className="chip-row">
          {payload.suggestedPrompts.map((prompt) => (
            <button className="chip chip--button" key={prompt} type="button">
              {prompt}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Recent queries">
        <div className="chip-row">
          {payload.recentQueries.map((prompt) => (
            <span className="chip" key={prompt}>
              {prompt}
            </span>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function AgentVoiceView({ payload, state, onAction }: PageProps<AgentVoicePayload>) {
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

      <SectionCard title="Prompt examples">
        <div className="chip-row">
          {payload.examples.map((example) => (
            <span className="chip" key={example}>
              {example}
            </span>
          ))}
        </div>
      </SectionCard>

      {payload.response ? (
        <SectionCard title="Answer">
          <p>{payload.response.content}</p>
          <div className="chip-row">
            {payload.response.citations.map((citation) => (
              <button className="chip chip--button" key={`${citation.type}-${citation.label}`} type="button" onClick={() => citation.action ? onAction(citation.action) : undefined}>
                {citation.label}
              </button>
            ))}
          </div>
          <div className="card-list">
            {payload.response.structuredResults.map((result) => (
              <StructuredResultCard key={result.id} result={result} onAction={onAction} />
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

function DetailHeader(props: {
  eyebrow: string;
  title: string;
  summary: string;
  backLabel: string;
  onBack: () => void;
  chips?: string[];
}) {
  return (
    <section className="detail-header">
      <button className="detail-header__back" type="button" onClick={props.onBack}>
        <Icon name="chevron" className="icon-sm detail-header__back-icon" />
        <span>{props.backLabel}</span>
      </button>
      <p className="eyebrow">{props.eyebrow}</p>
      <h1>{props.title}</h1>
      <p>{props.summary}</p>
      {props.chips?.length ? (
        <div className="chip-row">
          {props.chips.map((chip) => (
            <span className="chip" key={chip}>
              {chip}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function SurfaceControls(props: { searchLabel: string; controls: string[] }) {
  return (
    <section className="surface-controls">
      <div className="surface-controls__search">
        <Icon name="search" className="icon-sm" />
        <span>{props.searchLabel}</span>
      </div>
      <div className="chip-row">
        {props.controls.map((control) => (
          <span className="chip" key={control}>
            {control}
          </span>
        ))}
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
    <article className={`summary-stat summary-stat--${props.item.tone}`}>
      <div className="summary-stat__copy">
        <span>{props.item.label}</span>
        <strong>{props.item.value}</strong>
        <small>{props.item.note}</small>
      </div>
      <MiniSparkline tone={props.item.tone} values={props.item.trend} />
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

function FeaturePanel(props: {
  eyebrow: string;
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
  chips?: string[];
}) {
  return (
    <section className="feature-panel">
      <div>
        <p className="eyebrow">{props.eyebrow}</p>
        <h2>{props.title}</h2>
      </div>
      <p>{props.body}</p>
      {props.chips?.length ? (
        <div className="chip-row">
          {props.chips.map((chip) => (
            <span className="chip" key={chip}>
              {chip}
            </span>
          ))}
        </div>
      ) : null}
      <ActionButton label={props.actionLabel} onClick={props.onAction} tone="primary" />
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

function StructuredResultCard(props: { result: AgentStructuredResult; onAction: (action: string) => void }) {
  return (
    <article className="structured-result">
      <div>
        <h3>{props.result.title}</h3>
        <p>{props.result.body}</p>
      </div>
      {props.result.chips?.length ? (
        <div className="chip-row">
          {props.result.chips.map((chip) => (
            <span className="chip" key={chip}>
              {chip}
            </span>
          ))}
        </div>
      ) : null}
      <ActionButton label={props.result.actionLabel} onClick={() => props.onAction(props.result.action)} />
    </article>
  );
}

function MetadataList(props: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="metadata-list">
      {props.items.map((item) => (
        <div className="metadata-row" key={`${item.label}-${item.value}`}>
          <span>{item.label}</span>
          <strong>{renderValue(item.value)}</strong>
        </div>
      ))}
    </div>
  );
}

function ActivityFeed(props: { items: ActivityItem[]; onAction: (action: string) => void }) {
  return (
    <div className="activity-feed">
      {props.items.map((item) => (
        <button className="activity-item" key={item.id} type="button" onClick={() => props.onAction(item.action)}>
          <span className={`activity-item__dot activity-item__dot--${item.kind}`} />
          <span className="activity-item__body">
            <strong>{item.title}</strong>
            <span>{item.body}</span>
            <small>{fullDateTime.format(new Date(item.occurredAt))}</small>
          </span>
        </button>
      ))}
    </div>
  );
}

function ReceiptRow(props: { receipt: ReceiptCardData; onAction: (action: string) => void }) {
  const { receipt } = props;

  return (
    <button className="entity-row entity-row--receipt" type="button" onClick={() => props.onAction(receipt.action)}>
      <div className="entity-row__body">
        <div className="list-card__header">
          <div>
            <h3>{receipt.merchantName}</h3>
            <p>{fullDateTime.format(new Date(receipt.purchasedAt))}</p>
          </div>
          <strong>{money.format(receipt.grandTotal)}</strong>
        </div>
        <p>{receipt.note}</p>
        <div className="chip-row">
          <span className={`chip chip--status chip--${receipt.status}`}>{receipt.status.replace('_', ' ')}</span>
          <span className="chip">{receipt.lineItemCount} items</span>
          {receipt.tags.map((tag) => (
            <span className="chip" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

function ThingRow(props: { thing: ThingCardData; onAction: (action: string) => void; featured?: boolean }) {
  const { thing } = props;
  return (
    <button className={`entity-row ${props.featured ? 'entity-row--featured' : ''}`} type="button" onClick={() => props.onAction(thing.action)}>
      <div className="entity-row__body">
        <div className="list-card__header">
          <div>
            <h3>{thing.displayName}</h3>
            <p>{thing.category} · {thing.subcategory}</p>
          </div>
          <strong>{money.format(thing.purchasePrice)}</strong>
        </div>
        <p>{thing.note}</p>
        <div className="chip-row">
          {thing.badges.map((badge) => (
            <span className="chip" key={badge}>
              {badge}
            </span>
          ))}
          {thing.linkedPeople.slice(0, 2).map((person) => (
            <span className="chip chip--accent" key={person}>
              {person}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

function PersonRow(props: { person: PersonCardData; onAction: (action: string) => void }) {
  const { person } = props;
  return (
    <button className="entity-row" type="button" onClick={() => props.onAction(person.action)}>
      <div className="entity-row__body">
        <div className="list-card__header">
          <div>
            <h3>{person.displayName}</h3>
            <p>{person.relationshipType}</p>
          </div>
          <strong>{money.format(person.totalSpend)}</strong>
        </div>
        <p>{person.note}</p>
        <div className="chip-row">
          {person.tags.map((tag) => (
            <span className="chip" key={tag}>
              {tag}
            </span>
          ))}
          <span className="chip chip--accent">{person.linkedThingCount} things</span>
          <span className="chip">{person.linkedMemoryCount} memories</span>
        </div>
      </div>
    </button>
  );
}

function MemoryRow(props: { memory: MemoryCardData; onAction: (action: string) => void; rich?: boolean }) {
  const { memory } = props;
  return (
    <button className={`entity-row ${props.rich ? 'entity-row--memory' : ''}`} type="button" onClick={() => props.onAction(memory.action)}>
      <div className="entity-row__body">
        <div className="list-card__header">
          <div>
            <h3>{memory.title}</h3>
            <p>{memory.placeLabel}</p>
          </div>
          <span className={`state-pill state-pill--${memory.memoryState}`}>{memory.memoryState}</span>
        </div>
        <p>{memory.summary}</p>
        <div className="chip-row">
          <span className="chip">{memory.memoryType}</span>
          <span className="chip">{memory.significance}</span>
          {memory.peoplePreview.map((person) => (
            <span className="chip chip--accent" key={person}>
              {person}
            </span>
          ))}
        </div>
        {props.rich ? <p>{fullDateTime.format(new Date(memory.startsAt))}</p> : null}
      </div>
    </button>
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
        breadcrumb: { show: false },
        itemStyle: {
          borderColor: '#f7f8fc',
          borderWidth: 4,
          gapWidth: 4,
          borderRadius: 20,
        },
        upperLabel: { show: false },
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

function prettifyTier(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function prettifyState(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function renderValue(value: string) {
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return fullDateTime.format(new Date(value));
  }

  return value;
}
