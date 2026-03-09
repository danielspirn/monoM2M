import type { SVGProps } from 'react';

type IconName =
  | 'menu'
  | 'home'
  | 'things'
  | 'people'
  | 'memories'
  | 'plus'
  | 'spark'
  | 'search'
  | 'chevron'
  | 'shield'
  | 'warranty'
  | 'insurance'
  | 'receipt'
  | 'chat'
  | 'mic'
  | 'upload'
  | 'camera'
  | 'map'
  | 'timeline'
  | 'settings'
  | 'account'
  | 'plan';

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
};

export function Icon({ name, ...props }: IconProps) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.75,
  };

  switch (name) {
    case 'menu':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
          <path {...common} d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case 'home':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
          <path {...common} d="M4 11.5 12 5l8 6.5V20H4z" />
          <path {...common} d="M9.5 20v-5h5v5" />
        </svg>
      );
    case 'things':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
          <path {...common} d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" />
          <path {...common} d="m12 3 8 4.5-8 4.5-8-4.5zM12 12v9" />
        </svg>
      );
    case 'people':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
          <path {...common} d="M8 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
          <path {...common} d="M3.5 19a4.5 4.5 0 0 1 9 0M13.5 19a3.5 3.5 0 0 1 7 0" />
        </svg>
      );
    case 'memories':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
          <path {...common} d="M8 4h8a4 4 0 0 1 0 8H8z" />
          <path {...common} d="M8 12h8a4 4 0 0 1 0 8H8z" />
          <path {...common} d="M8 4v16" />
        </svg>
      );
    case 'plus':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
          <path {...common} d="M12 5v14M5 12h14" />
        </svg>
      );
    case 'spark':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
          <path {...common} d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z" />
        </svg>
      );
    case 'search':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
          <circle {...common} cx="11" cy="11" r="6" />
          <path {...common} d="m16 16 4 4" />
        </svg>
      );
    case 'chevron':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
          <path {...common} d="m9 6 6 6-6 6" />
        </svg>
      );
    case 'shield':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
          <path {...common} d="m12 3 7 3v5c0 4.5-2.8 7.6-7 10-4.2-2.4-7-5.5-7-10V6z" />
        </svg>
      );
    case 'warranty':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
          <circle {...common} cx="12" cy="12" r="8" />
          <path {...common} d="M9 12h6M12 9v6" />
        </svg>
      );
    case 'insurance':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
          <path {...common} d="M4 7h10M4 12h16M4 17h10" />
          <path {...common} d="m16 5 4 4-4 4" />
        </svg>
      );
    case 'receipt':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
          <path {...common} d="M7 3h10v18l-2-1.5L12 21l-3-1.5L7 21z" />
          <path {...common} d="M9 8h6M9 12h6M9 16h4" />
        </svg>
      );
    case 'chat':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
          <path {...common} d="M5 18V6h14v9H9z" />
          <path {...common} d="m9 15-4 3" />
        </svg>
      );
    case 'mic':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
          <rect {...common} x="9" y="4" width="6" height="10" rx="3" />
          <path {...common} d="M6 11a6 6 0 0 0 12 0M12 17v3M9 20h6" />
        </svg>
      );
    case 'upload':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
          <path {...common} d="M12 16V5M8 9l4-4 4 4M5 19h14" />
        </svg>
      );
    case 'camera':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
          <path {...common} d="M5 8h14v10H5z" />
          <path {...common} d="M9 8 10.5 5h3L15 8" />
          <circle {...common} cx="12" cy="13" r="3" />
        </svg>
      );
    case 'map':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
          <path {...common} d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2z" />
          <path {...common} d="M9 4v14M15 6v14" />
        </svg>
      );
    case 'timeline':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
          <path {...common} d="M12 5v14" />
          <circle {...common} cx="12" cy="7" r="2" />
          <circle {...common} cx="12" cy="12" r="2" />
          <circle {...common} cx="12" cy="17" r="2" />
        </svg>
      );
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
          <path {...common} d="M12 8.5A3.5 3.5 0 1 1 8.5 12 3.5 3.5 0 0 1 12 8.5Z" />
          <path {...common} d="M4 12h2.2M17.8 12H20M12 4v2.2M12 17.8V20M6.3 6.3l1.6 1.6M16.1 16.1l1.6 1.6M17.7 6.3l-1.6 1.6M7.9 16.1l-1.6 1.6" />
        </svg>
      );
    case 'account':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
          <circle {...common} cx="12" cy="8" r="3.5" />
          <path {...common} d="M5 19a7 7 0 0 1 14 0" />
        </svg>
      );
    case 'plan':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
          <path {...common} d="M5 19V7l7-4 7 4v12z" />
          <path {...common} d="M9 12h6M9 16h4" />
        </svg>
      );
    default:
      return null;
  }
}
