import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

// ==================== NOTIFICATION SYSTEM ====================
import NotificationProvider from "@/components/NotificationProvider";
import { NotificationWatcher } from "@/components/NotificationWatcher";
// ========================================================

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { title: "My OneApp" },
      { name: "description", content: "Send money, pay bills, withdraw cash - all in one app" },
      { name: "author", content: "My OneApp" },
      { property: "og:title", content: "My OneApp" },
      { property: "og:description", content: "Send money, pay bills, withdraw cash - all in one app" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@MyOneApp" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "My OneApp" },
      { name: "theme-color", content: "#000000" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "manifest",
        href: "/manifest.webmanifest",
      },
      {
        rel: "apple-touch-icon",
        href: "/mpesa-icon.png",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // ==================== PWA SERVICE WORKER ====================
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      import("virtual:pwa-register").then(({ registerSW }) => {
        const updateSW = registerSW({
          immediate: true,
          onNeedRefresh() {
            const shouldUpdate = window.confirm(
              "A new version of My OneApp is available.\n\nWould you like to update now?"
            );
            if (shouldUpdate) {
              updateSW(true);
            }
          },
          onOfflineReady() {
            console.log("%c[ PWA ] App is ready to work offline.", "color: #00C853");
          },
          onRegistered() {
            console.log("%c[ PWA ] Service Worker registered successfully", "color: #00C853");
          },
        });
      });
    }
  }, []);
  // ========================================================

  return (
    <QueryClientProvider client={queryClient}>
      {/* ==================== NOTIFICATION SYSTEM ==================== */}
      <NotificationProvider>
        <NotificationWatcher />
        <Outlet />
      </NotificationProvider>
      {/* ========================================================== */}
    </QueryClientProvider>
  );
}