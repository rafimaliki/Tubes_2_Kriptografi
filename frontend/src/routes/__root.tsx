import { Outlet, createRootRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth.store";

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    const { authenticated } = useAuthStore.getState();

    if (authenticated && location.pathname === "/login") {
      throw redirect({ to: "/certificates" });
    } else if (!authenticated && location.pathname === "/certificates") {
      throw redirect({ to: "/login" });
    }
  },
  component: () => <Outlet />,
});
