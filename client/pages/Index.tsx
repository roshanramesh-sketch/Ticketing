import { Navigate } from "react-router-dom";

// Index page redirects to dashboard
export default function Index() {
  return <Navigate to="/" replace />;
}
