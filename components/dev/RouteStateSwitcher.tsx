'use client';

import { useEffect, useMemo, useState } from 'react';

import type { RouteKey } from '@/mocks/mockProvider';
import { clearStateOverride, getStateOverrides, setStateOverride } from '@/mocks/mockSessionStore';
import { ROUTE_OPTIONS, getRouteStateOptions } from './mockDevConfig';

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
        <div className={`mock-stack ${compact ? 'mock-stack--compact' : ''}`}>
            {!compact && <span className="mock-control__label">Route State</span>}

            {!controlledRouteKey && (
                <label className="mock-control">
                    <span className="mock-control__label">Route</span>
                    <select
                        className="mock-control__input"
                    value={activeRouteKey}
                        onChange={(event) => handleRouteChange(event.target.value as RouteKey)}
                    >
                        {ROUTE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
            )}

            <div className="mock-row">
                <select
                    className="mock-control__input"
                    value={stateValue ?? ''}
                    onChange={(event) => {
                        const value = event.target.value;
                        if (!value) {
                            handleReset();
                            return;
                        }
                        handleStateChange(value);
                    }}
                >
                    <option value="">Use persona default state</option>
                    {stateOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <button className="mock-control__button" type="button" onClick={handleReset}>
                    Reset
                </button>
            </div>
        </div>
    );
}
