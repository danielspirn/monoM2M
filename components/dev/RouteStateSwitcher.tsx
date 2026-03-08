'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Select, Space, Typography } from 'antd';

import type { RouteKey } from '@/mocks/mockProvider';
import { clearStateOverride, getStateOverrides, setStateOverride } from '@/mocks/mockSessionStore';
import { ROUTE_OPTIONS, getRouteStateOptions } from './mockDevConfig';

const { Text } = Typography;

type RouteStateSwitcherProps = {
    routeKey?: RouteKey;
    onRouteChange?: (routeKey: RouteKey) => void;
    onStateChange?: (state: string | undefined) => void;
    compact?: boolean;
};

export function RouteStateSwitcher(props: RouteStateSwitcherProps) {
    const { routeKey: controlledRouteKey, onRouteChange, onStateChange, compact = false } = props;

    const [internalRouteKey, setInternalRouteKey] = useState<RouteKey>(controlledRouteKey ?? '/home');
    const [stateValue, setStateValue] = useState<string | undefined>(undefined);

    const activeRouteKey = controlledRouteKey ?? internalRouteKey;

    const stateOptions = useMemo(() => getRouteStateOptions(activeRouteKey), [activeRouteKey]);

    useEffect(() => {
        const overrides = getStateOverrides();
        const existing = overrides[activeRouteKey];
        setStateValue(existing);
    }, [activeRouteKey]);

    function handleRouteChange(nextRouteKey: RouteKey) {
        if (!controlledRouteKey) {
            setInternalRouteKey(nextRouteKey);
        }
        onRouteChange?.(nextRouteKey);
    }

    function handleStateChange(nextState: string) {
        setStateValue(nextState);
        setStateOverride(activeRouteKey, nextState);
        onStateChange?.(nextState);
    }

    function handleReset() {
        clearStateOverride(activeRouteKey);
        setStateValue(undefined);
        onStateChange?.(undefined);
    }

    return (
        <Space direction={compact ? 'horizontal' : 'vertical'} size={8} style={{ width: compact ? 'auto' : '100%' }}>
            {!compact && <Text type="secondary">Route State</Text>}

            {!controlledRouteKey && (
                <Select<RouteKey>
                    value={activeRouteKey}
                    onChange={handleRouteChange}
                    options={ROUTE_OPTIONS}
                    style={{ minWidth: compact ? 220 : '100%' }}
                    size="middle"
                    popupMatchSelectWidth={false}
                />
            )}

            <Space.Compact block={!compact}>
                <Select<string>
                    allowClear
                    placeholder="Use persona default state"
                    value={stateValue}
                    onChange={handleStateChange}
                    options={stateOptions}
                    style={{ minWidth: compact ? 220 : '100%' }}
                    size="middle"
                    popupMatchSelectWidth={false}
                />
                <Button onClick={handleReset}>Reset</Button>
            </Space.Compact>
        </Space>
    );
}