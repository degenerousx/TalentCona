import type { NextConfig } from "next";

// The backend the portal talks to. Override in .env.local, e.g. API_URL=http://localhost:4000
const API_URL = process.env.API_URL ?? "https://talentcona-backend.onrender.com";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // The browser only ever talks to this app's own origin; Next proxies to the
  // backend. Called directly, the refresh cookie would be a third-party cookie,
  // which Safari and incognito Chrome block.
  // /auth/* keeps its path because the cookie is scoped to Path=/auth/refresh.
  async rewrites() {
    return [
      { source: "/auth/:path*", destination: `${API_URL}/auth/:path*` },
      { source: "/api/:path*", destination: `${API_URL}/:path*` },
    ];
  },
};

export default nextConfig;
