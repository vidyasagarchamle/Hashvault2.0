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
      {/* Outer square with rounded corners */}
      <rect
        x="6"
        y="6"
        width="28"
        height="28"
        rx="8"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
      />
      
      {/* Abstract vault symbol - intersecting shapes */}
      <path
        d="M14 14L26 26M26 14L14 26"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* Center circle */}
      <circle
        cx="20"
        cy="20"
        r="4"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
      />
    </svg>
  );
} 