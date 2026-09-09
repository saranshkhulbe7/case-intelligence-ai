import { Navigate } from "react-router";

export default function DashboardPage() {
  return <Navigate to="/chats/new" replace />;
}
