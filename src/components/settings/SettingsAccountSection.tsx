import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UserCog, KeyRound, Trash2, Eye, EyeOff, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

interface Props {
  user: User;
  isAdmin: boolean;
  onChangePassword: () => void;
  onDeleteAccount: () => void;
}

export function SettingsAccountSection({ user, isAdmin, onChangePassword, onDeleteAccount }: Props) {
  const { toast } = useToast();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pwd)) return "Must include at least 1 capital letter";
    if (!/[a-z]/.test(pwd)) return "Must include at least 1 lowercase letter";
    if (!/[0-9]/.test(pwd)) return "Must include at least 1 number";
    if (!/[^A-Za-z0-9]/.test(pwd)) return "Must include at least 1 special character";
    return null;
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match", variant: "destructive" });
      return;
    }
    const validationError = validatePassword(newPassword);
    if (validationError) {
      toast({ title: "Invalid password", description: validationError, variant: "destructive" });
      return;
    }

    setChangingPassword(true);
    try {
      // Verify current password by signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });
      if (signInError) {
        toast({ title: "Error", description: "Current password is incorrect", variant: "destructive" });
        setChangingPassword(false);
        return;
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      toast({ title: "Password updated", description: "Your password has been changed successfully" });
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update password", variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <UserCog className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Account</CardTitle>
            <CardDescription>Account information and security</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Email */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Email</Label>
          <Input value={user.email || ""} disabled className="bg-muted/50 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Your email cannot be changed here.</p>
        </div>

        <Separator className="bg-border/50" />

        {/* Account Status */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium">Account Status</p>
            <p className="text-xs text-muted-foreground">Your current account role</p>
          </div>
          {isAdmin ? (
            <span className="px-3 py-1 text-xs font-mono bg-destructive/20 text-destructive rounded-full">ADMIN</span>
          ) : (
            <span className="px-3 py-1 text-xs font-mono bg-primary/20 text-primary rounded-full">USER</span>
          )}
        </div>

        {/* Member since */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium">Member Since</p>
            <p className="text-xs text-muted-foreground">
              {user.created_at
                ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                : "Unknown"}
            </p>
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Change Password */}
        {showPasswordForm ? (
          <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-muted/20">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <KeyRound className="w-4 h-4" /> Change Password
              </h3>
              <Button variant="ghost" size="sm" onClick={() => { setShowPasswordForm(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}>
                Cancel
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current-password" className="text-xs">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password-settings" className="text-xs">New Password</Label>
              <Input
                id="new-password-settings"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
              <p className="text-xs text-muted-foreground">
                Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password-settings" className="text-xs">Confirm New Password</Label>
              <Input
                id="confirm-password-settings"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <Button onClick={handleChangePassword} disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword} size="sm">
              {changingPassword ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</> : <><Check className="w-4 h-4 mr-2" />Update Password</>}
            </Button>
          </div>
        ) : null}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {!showPasswordForm && (
            <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(true)}>
              <KeyRound className="w-4 h-4 mr-2" />Change Password
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                <Trash2 className="w-4 h-4 mr-2" />Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All your data, reviews, projects, and preferences will be permanently deleted.
                  To proceed, please contact support.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  I understand, delete my account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
