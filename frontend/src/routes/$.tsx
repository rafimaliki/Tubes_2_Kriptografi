import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth.store";

export const Route = createFileRoute("/$")({
  beforeLoad: () => {
    const { authenticated } = useAuthStore.getState();

    if (authenticated) {
      throw redirect({ to: "/certificates" });
    } else {
      throw redirect({ to: "/login" });
    }
  },
});
