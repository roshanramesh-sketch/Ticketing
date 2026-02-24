import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActivityLog } from "@/types";
import { AlertCircle, Shield, Users, Activity } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserManagement {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
}

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"users" | "activity">("users");
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserManagement | null>(null);
  const [newRole, setNewRole] = useState<string>("");

  useEffect(() => {
    if (user?.role !== "admin") {
      setError("You do not have permission to access this page");
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersRes, activityRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/activity-logs"),
      ]);

      if (!usersRes.ok || !activityRes.ok) {
        throw new Error("Failed to fetch admin data");
      }

      const usersData = await usersRes.json();
      const activityData = await activityRes.json();

      setUsers(usersData);
      setActivityLogs(activityData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: number) => {
    if (!newRole) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) throw new Error("Failed to update role");

      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setEditingUser(null);
      setNewRole("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  if (user?.role !== "admin") {
    return (
      <AppLayout>
        <div className="p-6">
          <Card>
            <CardContent className="pt-12 text-center">
              <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive font-semibold mb-2">Access Denied</p>
              <p className="text-muted-foreground">
                You do not have permission to access the admin panel
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading admin panel...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground mt-2">
            Manage users, roles, and system activity
          </p>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "users"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            User Management
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "activity"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Activity Logs
          </button>
        </div>

        {/* User Management Tab */}
        {activeTab === "users" && (
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user roles and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold">Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Email</th>
                      <th className="text-left py-3 px-4 font-semibold">Role</th>
                      <th className="text-left py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-border hover:bg-accent/50">
                        <td className="py-3 px-4">
                          {u.firstname} {u.lastname}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                        <td className="py-3 px-4">
                          {editingUser?.id === u.id ? (
                            <Select
                              value={newRole || u.role}
                              onValueChange={setNewRole}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="support">Support</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs capitalize font-medium">
                              {u.role}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {editingUser?.id === u.id ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleRoleChange(u.id)}
                                className="text-xs"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingUser(null);
                                  setNewRole("");
                                }}
                                className="text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingUser(u);
                                setNewRole(u.role);
                              }}
                              className="text-xs"
                            >
                              Edit Role
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity Logs Tab */}
        {activeTab === "activity" && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-700">
                Showing activity logs from the last 7 days. Older logs are automatically archived.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  User actions and system events ({activityLogs.length} records)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {activityLogs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No activity logs found
                    </p>
                  ) : (
                    activityLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-4 border border-border rounded-lg hover:bg-accent/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <p className="font-medium text-foreground">
                              {log.action}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              User ID: {log.user_id}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {log.details && (
                          <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded mt-2">
                            {log.details}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Admin;
