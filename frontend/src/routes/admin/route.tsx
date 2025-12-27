import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth.store";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    const auth = useAuthStore.getState();

    await auth.verify();

    const isLoginPage = location.pathname === "/admin/login";
    const isAuthenticated = auth.authenticated;

    if (!isAuthenticated && !isLoginPage) {
      throw redirect({ to: "/admin/login" });
    }

    if (isAuthenticated && isLoginPage) {
      throw redirect({ to: "/admin/certificates" });
    }
  },

  component: RouteComponent,
});
function RouteComponent() {
  return <Outlet />;
}
