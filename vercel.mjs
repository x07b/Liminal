// Vercel builds only the frontend. API and uploaded files live on the persistent server.
const origin = process.env.BACKEND_ORIGIN;
if (!origin) throw new Error("Set BACKEND_ORIGIN in Vercel to your persistent backend HTTPS origin.");
const backend = new URL(origin);
if (backend.protocol !== "https:" || backend.username || backend.password || backend.pathname !== "/" || backend.search || backend.hash) {
  throw new Error("BACKEND_ORIGIN must be an HTTPS origin, without a path, credentials or query string.");
}
export const config = {
  framework: "vite",
  buildCommand: "npm run build",
  outputDirectory: "dist",
  rewrites: [
    { source: "/api/:path*", destination: `${backend.origin}/api/:path*` },
    { source: "/uploads/:path*", destination: `${backend.origin}/uploads/:path*` },
    { source: "/((?!api(?:/|$)|uploads(?:/|$)).*)", destination: "/index.html" },
  ],
  headers: [
    { source: "/(.*)", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ] },
    { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
  ],
};
