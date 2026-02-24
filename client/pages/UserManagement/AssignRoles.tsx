import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, Link } from "react-router-dom";
import AppLayout from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Shield } from "lucide-react";

interface Role {
    id: number;
    name: string;
    display_name: string;
    description: string;
}

interface Bin {
    id: number;
    name: string;
}

interface UserWithRoles {
    id: number;
    email: string;
    firstname: string;
    lastname: string;
    roles: { roleId: number; roleName: string; roleDisplayName: string; binId: number | null; binName: string | null }[];
}

interface RoleAssignment {
    roleId: number;
    binId: number | null;
}

// Roles that can be scoped to a specific bin
const BIN_SCOPED_ROLES = ["bin_manager", "bin_lead", "bin_agent"];

const AssignRoles = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);

    // Fetch user details
    const { data: user, isLoading: userLoading } = useQuery<UserWithRoles>({
        queryKey: ["user", userId],
        queryFn: async () => {
            const response = await fetch(`/api/user-management/users/${userId}`, {
                credentials: "include",
            });
            if (!response.ok) throw new Error("Failed to fetch user");
            return response.json();
        },
        enabled: !!userId,
    });

    // Fetch all roles
    const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
        queryKey: ["roles"],
        queryFn: async () => {
            const response = await fetch("/api/user-management/roles", { credentials: "include" });
            if (!response.ok) throw new Error("Failed to fetch roles");
            return response.json();
        },
    });

    // Fetch bins for scoped role selection
    const { data: bins = [] } = useQuery<Bin[]>({
        queryKey: ["bins"],
        queryFn: async () => {
            const response = await fetch("/api/bins", { credentials: "include" });
            if (!response.ok) return [];
            return response.json();
        },
    });

    // Pre-populate assignments from current user roles
    useEffect(() => {
        if (user?.roles && user.roles.length > 0) {
            setRoleAssignments(
                user.roles.map((r) => ({ roleId: r.roleId, binId: r.binId }))
            );
        }
    }, [user]);

    const handleToggleRole = (roleId: number, isBinScoped: boolean) => {
        setRoleAssignments((prev) => {
            const exists = prev.find((a) => a.roleId === roleId);
            if (exists) {
                return prev.filter((a) => a.roleId !== roleId);
            }
            return [...prev, { roleId, binId: isBinScoped ? null : null }];
        });
    };

    const handleSetBin = (roleId: number, binId: number | null) => {
        setRoleAssignments((prev) =>
            prev.map((a) => (a.roleId === roleId ? { ...a, binId } : a))
        );
    };

    const assignMutation = useMutation({
        mutationFn: async (assignments: RoleAssignment[]) => {
            const response = await fetch(`/api/user-management/users/${userId}/roles`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                // Backend expects { roleIds: [{roleId, binId}] }
                body: JSON.stringify({ roleIds: assignments }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to assign roles");
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user", userId] });
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast({ title: "Roles updated", description: "Role assignments saved successfully" });
            navigate("/user-management");
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        assignMutation.mutate(roleAssignments);
    };

    if (userLoading) {
        return (
            <AppLayout>
                <div className="p-6 max-w-3xl mx-auto text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading user…</p>
                </div>
            </AppLayout>
        );
    }

    if (!user) {
        return (
            <AppLayout>
                <div className="p-6 max-w-3xl mx-auto text-center py-12">
                    <p className="text-destructive">User not found.</p>
                    <Button asChild variant="outline" className="mt-4">
                        <Link to="/user-management">Back to Users</Link>
                    </Button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="p-6 max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Button variant="ghost" asChild className="mb-4">
                        <Link to="/user-management">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Users
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold mb-2">Assign Roles</h1>
                    <p className="text-muted-foreground">
                        Managing roles for{" "}
                        <strong>
                            {user.firstname} {user.lastname}
                        </strong>{" "}
                        ({user.email})
                    </p>
                </div>

                {/* Current Roles summary */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-lg">Current Roles</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {user.roles && user.roles.length > 0 ? (
                                user.roles.map((role, idx) => (
                                    <Badge key={idx} variant="secondary">
                                        <Shield className="w-3 h-3 mr-1" />
                                        {role.roleDisplayName}
                                        {role.binName && (
                                            <span className="ml-1 opacity-70">({role.binName})</span>
                                        )}
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-sm text-muted-foreground">No roles assigned yet</span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Role assignment form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Available Roles</CardTitle>
                        <CardDescription>
                            Select roles to assign. Bin-specific roles can be scoped to a particular bin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {rolesLoading ? (
                            <div className="text-center py-6">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-3">
                                    {roles.map((role) => {
                                        const isBinScoped = BIN_SCOPED_ROLES.includes(role.name);
                                        const assignment = roleAssignments.find((a) => a.roleId === role.id);
                                        const isChecked = !!assignment;

                                        return (
                                            <div
                                                key={role.id}
                                                className={`rounded-lg border transition-colors ${isChecked ? "border-primary/50 bg-primary/5" : "hover:bg-accent/50"}`}
                                            >
                                                <div className="flex items-start space-x-3 p-4">
                                                    <Checkbox
                                                        id={`role-${role.id}`}
                                                        checked={isChecked}
                                                        onCheckedChange={() =>
                                                            handleToggleRole(role.id, isBinScoped)
                                                        }
                                                    />
                                                    <div className="flex-1 space-y-1 min-w-0">
                                                        <Label
                                                            htmlFor={`role-${role.id}`}
                                                            className="text-sm font-medium leading-none cursor-pointer"
                                                        >
                                                            {role.display_name}
                                                        </Label>
                                                        <p className="text-sm text-muted-foreground">
                                                            {role.description}
                                                        </p>
                                                    </div>
                                                    {isBinScoped && (
                                                        <Badge variant="outline" className="flex-shrink-0 text-xs">
                                                            Bin-scoped
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Bin selector for scoped roles */}
                                                {isChecked && isBinScoped && bins.length > 0 && (
                                                    <div className="px-4 pb-4 pt-0 border-t border-border/50">
                                                        <Label className="text-xs text-muted-foreground mb-2 block">
                                                            Scope to bin (optional)
                                                        </Label>
                                                        <Select
                                                            value={assignment?.binId?.toString() ?? "any"}
                                                            onValueChange={(val) =>
                                                                handleSetBin(role.id, val === "any" ? null : parseInt(val))
                                                            }
                                                        >
                                                            <SelectTrigger className="w-full max-w-xs">
                                                                <SelectValue placeholder="All bins" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="any">All bins</SelectItem>
                                                                {bins.map((bin) => (
                                                                    <SelectItem key={bin.id} value={bin.id.toString()}>
                                                                        {bin.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {roleAssignments.length > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        {roleAssignments.length} role{roleAssignments.length !== 1 ? "s" : ""} will be assigned
                                    </p>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <Button
                                        type="submit"
                                        disabled={assignMutation.isPending}
                                        className="flex-1"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {assignMutation.isPending ? "Saving…" : "Save Roles"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate("/user-management")}
                                        disabled={assignMutation.isPending}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
};

export default AssignRoles;
