import type { SVGProps } from "react";

type IconProps = { size?: number; color?: string; strokeWidth?: number } & Omit<SVGProps<SVGSVGElement>, "color">;

/** Stroke icon on a 24×24 grid (Lucide geometry). */
function Stroke({ size = 24, color = "currentColor", strokeWidth = 2, children, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

export const UsersIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Stroke>
);

export const UserCheckIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="m16 11 2 2 4-4" />
  </Stroke>
);

export const GraduationCapIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
    <path d="M22 10v6" />
    <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
  </Stroke>
);

export const DollarSignIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 2v20" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </Stroke>
);

export const ClockIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </Stroke>
);

export const TrendingUpIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M22 7 13.5 15.5 8.5 10.5 2 17" />
    <path d="M16 7h6v6" />
  </Stroke>
);

export const FileTextIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </Stroke>
);

export const CircleCheckIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M21.801 10A10 10 0 1 1 17 3.335" />
    <path d="m9 11 3 3L22 4" />
  </Stroke>
);

export const CircleAlertIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </Stroke>
);

/** simple-icons: Codementor-style laptop mark. */
export const CodementorIcon = ({ size = 16, color = "#155DFC" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill={color}
      fillRule="evenodd"
      d="M1.5 3.97h21a1.5 1.5 0 0 1 1.5 1.5v13.06a1.5 1.5 0 0 1-1.5 1.5h-21A1.5 1.5 0 0 1 0 18.53V5.47a1.5 1.5 0 0 1 1.5-1.5zm.6 2.1v11.86h19.8V6.07zm2.6 2.2h4.6v1.5H4.7zm0 2.7h4.6v1.5H4.7zm0 2.7h4.6v1.5H4.7zm10.3-5.9a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-3.3 7.9c.3-1.8 1.6-2.9 3.3-2.9s3 1.1 3.3 2.9z"
    />
  </svg>
);

/* ---------- Sidebar / header icons ---------- */

/** material-symbols:dashboard-outline */
export const DashboardIcon = ({ color = "currentColor" }: { color?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
    <path fill={color} d="M13 9V3h8v6zM3 13V3h8v10zm10 8V11h8v10zM3 21v-6h8v6zm2-10h4V5H5zm10 8h4v-6h-4zm0-12h4V5h-4zM5 19h4v-2H5z" />
  </svg>
);

/** solar:user-linear */
export const UserLinearIcon = ({ color = "currentColor" }: { color?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <circle cx="12" cy="6" r="4" />
    <ellipse cx="12" cy="17" rx="7" ry="4" />
  </svg>
);

export const LogoutIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 3H7.5A2.5 2.5 0 0 0 5 5.5v13A2.5 2.5 0 0 0 7.5 21H14" />
    <path d="M11 12h9m-3-3 3 3-3 3" />
  </svg>
);

/** cuida:sidebar-collapse-outline */
export const SidebarToggleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.75" y="3.75" width="18.5" height="16.5" rx="3.5" />
    <path d="M9 4v16" />
  </svg>
);

/** mage:notification-bell */
export const BellIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0B1026" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2.75a6.5 6.5 0 0 0-6.5 6.5v3.4c0 .9-.36 1.77-1 2.4l-.6.62a1.6 1.6 0 0 0 1.14 2.73h13.92a1.6 1.6 0 0 0 1.14-2.73l-.6-.61a3.4 3.4 0 0 1-1-2.41v-3.4a6.5 6.5 0 0 0-6.5-6.5z" />
    <path d="M9.2 18.4a2.8 2.8 0 0 0 5.6 0" />
  </svg>
);
