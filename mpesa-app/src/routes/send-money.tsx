import { createFileRoute, useNavigate, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/send-money")({
  component: () => <Outlet />,
});
