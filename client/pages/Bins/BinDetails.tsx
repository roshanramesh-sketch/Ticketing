import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, Link } from "react-router-dom";
import AppLayout from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Inbox } from "lucide-react";

interface Bin {
    id: number;
    name: string;
    description: string;
    color: string;
    is_active: boolean;
    manager_name?: string;
    manager_email?: string;
    total_tickets: number;
    open_tickets: number;
    in_progress_tickets: number;
    resolved_tickets: number;
}

// Color options
const BIN_COLORS = [
    { label: "Gray", value: "#6B7280" },
    { label: "Green", value: "#10B981" },
    { label: "Blue", value: "#3B82F6" },
    { label: "Purple", value: "#8B5CF6" },
    { label: "Amber", value: "#F59E0B" },
    { label: "Cyan", value: "#06B6D4" },
    { label: "Red", value: "#EF4444" },
    { label: "Pink", value: "#EC4899" },
    { label: "Orange", value: "#F97316" },
    { label: "Teal", value: "#14B8A6" },
    { label: "Violet", value: "#A855F7" },
    { label: "Lime", value: "#84CC16" },
    { label: "Rose", value: "#F43F5E" },
];

const BinDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        color: "#6B7280",
        isActive: true,
    });

    // Fetch bin details
    const { data: bin, isLoading, error } = useQuery<Bin>({
        queryKey: ["bin", id],
        queryFn: async () => {
            const response = await fetch(`/api/bins/${id}`, {
                credentials: "include",
            });
            if (!response.ok) throw new Error("Failed to fetch bin");
            const data = await response.json();
            // Set form data
            setFormData({
                name: data.name,
                description: data.description || "",
                color: data.color || "#6B7280",
                isActive: data.is_active,
            });
            return data;
        },
        enabled: !!id,
    });

    // Update bin mutation
    const updateMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const response = await fetch(`/api/bins/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    name: data.name,
                    description: data.description,
                    color: data.color,
                    isActive: data.isActive,
                }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to update bin");
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bin", id] });
            queryClient.invalidateQueries({ queryKey: ["bins"] });
            toast({
                title: "Success",
                description: "Bin updated successfully",
            });
            setIsEditing(false);
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(formData);
    };

    if (isLoading) {
        return (
            <AppLayout>
                <div className="p-6 max-w-5xl mx-auto text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading bin details...</p>
                </div>
            </AppLayout>
        );
    }

    if (error || !bin) {
        return (
            <AppLayout>
                <div className="p-6 max-w-5xl mx-auto">
                    <Card className="border-destructive">
                        <CardContent className="pt-6">
                            <p className="text-destructive">Error loading bin. Please try again.</p>
                            <Button asChild className="mt-4">
                                <Link to="/bins">Back to Bins</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="p-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Button variant="ghost" asChild className="mb-4">
                        <Link to="/bins">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Bins
                        </Link>
                    </Button>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div
                                className="w-16 h-16 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: bin.color }}
                            >
                                <Inbox className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">{bin.name}</h1>
                                <p className="text-muted-foreground">{bin.description || "No description"}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Badge variant={bin.is_active ? "default" : "secondary"}>
                                {bin.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {!isEditing && (
                                <Button onClick={() => setIsEditing(true)}>Edit Bin</Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Tickets
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{bin.total_tickets || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Open
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-yellow-600">{bin.open_tickets || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                In Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-blue-600">{bin.in_progress_tickets || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Resolved
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600">{bin.resolved_tickets || 0}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Edit Form */}
                {isEditing && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Edit Bin</CardTitle>
                            <CardDescription>Update bin information</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Bin Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        rows={4}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Bin Color</Label>
                                    <div className="grid grid-cols-7 gap-2">
                                        {BIN_COLORS.map((color) => (
                                            <button
                                                key={color.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, color: color.value })}
                                                className={`w-full aspect-square rounded-lg border-2 transition-all ${formData.color === color.value
                                                        ? "border-primary scale-110"
                                                        : "border-transparent hover:scale-105"
                                                    }`}
                                                style={{ backgroundColor: color.value }}
                                                title={color.label}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="isActive">Active Status</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Inactive bins are hidden from ticket assignment
                                        </p>
                                    </div>
                                    <Switch
                                        id="isActive"
                                        checked={formData.isActive}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, isActive: checked })
                                        }
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <Button type="submit" disabled={updateMutation.isPending}>
                                        <Save className="w-4 h-4 mr-2" />
                                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setIsEditing(false);
                                            // Reset form to original values
                                            if (bin) {
                                                setFormData({
                                                    name: bin.name,
                                                    description: bin.description || "",
                                                    color: bin.color || "#6B7280",
                                                    isActive: bin.is_active,
                                                });
                                            }
                                        }}
                                        disabled={updateMutation.isPending}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Bin Information (when not editing) */}
                {!isEditing && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Bin Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {bin.manager_name && (
                                <div>
                                    <Label>Manager</Label>
                                    <p className="text-sm">{bin.manager_name} ({bin.manager_email})</p>
                                </div>
                            )}
                            <div>
                                <Label>Created</Label>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(bin.created_time).toLocaleDateString()}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
};

export default BinDetails;
