import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Ticket,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Palette,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, colorMode, setTheme, setColorMode } = useTheme();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Ticket, label: "Tickets", path: "/tickets" },
    { icon: BookOpen, label: "Knowledge Base", path: "/knowledge-base" },
    ...(user?.role === "admin" || user?.role === "manager"
      ? [{ icon: Settings, label: "Admin Panel", path: "/admin" }]
      : []),
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 z-50",
          isMobileMenuOpen ? "w-64" : "w-0 lg:w-64"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-sidebar-border">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-sidebar-primary-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-lg font-bold text-sidebar-foreground group-hover:text-sidebar-primary transition-colors">
                TicketFlow
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {/* Dashboard */}
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </Link>

            {/* Tickets with Submenu */}
            <div>
              <Link
                to="/tickets"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Ticket className="w-5 h-5" />
                <span className="font-medium">Tickets</span>
              </Link>
              <div className="ml-8 mt-1 space-y-1">
                <Link
                  to="/bins"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Bins
                </Link>
              </div>
            </div>

            {/* Knowledge Base */}
            <Link
              to="/knowledge-base"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">Knowledge Base</span>
            </Link>

            {/* Admin Panel */}
            {(user?.role === "admin" || user?.role === "manager") && (
              <Link
                to="/admin"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Admin Panel</span>
              </Link>
            )}

            {/* Settings with User Management Submenu */}
            <div>
              <Link
                to="/settings"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Settings</span>
              </Link>
              <div className="ml-8 mt-1 space-y-1">
                <Link
                  to="/user-management"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  User Management
                </Link>
                <Link
                  to="/user-management/roles"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Roles
                </Link>
                <Link
                  to="/user-management/permissions"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Permissions Matrix
                </Link>
              </div>
            </div>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-sidebar-border space-y-3">
            {/* Theme Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
                >
                  <Palette className="w-4 h-4 mr-2" />
                  <span className="text-xs uppercase tracking-wider">Theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Color Mode</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => setColorMode("light")}
                  className={colorMode === "light" ? "bg-accent" : ""}
                >
                  <Sun className="w-4 h-4 mr-2" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setColorMode("dark")}
                  className={colorMode === "dark" ? "bg-accent" : ""}
                >
                  <Moon className="w-4 h-4 mr-2" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Theme Style</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => setTheme("light")}
                  className={theme === "light" ? "bg-accent" : ""}
                >
                  Warm Light
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("corporate")}
                  className={theme === "corporate" ? "bg-accent" : ""}
                >
                  Corporate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("ghibli")}
                  className={theme === "ghibli" ? "bg-accent" : ""}
                >
                  Ghibli
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
                >
                  <User className="w-4 h-4 mr-2" />
                  <span className="text-sm truncate">{user?.firstname}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user?.firstname} {user?.lastname}
                </DropdownMenuLabel>
                <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                  {user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-card border-b border-border h-16 flex items-center px-6 gap-4">
          <button
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
          <div className="flex-1" />
          <div className="text-sm text-muted-foreground">
            {user?.role === "admin" && (
              <span className="px-2 py-1 bg-accent rounded text-accent-foreground text-xs font-medium">
                Admin
              </span>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
