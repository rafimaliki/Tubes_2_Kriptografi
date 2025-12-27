import { Outlet, createRootRoute } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth.store";

export const Route = createRootRoute({
  beforeLoad: async () => {
    await useAuthStore.getState().verify();
  },
  component: () => <Outlet />,
});
