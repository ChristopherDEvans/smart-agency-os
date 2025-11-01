export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "Smart Agency OS";

export const APP_LOGO =
  import.meta.env.VITE_APP_LOGO ||
  "https://placehold.co/128x128/E1E7EF/1F2937?text=App";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

// Smart Agency OS specific constants
export const BRAND_TAGLINE = "Automate → Optimize → Grow.";

export const CLIENT_STATUSES = [
  { value: "prospect", label: "Prospect", color: "text-yellow-400" },
  { value: "active", label: "Active", color: "text-green-400" },
  { value: "paused", label: "Paused", color: "text-orange-400" },
  { value: "churned", label: "Churned", color: "text-red-400" },
] as const;

export const ENGAGEMENT_STATUSES = [
  { value: "onboarding", label: "Onboarding", color: "text-blue-400" },
  { value: "active", label: "Active", color: "text-green-400" },
  { value: "paused", label: "Paused", color: "text-orange-400" },
  { value: "complete", label: "Complete", color: "text-gray-400" },
] as const;

export const PROPOSAL_STATUSES = [
  { value: "draft", label: "Draft", color: "text-gray-400" },
  { value: "sent", label: "Sent", color: "text-blue-400" },
  { value: "approved", label: "Approved", color: "text-green-400" },
  { value: "rejected", label: "Rejected", color: "text-red-400" },
] as const;

export const SERVICE_TIERS = [
  "Basic",
  "Standard",
  "Premium",
  "Enterprise",
  "Custom",
] as const;