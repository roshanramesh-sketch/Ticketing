import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Inbox, Users } from "lucide-react";

interface Bin {
    id: number;
    name: string;
    description: string;
    color: string;
    is_active: boolean;
    manager_name?: string;
    manager_email?: string;
    active_tickets: number;
    open_tickets: number;
    in_progress_tickets: number;
}

const BinsList = () => {
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch bins from API
    const { data: bins, isLoading, error } = useQuery<Bin[]>({
        queryKey: ["bins"],
        queryFn: async () => {
            const response = await fetch("/api/bins", {
                credentials: "include",
            });
            if (!response.ok) throw new Error("Failed to fetch bins");
            return response.json();
        },
    });

    const filteredBins = bins?.filter((bin) =>
        bin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bin.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AppLayout>
            <div className="p-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">Bins Management</h1>
                    <p className="text-muted-foreground">
                        Manage ticket bins and organize your workflow
                    </p>
                </div>

                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="Search bins..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button asChild>
                        <Link to="/bins/create">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Bin
                        </Link>
                    </Button>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading bins...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <Card className="border-destructive">
                        <CardContent className="pt-6">
                            <p className="text-destructive">Error loading bins. Please try again.</p>
                        </CardContent>
                    </Card>
                )}

                {/* Bins Grid */}
                {filteredBins && filteredBins.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredBins.map((bin) => (
                            <Link key={bin.id} to={`/bins/${bin.id}`}>
                                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                                    <CardHeader>
                                        <div className="flex items-start justify-between mb-2">
                                            <div
                                                className="w-12 h-12 rounded-lg flex items-center justify-center"
                                                style={{ backgroundColor: bin.color || "#6B7280" }}
                                            >
                                                <Inbox className="w-6 h-6 text-white" />
                                            </div>
                                            <Badge variant={bin.is_active ? "default" : "secondary"}>
                                                {bin.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-xl">{bin.name}</CardTitle>
                                        <CardDescription className="line-clamp-2">
                                            {bin.description || "No description"}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Manager */}
                                        {bin.manager_name && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                                <Users className="w-4 h-4" />
                                                <span>{bin.manager_name}</span>
                                            </div>
                                        )}

                                        {/* Stats */}
                                        <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold">{bin.active_tickets || 0}</div>
                                                <div className="text-xs text-muted-foreground">Total</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-yellow-600">
                                                    {bin.open_tickets || 0}
                                                </div>
                                                <div className="text-xs text-muted-foreground">Open</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-blue-600">
                                                    {bin.in_progress_tickets || 0}
                                                </div>
                                                <div className="text-xs text-muted-foreground">In Progress</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {filteredBins && filteredBins.length === 0 && !isLoading && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Inbox className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-lg font-semibold mb-2">No bins found</h3>
                            <p className="text-muted-foreground mb-4">
                                {searchTerm
                                    ? "Try adjusting your search"
                                    : "Create your first bin to get started"}
                            </p>
                            {!searchTerm && (
                                <Button asChild>
                                    <Link to="/bins/create">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Bin
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

export default BinsList;
