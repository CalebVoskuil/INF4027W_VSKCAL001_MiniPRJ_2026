"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Save, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthGuard from "@/components/layout/AuthGuard";
import { useAuthStore } from "@/store/authStore";
import { updateUserProfile } from "@/lib/firebase/firestore";
import { updateUserPassword } from "@/lib/firebase/auth";
import { toast } from "sonner";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  age: z.string().optional(),
  location: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      age: user?.demographics?.age?.toString() ?? "",
      location: user?.demographics?.location ?? "",
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        firstName: data.firstName,
        lastName: data.lastName,
        demographics: {
          age: data.age ? parseInt(data.age) : null,
          location: data.location || null,
        },
      });
      setUser({
        ...user,
        firstName: data.firstName,
        lastName: data.lastName,
        demographics: {
          age: data.age ? parseInt(data.age) : null,
          location: data.location || null,
        },
      });
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setChangingPassword(true);
    try {
      await updateUserPassword(newPassword);
      setNewPassword("");
      toast.success("Password changed successfully");
    } catch {
      toast.error("Failed to change password. Please re-login and try again.");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gray-100 rounded-lg">
            <User className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Profile</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="font-semibold mb-4">Personal Information</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input className="mt-1" {...register("firstName")} />
                {errors.firstName && (
                  <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <Label>Last Name</Label>
                <Input className="mt-1" {...register("lastName")} />
                {errors.lastName && (
                  <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Age (optional)</Label>
                <Input className="mt-1" type="number" {...register("age")} />
              </div>
              <div>
                <Label>Location (optional)</Label>
                <Input className="mt-1" placeholder="City, Country" {...register("location")} />
              </div>
            </div>
            <Button
              type="submit"
              disabled={saving}
              className="bg-foreground hover:bg-gray-800 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Change Password
          </h2>
          <div className="flex gap-3">
            <Input
              type="password"
              placeholder="New password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="max-w-xs"
            />
            <Button
              onClick={handlePasswordChange}
              disabled={changingPassword}
              variant="outline"
            >
              {changingPassword ? "Changing..." : "Update Password"}
            </Button>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
