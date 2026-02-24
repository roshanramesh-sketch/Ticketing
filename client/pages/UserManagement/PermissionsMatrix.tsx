import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save, Search, Shield, ArrowLeft, Info } from "lucide-react";

interface PermissionDefinition {
    permission_key: string;
    display_name: string;
    description: string;
    value_type: "boolean" | "array" | "object";
    display_order: number;
}

interface MatrixUser {
    id: number;
    email: string;
    firstname: string;
    lastname: string;
    permissions: Record<string, any>;
    bins_assigned: number[];
    teams_assigned: number[];
}

interface MatrixData {
    users: MatrixUser[];
    permissionDefinitions: PermissionDefinition[];
}

interface Bin {
    id: number;
    name: string;
}

const PermissionsMatrix: React.FC = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    // Local state: userId => { permKey => value }
    const [localPermissions, setLocalPermissions] = useState<Record<number, Record<string, any>>>({});
    const [localBins, setLocalBins] = useState<Record<number, number[]>>({});
    const [hasChanges, setHasChanges] = useState(false);

    // Fetch permissions matrix
    const { data, isLoading, error } = useQuery<MatrixData>({
        queryKey: ["permissions-matrix"],
        queryFn: async () => {
            const response = await fetch("/api/permissions/matrix", { credentials: "include" });
            if (!response.ok) throw new Error("Failed to fetch permissions matrix");
            return response.json();
        },
        onSuccess: (data) => {
            // Seed local state from fetched data
            const perms: Record<number, Record<string, any>> = {};
            const bins: Record<number, number[]> = {};
            for (const user of data.users) {
                perms[user.id] = { ...user.permissions };
                bins[user.id] = [...user.bins_assigned];
            }
            setLocalPermissions(perms);
            setLocalBins(bins);
            setHasChanges(false);
        },
    });

    // Fetch bins list for bins_assigned column
    const { data: allBins = [] } = useQuery<Bin[]>({
        queryKey: ["bins"],
        queryFn: async () => {
            const response = await fetch("/api/bins", { credentials: "include" });
            if (!response.ok) return [];
            return response.json();
        },
    });

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: async () => {
            const updates = Object.entries(localPermissions).map(([userId, permissions]) => ({
                userId: parseInt(userId),
                permissions,
                binsAssigned: localBins[parseInt(userId)] || [],
            }));

            const response = await fetch("/api/permissions/matrix", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ updates }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Failed to save permissions");
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["permissions-matrix"] });
            setHasChanges(false);
            toast({ title: "Permissions saved", description: "All changes have been saved successfully." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const handlePermissionChange = (userId: number, key: string, value: boolean) => {
        setLocalPermissions((prev) => ({
            ...prev,
            [userId]: { ...(prev[userId] || {}), [key]: value },
        }));
        setHasChanges(true);
    };

    const handleBinToggle = (userId: number, binId: number) => {
        setLocalBins((prev) => {
            const current = prev[userId] || [];
            const updated = current.includes(binId)
                ? current.filter((id) => id !== binId)
                : [...current, binId];
            return { ...prev, [userId]: updated };
        });
        setHasChanges(true);
    };

    const filteredUsers = data?.users.filter((u) => {
        const term = searchTerm.toLowerCase();
        return (
            u.firstname.toLowerCase().includes(term) ||
            u.lastname.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term)
        );
    }) ?? [];

    // Only boolean permissions shown as columns in the matrix
    const booleanPerms = (data?.permissionDefinitions ?? []).filter(
        (d) => d.value_type === "boolean"
    );

    return (
        <AppLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <Button variant="ghost" asChild className="mb-2 -ml-2">
                            <Link to="/user-management">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Users
                            </Link>
                        </Button>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Shield className="w-8 h-8 text-primary" />
                            Permissions Matrix
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage granular permissions and bin access for each user
                        </p>
                    </div>
                    <Button
                        onClick={() => saveMutation.mutate()}
                        disabled={!hasChanges || saveMutation.isPending}
                        className="flex-shrink-0"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {saveMutation.isPending ? "Saving…" : "Save Changes"}
                    </Button>
                </div>

                {/* Legend */}
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                        Check permissions per user. The <strong>Bins Assigned</strong> column controls which bins the user can access.
                        Click <em>Save Changes</em> when done.
                    </span>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="text-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading permissions…</p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <Card className="border-destructive">
                        <CardContent className="pt-6">
                            <p className="text-destructive">Failed to load permissions matrix. Please try again.</p>
                        </CardContent>
                    </Card>
                )}

                {/* Matrix Table */}
                {!isLoading && !error && data && (
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                User Permissions
                                {hasChanges && (
                                    <Badge variant="secondary" className="ml-3">
                                        Unsaved changes
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription>
                                {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="text-left p-3 font-semibold sticky left-0 bg-muted/50 z-10 min-w-[180px]">
                                                User
                                            </th>
                                            {booleanPerms.map((perm) => (
                                                <th
                                                    key={perm.permission_key}
                                                    className="p-3 text-center font-medium text-muted-foreground min-w-[110px] text-xs leading-tight"
                                                    title={perm.description}
                                                >
                                                    {perm.display_name}
                                                </th>
                                            ))}
                                            <th className="p-3 text-center font-medium text-muted-foreground min-w-[160px] text-xs">
                                                Bins Assigned
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={booleanPerms.length + 2}
                                                    className="text-center py-10 text-muted-foreground"
                                                >
                                                    {searchTerm ? "No users match your search" : "No users found"}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredUsers.map((user, idx) => (
                                                <tr
                                                    key={user.id}
                                                    className={`border-b transition-colors hover:bg-accent/30 ${idx % 2 === 0 ? "" : "bg-muted/20"}`}
                                                >
                                                    {/* User info */}
                                                    <td className="p-3 sticky left-0 bg-background z-10">
                                                        <div className="font-medium">
                                                            {user.firstname} {user.lastname}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground truncate max-w-[160px]">
                                                            {user.email}
                                                        </div>
                                                    </td>

                                                    {/* Boolean permission checkboxes */}
                                                    {booleanPerms.map((perm) => {
                                                        const currentVal = localPermissions[user.id]?.[perm.permission_key];
                                                        const isChecked = currentVal === true || currentVal === "true";

                                                        return (
                                                            <td key={perm.permission_key} className="p-3 text-center">
                                                                <Checkbox
                                                                    id={`perm-${user.id}-${perm.permission_key}`}
                                                                    checked={isChecked}
                                                                    onCheckedChange={(checked) =>
                                                                        handlePermissionChange(user.id, perm.permission_key, !!checked)
                                                                    }
                                                                    className="mx-auto"
                                                                />
                                                            </td>
                                                        );
                                                    })}

                                                    {/* Bins assigned */}
                                                    <td className="p-3">
                                                        <div className="flex flex-wrap gap-1 justify-center">
                                                            {allBins.map((bin) => {
                                                                const assigned = (localBins[user.id] || []).includes(bin.id);
                                                                return (
                                                                    <button
                                                                        key={bin.id}
                                                                        type="button"
                                                                        onClick={() => handleBinToggle(user.id, bin.id)}
                                                                        className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${assigned
                                                                                ? "bg-primary text-primary-foreground border-primary"
                                                                                : "bg-background text-muted-foreground border-border hover:border-primary"
                                                                            }`}
                                                                    >
                                                                        {bin.name}
                                                                    </button>
                                                                );
                                                            })}
                                                            {allBins.length === 0 && (
                                                                <span className="text-xs text-muted-foreground">No bins</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
};

export default PermissionsMatrix;
