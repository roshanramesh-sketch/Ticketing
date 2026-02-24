import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Tickets from "./pages/Tickets";
import KnowledgeBase from "./pages/KnowledgeBase";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
// Bins Management
import BinsList from "./pages/Bins/BinsList";
import CreateBin from "./pages/Bins/CreateBin";
import BinDetails from "./pages/Bins/BinDetails";
// User Management
import UsersList from "./pages/UserManagement/UsersList";
import CreateUser from "./pages/UserManagement/CreateUser";
import AssignRoles from "./pages/UserManagement/AssignRoles";
import RolesList from "./pages/UserManagement/RolesList";
import PermissionsMatrix from "./pages/UserManagement/PermissionsMatrix";
import React from "react";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets"
        element={
          <ProtectedRoute>
            <Tickets />
          </ProtectedRoute>
        }
      />
      <Route
        path="/knowledge-base"
        element={
          <ProtectedRoute>
            <KnowledgeBase />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        }
      />
      {/* Bins Routes */}
      <Route
        path="/bins"
        element={
          <ProtectedRoute>
            <BinsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bins/create"
        element={
          <ProtectedRoute>
            <CreateBin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bins/:id"
        element={
          <ProtectedRoute>
            <BinDetails />
          </ProtectedRoute>
        }
      />
      {/* User Management Routes */}
      <Route
        path="/user-management"
        element={
          <ProtectedRoute>
            <UsersList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user-management/create"
        element={
          <ProtectedRoute>
            <CreateUser />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user-management/:userId/roles"
        element={
          <ProtectedRoute>
            <AssignRoles />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user-management/roles"
        element={
          <ProtectedRoute>
            <RolesList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user-management/permissions"
        element={
          <ProtectedRoute>
            <PermissionsMatrix />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
