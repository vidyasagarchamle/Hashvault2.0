interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Hexagon shape representing vault/security */}
      <path
        d="M20 4L33.6603 12V28L20 36L6.33975 28V12L20 4Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Inner hexagon for depth */}
      <path
        d="M20 12L27.3301 16V24L20 28L12.6699 24V16L20 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      
      {/* Center dot */}
      <circle
        cx="20"
        cy="20"
        r="2"
        fill="currentColor"
      />
    </svg>
  );
} 