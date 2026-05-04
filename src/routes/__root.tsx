import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouterState } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { ConfirmProvider } from "@/components/ConfirmDialog";
import { Toaster } from "@/components/ui/sonner";
import { OwnerShell } from "@/components/OwnerShell";
import { TenantShell } from "@/components/TenantShell";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Go home</Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PropertyHQ" },
      { name: "description", content: "Real-time property management for modern estates." },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Public auth pages render outside shells
  const isAuth =
    pathname === "/auth" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/tenant-login" ||
    pathname === "/tenant-accept" ||
    pathname === "/tenant-register" ||
    pathname === "/tenant-waiting";
  const isTenantApp = pathname === "/tenant" || pathname.startsWith("/tenant/");

  return (
    <AuthProvider>
      <ConfirmProvider>
        {isAuth ? <Outlet /> : isTenantApp ? <TenantShell /> : <OwnerShell />}
        <Toaster position="top-center" richColors />
      </ConfirmProvider>
    </AuthProvider>
  );
}
