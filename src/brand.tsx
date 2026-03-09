import logoMarkUrl from '@/design-references/Icons_Logos/Logo.svg?url';
import logoLockupUrl from '@/design-references/hero-screens/ProductLogo-Name-TagLine.svg?url';

type BrandImageProps = {
  className?: string;
  decorative?: boolean;
};

export function LogoMark({ className, decorative = false }: BrandImageProps) {
  return <img alt={decorative ? '' : 'Money to Memories'} aria-hidden={decorative || undefined} className={className} src={logoMarkUrl} />;
}

export function LogoLockup({ className, decorative = false }: BrandImageProps) {
  return <img alt={decorative ? '' : 'Money to Memories'} aria-hidden={decorative || undefined} className={className} src={logoLockupUrl} />;
}
