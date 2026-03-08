'use client';

import { Card, Divider, Space, Typography } from 'antd';

import type { RouteKey, PersonaId } from '@/mocks/mockProvider';
import { PersonaSwitcher } from './PersonaSwitcher';
import { RouteStateSwitcher } from './RouteStateSwitcher';

const { Title, Text } = Typography;

type MockControlPanelProps = {
    routeKey?: RouteKey;
    onPersonaChange?: (personaId: PersonaId) => void;
    onRouteChange?: (routeKey: RouteKey) => void;
    onStateChange?: (state: string | undefined) => void;
};

export function MockControlPanel(props: MockControlPanelProps) {
    const { routeKey, onPersonaChange, onRouteChange, onStateChange } = props;

    return (
        <Card size="small" style={{ width: '100%', maxWidth: 420 }}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <div>
                    <Title level={5} style={{ margin: 0 }}>
                        Mock Controls
                    </Title>
                    <Text type="secondary">Switch persona and route state for UX review.</Text>
                </div>

                <PersonaSwitcher onChange={onPersonaChange} />

                <Divider style={{ margin: '4px 0' }} />

                <RouteStateSwitcher
                    routeKey={routeKey}
                    onRouteChange={onRouteChange}
                    onStateChange={onStateChange}
                />
            </Space>
        </Card>
    );
}