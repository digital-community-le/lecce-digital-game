import logoUrl from '@/assets/images/logo.svg';

type LogoProps = {
  className?: string;
};

const Logo = ({ className }: LogoProps) => {
  return (
    <div className={`-mt-0.5 ${className || ''}`} data-testid="logo">
      <img src={logoUrl} alt="Logo Digital Community Lecce" />
    </div>
  );
};

export default Logo;
