import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, Users } from "lucide-react";

interface Role {
    id: number;
    role_name: string;
    display_name: string;
    description: string;
    permissions: string[];
    user_count: number;
}

const RolesList = () => {
    // Fetch roles
    const { data: roles, isLoading, error } = useQuery<Role[]>({
        queryKey: ["roles"],
        queryFn: async () => {
            const response = await fetch("/api/user-management/roles", {
                credentials: "include",
            });
            if (!response.ok) throw new Error("Failed to fetch roles");
            return response.json();
        },
    });

    return (
        <AppLayout>
            <div className="p-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Button variant="ghost" asChild className="mb-4">
                        <Link to="/user-management">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Users
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold mb-2">Roles & Permissions</h1>
                    <p className="text-muted-foreground">
                        View roles and their permissions
                    </p>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading roles...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <Card className="border-destructive">
                        <CardContent className="pt-6">
                            <p className="text-destructive">Error loading roles. Please try again.</p>
                        </CardContent>
                    </Card>
                )}

                {/* Roles Grid */}
                {roles && roles.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {roles.map((role) => (
                            <Card key={role.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Shield className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl">{role.display_name}</CardTitle>
                                                <CardDescription>{role.description}</CardDescription>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* User Count */}
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Users className="w-4 h-4" />
                                        <span>{role.user_count || 0} users</span>
                                    </div>

                                    {/* Permissions */}
                                    <div>
                                        <Label className="text-sm font-medium mb-2 block">Permissions:</Label>
                                        <div className="flex flex-wrap gap-1">
                                            {role.permissions && role.permissions.length > 0 ? (
                                                role.permissions.map((permission) => (
                                                    <Badge key={permission} variant="outline" className="text-xs">
                                                        {permission}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-xs text-muted-foreground">No permissions defined</span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Info Note */}
                <Card className="mt-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-6">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                            <strong>Note:</strong> Roles are pre-defined by the system administrator. To assign roles to users, go to the Users page and click "Roles" on any user.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
};

const Label = ({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={className} {...props}>{children}</p>
);

export default RolesList;
