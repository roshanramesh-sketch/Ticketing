import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import AppLayout from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Eye, EyeOff, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { validatePassword } from "@/lib/validation";

interface Team {
    id: number;
    name: string;
    description?: string;
}

interface Bin {
    id: number;
    name: string;
    description?: string;
    color?: string;
}

interface FieldErrors {
    email?: string;
    password?: string;
    firstname?: string;
    lastname?: string;
    general?: string;
}

const PasswordRequirement = ({ met, label }: { met: boolean; label: string }) => (
    <div className={`flex items-center gap-2 text-xs transition-colors ${met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
        {met ? <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> : <XCircle className="w-3 h-3 flex-shrink-0" />}
        {label}
    </div>
);

const CreateUser = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [shakeFields, setShakeFields] = useState<Set<string>>(new Set());
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        firstname: "",
        lastname: "",
    });
    const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
    const [selectedBins, setSelectedBins] = useState<number[]>([]);

    // Fetch teams for multi-select
    const { data: teams = [] } = useQuery<Team[]>({
        queryKey: ["teams"],
        queryFn: async () => {
            const response = await fetch("/api/teams", { credentials: "include" });
            if (!response.ok) throw new Error("Failed to fetch teams");
            return response.json();
        },
    });

    // Fetch bins for checkbox list
    const { data: bins = [] } = useQuery<Bin[]>({
        queryKey: ["bins"],
        queryFn: async () => {
            const response = await fetch("/api/bins", { credentials: "include" });
            if (!response.ok) throw new Error("Failed to fetch bins");
            return response.json();
        },
    });

    // Real-time password validation
    const pwValidation = validatePassword(formData.password, formData.email);
    const pwChecks = {
        length: formData.password.length >= 8,
        uppercase: /[A-Z]/.test(formData.password),
        lowercase: /[a-z]/.test(formData.password),
        special: /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;'`~/]/.test(formData.password),
        noEmail:
            !formData.email ||
            formData.email.split("@")[0].length < 3 ||
            !formData.password.toLowerCase().includes(formData.email.split("@")[0].toLowerCase()),
    };

    const triggerShake = (fields: string[]) => {
        const s = new Set(fields);
        setShakeFields(s);
        setTimeout(() => setShakeFields(new Set()), 600);
    };

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData & { teamIds: number[]; binIds: number[] }) => {
            const response = await fetch("/api/user-management/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create user");
            }
            return response.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast({ title: "User created", description: "Redirecting to role assignment…" });
            navigate(`/user-management/${data.id}/roles`);
        },
        onError: (error: Error) => {
            setFieldErrors({ general: error.message });
            triggerShake(["general"]);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const errors: FieldErrors = {};
        const shakeable: string[] = [];

        if (!formData.firstname.trim()) { errors.firstname = "First name is required"; shakeable.push("firstname"); }
        if (!formData.lastname.trim()) { errors.lastname = "Last name is required"; shakeable.push("lastname"); }
        if (!formData.email.trim()) { errors.email = "Email is required"; shakeable.push("email"); }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = "Invalid email format"; shakeable.push("email");
        }

        if (!formData.password) { errors.password = "Password is required"; shakeable.push("password"); }
        else if (!pwValidation.isValid) {
            errors.password = pwValidation.errors[0]; shakeable.push("password");
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            triggerShake(shakeable);
            return;
        }

        setFieldErrors({});
        createMutation.mutate({
            ...formData,
            teamIds: selectedTeams,
            binIds: selectedBins,
        });
    };

    const inputClass = (field: string) =>
        `${fieldErrors[field as keyof FieldErrors] ? "border-destructive ring-destructive focus-visible:ring-destructive" : ""} ${shakeFields.has(field) ? "animate-shake" : ""}`;

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
                    <h1 className="text-3xl font-bold mb-2">Create New User</h1>
                    <p className="text-muted-foreground">Add a new user to the system</p>
                </div>

                {/* Error summary */}
                {fieldErrors.general && (
                    <div className="mb-6 flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {fieldErrors.general}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* User Details Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>User Details</CardTitle>
                            <CardDescription>Basic account information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {/* Name Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstname">
                                        First Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="firstname"
                                        placeholder="John"
                                        value={formData.firstname}
                                        onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                                        className={inputClass("firstname")}
                                    />
                                    {fieldErrors.firstname && (
                                        <p className="text-xs text-destructive">{fieldErrors.firstname}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastname">
                                        Last Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="lastname"
                                        placeholder="Doe"
                                        value={formData.lastname}
                                        onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                                        className={inputClass("lastname")}
                                    />
                                    {fieldErrors.lastname && (
                                        <p className="text-xs text-destructive">{fieldErrors.lastname}</p>
                                    )}
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    Email <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="user@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={inputClass("email")}
                                />
                                {fieldErrors.email && (
                                    <p className="text-xs text-destructive">{fieldErrors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    Password <span className="text-destructive">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Create a strong password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className={inputClass("password")}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Password strength checklist */}
                                {formData.password.length > 0 && (
                                    <div className="grid grid-cols-2 gap-1 mt-2 p-3 bg-muted/50 rounded-lg">
                                        <PasswordRequirement met={pwChecks.length} label="8+ characters" />
                                        <PasswordRequirement met={pwChecks.uppercase} label="Uppercase letter" />
                                        <PasswordRequirement met={pwChecks.lowercase} label="Lowercase letter" />
                                        <PasswordRequirement met={pwChecks.special} label="Special character" />
                                        <PasswordRequirement met={pwChecks.noEmail} label="Not contain email" />
                                    </div>
                                )}

                                {fieldErrors.password && (
                                    <p className="text-xs text-destructive">{fieldErrors.password}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Teams Assignment Card */}
                    {teams.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Team Assignment</CardTitle>
                                <CardDescription>Select teams this user belongs to</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {teams.map((team) => (
                                        <button
                                            key={team.id}
                                            type="button"
                                            onClick={() =>
                                                setSelectedTeams((prev) =>
                                                    prev.includes(team.id)
                                                        ? prev.filter((id) => id !== team.id)
                                                        : [...prev, team.id]
                                                )
                                            }
                                            className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${selectedTeams.includes(team.id)
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-background text-foreground border-border hover:border-primary"
                                                }`}
                                        >
                                            {team.name}
                                        </button>
                                    ))}
                                </div>
                                {selectedTeams.length > 0 && (
                                    <p className="text-xs text-muted-foreground mt-3">
                                        {selectedTeams.length} team{selectedTeams.length !== 1 ? "s" : ""} selected
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Bins Access Card */}
                    {bins.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Bin Access</CardTitle>
                                <CardDescription>Select which bins this user can access</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {bins.map((bin) => (
                                        <div
                                            key={bin.id}
                                            className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                                        >
                                            <Checkbox
                                                id={`bin-${bin.id}`}
                                                checked={selectedBins.includes(bin.id)}
                                                onCheckedChange={(checked) =>
                                                    setSelectedBins((prev) =>
                                                        checked
                                                            ? [...prev, bin.id]
                                                            : prev.filter((id) => id !== bin.id)
                                                    )
                                                }
                                            />
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                {bin.color && (
                                                    <div
                                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: bin.color }}
                                                    />
                                                )}
                                                <Label
                                                    htmlFor={`bin-${bin.id}`}
                                                    className="cursor-pointer text-sm font-medium truncate"
                                                >
                                                    {bin.name}
                                                </Label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {selectedBins.length > 0 && (
                                    <p className="text-xs text-muted-foreground mt-3">
                                        {selectedBins.length} bin{selectedBins.length !== 1 ? "s" : ""} selected
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Note */}
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                            <strong>Note:</strong> After creating the user, you'll be redirected to assign roles.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button type="submit" disabled={createMutation.isPending} className="flex-1">
                            <Save className="w-4 h-4 mr-2" />
                            {createMutation.isPending ? "Creating…" : "Create User"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate("/user-management")}
                            disabled={createMutation.isPending}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};

export default CreateUser;
