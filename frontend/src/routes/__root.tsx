import {
  Outlet,
  createRootRoute,
  Link,
  useRouterState,
} from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth.store";

export const Route = createRootRoute({
  beforeLoad: async () => {
    await useAuthStore.getState().verify();
  },
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouterState();
  const isAdminRoute = router.location.pathname.startsWith("/admin");

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <Outlet />
      <Link
        to={isAdminRoute ? "/" : "/admin"}
        className="fixed bottom-4 right-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-colors"
      >
        {isAdminRoute ? "Mode: Admin" : "Mode: Public"}
      </Link>
    </div>
  );
}
