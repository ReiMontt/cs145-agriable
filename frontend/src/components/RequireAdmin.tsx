import { Navigate } from "react-router-dom";

export const RequireAdmin = ({ children }: { children: JSX.Element }) => {
  const ok = typeof window !== "undefined" && sessionStorage.getItem("agriable_admin_authed") === "1";
  if (!ok) return <Navigate to="/login" replace />;
  return children;
};
