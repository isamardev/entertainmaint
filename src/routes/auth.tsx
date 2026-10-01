import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Sign in — Entertainment Trends" }, { name: "robots", content: "noindex" }],
  }),
  component: AuthRedirect,
});

function AuthRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/admin/login", replace: true });
  }, [navigate]);

  return null;
}
