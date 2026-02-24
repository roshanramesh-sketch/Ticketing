import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { Link } from "react-router-dom";

// Color options for bins
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

const CreateBin = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        color: "#6B7280",
    });

    // Create bin mutation
    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const response = await fetch("/api/bins", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create bin");
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bins"] });
            toast({
                title: "Success",
                description: "Bin created successfully",
            });
            navigate("/bins");
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
        if (!formData.name.trim()) {
            toast({
                title: "Validation Error",
                description: "Bin name is required",
                variant: "destructive",
            });
            return;
        }
        createMutation.mutate(formData);
    };

    return (
        <AppLayout>
            <div className="p-6 max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Button variant="ghost" asChild className="mb-4">
                        <Link to="/bins">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Bins
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold mb-2">Create New Bin</h1>
                    <p className="text-muted-foreground">
                        Create a new bin to organize tickets
                    </p>
                </div>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Bin Details</CardTitle>
                        <CardDescription>
                            Provide information about the new bin
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Bin Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Bin Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., General, Support, Sales"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe the purpose of this bin..."
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                />
                            </div>

                            {/* Color */}
                            <div className="space-y-2">
                                <Label>Bin Color</Label>
                                <div className="grid grid-cols-7 gap-2">
                                    {BIN_COLORS.map((color) => (
                                        <button
                                            key={color.value}
                                            type="button"
                                            onClick={() =>
                                                setFormData({ ...formData, color: color.value })
                                            }
                                            className={`w-full aspect-square rounded-lg border-2 transition-all ${formData.color === color.value
                                                    ? "border-primary scale-110"
                                                    : "border-transparent hover:scale-105"
                                                }`}
                                            style={{ backgroundColor: color.value }}
                                            title={color.label}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Selected: {BIN_COLORS.find((c) => c.value === formData.color)?.label}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="flex-1"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {createMutation.isPending ? "Creating..." : "Create Bin"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate("/bins")}
                                    disabled={createMutation.isPending}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
};

export default CreateBin;
