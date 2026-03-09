import { useEffect, useRef } from 'react';
import type { EChartsOption } from 'echarts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { ScatterChart, TreemapChart } from 'echarts/charts';
import { init, use as registerCharts } from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';

registerCharts([GridComponent, ScatterChart, TooltipComponent, TreemapChart, SVGRenderer]);

export type AppChartOption = EChartsOption;

type ChartSurfaceProps = {
  className?: string;
  height?: number;
  label: string;
  option: AppChartOption;
};

export function ChartSurface({ className, height = 248, label, option }: ChartSurfaceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    const chart = init(container, undefined, {
      renderer: 'svg',
      width: container.clientWidth || 360,
      height,
    });

    chart.setOption(option, true);

    const resize = () => {
      chart.resize({
        width: container.clientWidth || 360,
        height,
      });
    };

    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    observer?.observe(container);

    return () => {
      observer?.disconnect();
      chart.dispose();
    };
  }, [height, option]);

  return <div aria-label={label} className={className} ref={containerRef} role="img" style={{ height }} />;
}
