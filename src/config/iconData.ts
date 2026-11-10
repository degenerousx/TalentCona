import type { IconifyJSON } from "@iconify/react";

/**
 * SVG data for the Iconify icons used in the header and sidebar, bundled with
 * the app so they render instantly (and offline) instead of being downloaded
 * from api.iconify.design on every page load. Registered in
 * src/components/layout/AppIcon.tsx.
 *
 * Adding a new icon name (e.g. in navigation.ts) still works without touching
 * this file — it just loads online. To bundle it too, add its data here: open
 * https://api.iconify.design/<prefix>.json?icons=<name> and copy the entry into
 * that prefix's "icons" (or add a new block for a new prefix).
 *
 * Generated 2026-10-09 from the Iconify API.
 */
export const ICON_DATA: IconifyJSON[] = [
  {
    prefix: "carbon",
    icons: {
      "task-complete": {
        body: "<path fill=\"currentColor\" d=\"m22 27.18l-2.59-2.59L18 26l4 4l8-8l-1.41-1.41z\"/><path fill=\"currentColor\" d=\"M25 5h-3V4a2.006 2.006 0 0 0-2-2h-8a2.006 2.006 0 0 0-2 2v1H7a2.006 2.006 0 0 0-2 2v21a2.006 2.006 0 0 0 2 2h9v-2H7V7h3v3h12V7h3v11h2V7a2.006 2.006 0 0 0-2-2m-5 3h-8V4h8Z\"/>"
      }
    },
    aliases: {},
    width: 32,
    height: 32
  },
  {
    prefix: "cuida",
    icons: {
      "sidebar-collapse-outline": {
        body: "<path fill=\"currentColor\" fill-rule=\"evenodd\" d=\"M6.416 4.767a2.65 2.65 0 0 0-2.65 2.65v8.832a2.65 2.65 0 0 0 2.65 2.65h1.461V4.767h-1.46Zm0-1.767A4.416 4.416 0 0 0 2 7.416v8.833a4.416 4.416 0 0 0 4.416 4.417h11.168A4.416 4.416 0 0 0 22 16.248V7.416A4.416 4.416 0 0 0 17.584 3zm3.228 1.767v14.132h7.94a2.65 2.65 0 0 0 2.65-2.65V7.416a2.65 2.65 0 0 0-2.65-2.65h-7.94Z\" clip-rule=\"evenodd\"/>"
      }
    },
    aliases: {},
    width: 24,
    height: 24
  },
  {
    prefix: "fluent",
    icons: {
      "people-community-24-regular": {
        body: "<path fill=\"currentColor\" d=\"M12 4.5A1.75 1.75 0 1 0 12 8a1.75 1.75 0 0 0 0-3.5M8.75 6.25a3.25 3.25 0 1 1 6.5 0a3.25 3.25 0 0 1-6.5 0M5 6.5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3M2 8a3 3 0 1 1 6 0a3 3 0 0 1-6 0m15.5 0a1.5 1.5 0 1 1 3 0a1.5 1.5 0 0 1-3 0M19 5a3 3 0 1 0 0 6a3 3 0 0 0 0-6M7.5 12.75c0-.966.784-1.75 1.75-1.75h5.5c.966 0 1.75.784 1.75 1.75v3.75a4.5 4.5 0 1 1-9 0zm1.75-.25a.25.25 0 0 0-.25.25v3.75a3 3 0 1 0 6 0v-3.75a.25.25 0 0 0-.25-.25zm-2.64-.522q-.109.369-.11.772v.81l-2.814.754a.25.25 0 0 0-.177.306l.712 2.657a3 3 0 0 0 3.161 2.212c.315.486.705.919 1.153 1.282a4.5 4.5 0 0 1-5.763-3.107l-.712-2.656a1.75 1.75 0 0 1 1.237-2.143zm8.855 8.793q.125.042.253.076a4.5 4.5 0 0 0 5.511-3.182l.712-2.656a1.75 1.75 0 0 0-1.237-2.144l-3.314-.888q.109.37.11.773v.81l2.816.754a.25.25 0 0 1 .176.306l-.712 2.657a3 3 0 0 1-3.162 2.212a5.5 5.5 0 0 1-1.153 1.282\"/>",
        width: 24,
        height: 24
      }
    },
    aliases: {},
    width: 20,
    height: 20
  },
  {
    prefix: "ic",
    icons: {
      "baseline-laptop": {
        body: "<path fill=\"currentColor\" d=\"M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2zM4 6h16v10H4z\"/>"
      }
    },
    aliases: {},
    width: 24,
    height: 24
  },
  {
    prefix: "iconoir",
    icons: {
      "stats-report": {
        body: "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M10 9H6m9.5 2a2.5 2.5 0 1 1 0-5a2.5 2.5 0 0 1 0 5M6 6h3m9 12l-4.5-3l-2.5 2l-5-4\"/><path d=\"M3 20.4V3.6a.6.6 0 0 1 .6-.6h16.8a.6.6 0 0 1 .6.6v16.8a.6.6 0 0 1-.6.6H3.6a.6.6 0 0 1-.6-.6Z\"/></g>"
      },
      wallet: {
        body: "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"><path d=\"M19 20H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2Z\"/><path fill=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M16.5 14a.5.5 0 1 1 0-1a.5.5 0 0 1 0 1\"/><path d=\"M18 7V5.603a2 2 0 0 0-2.515-1.932l-11 2.933A2 2 0 0 0 3 8.537V9\"/></g>"
      }
    },
    aliases: {},
    width: 24,
    height: 24
  },
  {
    prefix: "lucide",
    icons: {
      calendar: {
        body: "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path d=\"M8 2v3m8-3v3\"/><rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\"/><path d=\"M3 9h18\"/></g>"
      }
    },
    aliases: {},
    width: 24,
    height: 24
  },
  {
    prefix: "material-symbols",
    icons: {
      "dashboard-outline": {
        body: "<path fill=\"currentColor\" d=\"M13 9V3h8v6zM3 13V3h8v10zm10 8V11h8v10zM3 21v-6h8v6zm2-10h4V5H5zm10 8h4v-6h-4zm0-12h4V5h-4zM5 19h4v-2H5zm4-2\"/>"
      }
    },
    aliases: {},
    width: 24,
    height: 24
  },
  {
    prefix: "mdi",
    icons: {
      "bell-outline": {
        body: "<path fill=\"currentColor\" d=\"M10 21h4c0 1.1-.9 2-2 2s-2-.9-2-2m11-2v1H3v-1l2-2v-6c0-3.1 2-5.8 5-6.7V4c0-1.1.9-2 2-2s2 .9 2 2v.3c3 .9 5 3.6 5 6.7v6zm-4-8c0-2.8-2.2-5-5-5s-5 2.2-5 5v7h10z\"/>"
      }
    },
    aliases: {},
    width: 24,
    height: 24
  },
  {
    prefix: "mingcute",
    icons: {
      "sparkles-line": {
        body: "<path fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" d=\"M6 14.806a9.7 9.7 0 0 0 2.33 2.52A9.7 9.7 0 0 0 6 19.846a9.7 9.7 0 0 0-2.33-2.52A9.7 9.7 0 0 0 6 14.806ZM14.774 4.4a16.2 16.2 0 0 0 5.374 5.893a16.2 16.2 0 0 0-5.374 5.892a16.2 16.2 0 0 0-5.372-5.892A16.2 16.2 0 0 0 14.774 4.4Z\"/>"
      },
      "user-star-line": {
        body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12.21 14.064A12 12 0 0 0 11 14c-4.418 0-8 2.567-8 4.5S6.582 21 11 21q.339 0 .672-.005M15 7a4 4 0 1 1-8 0a4 4 0 0 1 8 0m3 7.5l1.131 1.943l2.198.475l-1.498 1.677l.226 2.237L18 19.925l-2.057.907l.226-2.237l-1.498-1.677l2.198-.475z\"/>"
      }
    },
    aliases: {},
    width: 24,
    height: 24
  },
  {
    prefix: "mynaui",
    icons: {
      "graduation-cap": {
        body: "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"><path d=\"M14.217 3.5a5.17 5.17 0 0 0-4.434 0L3.092 6.637c-1.456.682-1.456 3.044 0 3.726l6.69 3.137a5.17 5.17 0 0 0 4.435 0l6.691-3.137c1.456-.682 1.456-3.044 0-3.726zM22 8.5v5\"/><path d=\"M5 11.5v5.125C5 19.543 9.694 21 12 21s7-1.457 7-4.375V11.5\"/></g>"
      }
    },
    aliases: {
      "academic-hat": {
        parent: "graduation-cap"
      }
    },
    width: 24,
    height: 24
  },
  {
    prefix: "simple-icons",
    icons: {
      codementor: {
        body: "<path fill=\"currentColor\" d=\"M8.487 14.887c.39 0 .706.314.706.7a.703.703 0 0 1-.706.7H5.632a.703.703 0 0 1-.707-.7c0-.386.317-.7.707-.7zm.69-2.593c.39 0 .706.315.706.7a.703.703 0 0 1-.707.7H5.648a.703.703 0 0 1-.706-.7c0-.386.316-.7.706-.7zm3.864-3.46a2.11 2.11 0 0 1 2.118-2.099a2.11 2.11 0 0 1 2.118 2.1a2.115 2.115 0 0 1-2.118 2.103a2.116 2.116 0 0 1-2.118-2.104m6.259 6.559c.1.619-.378 1.18-1.005 1.178h-6.272a1.016 1.016 0 0 1-1.005-1.178c.315-1.942 1.391-3.509 2.796-4.13a2.77 2.77 0 0 0 2.69 0c1.405.621 2.482 2.19 2.796 4.13m-8.712-4.29c-8.38 0-.147-.002-4.941-.002a.703.703 0 0 1-.707-.7c0-.386.317-.7.707-.7l4.941.001c.39 0 .707.314.706.701a.7.7 0 0 1-.706.7m-4.94-2.594a.7.7 0 0 1-.707-.7c0-.386.317-.7.707-.7h4.94c.389 0 .705.313.705.7a.703.703 0 0 1-.706.699zm7.809 10.117a.66.66 0 0 0 .66-.654h7.06v-12.6H2.824v12.599h7.059c0 .361.295.654.66.654zM24 17.972v.957c0 .605-.496 1.096-1.106 1.096H1.106c-.61 0-1.106-.49-1.106-1.096v-.957h1.413V5.357c0-.763.623-1.382 1.394-1.382h18.387c.77 0 1.394.619 1.394 1.382v12.615Z\"/>"
      }
    },
    aliases: {},
    width: 24,
    height: 24
  },
  {
    prefix: "solar",
    icons: {
      "user-linear": {
        body: "<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"1.5\"><circle cx=\"12\" cy=\"6\" r=\"4\"/><path d=\"M20 17.5C20 19.9853 20 22 12 22C4 22 4 19.9853 4 17.5C4 15.0147 7.58172 13 12 13C16.4183 13 20 15.0147 20 17.5Z\"/></g>"
      }
    },
    aliases: {},
    width: 24,
    height: 24
  },
  {
    prefix: "tabler",
    icons: {
      transfer: {
        body: "<path fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M20 10H4l5.5-6M4 14h16l-5.5 6\"/>"
      }
    },
    aliases: {},
    width: 24,
    height: 24
  }
];
