import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth.store";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    const auth = useAuthStore.getState();

    await auth.verify();

    const isLoginPage = location.pathname === "/admin/login";
    const isBaseAdminPage = location.pathname === "/admin";
    const isAuthenticated = auth.authenticated;

    if (!isAuthenticated && !isLoginPage) {
      throw redirect({ to: "/admin/login" });
    }

    if (isAuthenticated && isLoginPage) {
      throw redirect({ to: "/admin/certificates" });
    }

    if (isBaseAdminPage) {
      throw redirect({ to: "/admin/login" });
    }
  },

  component: RouteComponent,
});
function RouteComponent() {
  return <Outlet />;
}
