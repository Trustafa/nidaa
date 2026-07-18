// 16px stroke icon set — one style everywhere (1.5px stroke, round caps).
type IconProps = { className?: string };

function Svg({ children, className }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "size-4"}
    >
      {children}
    </svg>
  );
}

export function DashboardIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="1.75" y="1.75" width="5" height="5" rx="1" />
      <rect x="9.25" y="1.75" width="5" height="5" rx="1" />
      <rect x="1.75" y="9.25" width="5" height="5" rx="1" />
      <rect x="9.25" y="9.25" width="5" height="5" rx="1" />
    </Svg>
  );
}

export function CalendarIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="1.75" y="3" width="12.5" height="11.25" rx="1.5" />
      <path d="M1.75 6.5h12.5M5 1.5V4M11 1.5V4" />
    </Svg>
  );
}

export function GuestsIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="5.5" cy="5" r="2.25" />
      <path d="M1.75 13.5c0-2.07 1.68-3.75 3.75-3.75s3.75 1.68 3.75 3.75" />
      <path d="M10.5 3.4a2.25 2.25 0 0 1 0 3.2M11.9 10.1c1.4.5 2.35 1.85 2.35 3.4" />
    </Svg>
  );
}

export function SettingsIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="8" cy="8" r="2" />
      <path d="M13.25 8c0-.4.55-.74.44-1.11-.11-.38-.77-.4-.98-.73-.2-.32.06-.93-.22-1.2-.27-.28-.88-.02-1.2-.22-.33-.2-.35-.87-.73-.98C10.19 3.65 9.9 4.25 9.5 4.25S8.74 3.65 8.37 3.76c-.38.11-.4.77-.73.98-.32.2-.93-.06-1.2.22-.28.27-.02.88-.22 1.2-.2.33-.87.35-.98.73C5.13 7.26 5.73 7.6 5.73 8s-.6.74-.49 1.11c.11.38.77.4.98.73.2.32-.06.93.22 1.2.27.28.88.02 1.2.22.33.2.35.87.73.98.37.11.66-.49 1.06-.49s.76.6 1.13.49c.38-.11.4-.77.73-.98.32-.2.93.06 1.2-.22.28-.27.02-.88.22-1.2.21-.33.87-.35.98-.73.11-.37-.44-.71-.44-1.11Z" />
    </Svg>
  );
}

export function LogoutIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 14H3.25c-.83 0-1.5-.67-1.5-1.5v-9c0-.83.67-1.5 1.5-1.5H6" />
      <path d="M10.5 11.5 14 8l-3.5-3.5M14 8H6" />
    </Svg>
  );
}

export function ChevronDown(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m4 6 4 4 4-4" />
    </Svg>
  );
}

export function ChevronLeft(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M10 3 5 8l5 5" />
    </Svg>
  );
}

export function ChevronRight(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m6 3 5 5-5 5" />
    </Svg>
  );
}

export function ArrowRight(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M2.5 8h11M9.5 4l4 4-4 4" />
    </Svg>
  );
}
