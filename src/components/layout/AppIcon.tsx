"use client";

import { Icon as IconifyIcon, addCollection, type IconProps } from "@iconify/react";
import { ICON_DATA } from "@/config/iconData";

// Register the bundled icon data before any icon renders. This is a client
// module so it runs in the same place the icons do (server render and browser).
for (const collection of ICON_DATA) addCollection(collection);

/**
 * Iconify's <Icon> with the app's icons bundled (see src/config/iconData.ts).
 * `ssr` draws bundled icons straight away — already in the server HTML — instead
 * of after the page loads. Use this instead of importing from @iconify/react.
 */
export function Icon(props: IconProps) {
  return <IconifyIcon ssr {...props} />;
}
