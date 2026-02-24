import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Search, User, Mail, Shield } from "lucide-react";

interface UserRole {
    role_name: string;
    display_name: string;
}

interface UserWithRoles {
    id: number;
    email: string;
    firstname: string;
    lastname: string;
    is_active: boolean;
    roles: UserRole[];
    created_time: string;
}

const UsersList = () => {
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch users
    const { data: users, isLoading, error } = useQuery<UserWithRoles[]>({
        queryKey: ["users"],
        queryFn: async () => {
            const response = await fetch("/api/user-management/users", {
                credentials: "include",
            });
            if (!response.ok) throw new Error("Failed to fetch users");
            return response.json();
        },
    });

    const filteredUsers = users?.filter(
        (user) =>
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.lastname.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AppLayout>
            <div className="p-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">User Management</h1>
                    <p className="text-muted-foreground">Manage users and their roles</p>
                </div>

                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link to="/user-management/roles">
                                <Shield className="w-4 h-4 mr-2" />
                                Manage Roles
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link to="/user-management/create">
                                <Plus className="w-4 h-4 mr-2" />
                                Create User
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading users...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <Card className="border-destructive">
                        <CardContent className="pt-6">
                            <p className="text-destructive">Error loading users. Please try again.</p>
                        </CardContent>
                    </Card>
                )}

                {/* Users Table */}
                {filteredUsers && filteredUsers.length > 0 && (
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Roles</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <User className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">
                                                        {user.firstname} {user.lastname}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Mail className="w-4 h-4" />
                                                {user.email}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles && user.roles.length > 0 ? (
                                                    user.roles.map((role) => (
                                                        <Badge key={role.role_name} variant="secondary">
                                                            {role.display_name}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">No roles</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.is_active ? "default" : "secondary"}>
                                                {user.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(user.created_time).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button asChild variant="ghost" size="sm">
                                                    <Link to={`/user-management/${user.id}/roles`}>
                                                        <Shield className="w-4 h-4 mr-1" />
                                                        Roles
                                                    </Link>
                                                </Button>
                                                <Button asChild variant="ghost" size="sm">
                                                    <Link to={`/user-management/${user.id}/edit`}>Edit</Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                )}

                {/* Empty State */}
                {filteredUsers && filteredUsers.length === 0 && !isLoading && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-lg font-semibold mb-2">No users found</h3>
                            <p className="text-muted-foreground mb-4">
                                {searchTerm
                                    ? "Try adjusting your search"
                                    : "Create your first user to get started"}
                            </p>
                            {!searchTerm && (
                                <Button asChild>
                                    <Link to="/user-management/create">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create User
                                    </Link>
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
};

export default UsersList;
