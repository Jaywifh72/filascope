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
import { UserCog, KeyRound, Trash2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface Props {
  user: User;
  isAdmin: boolean;
  onChangePassword: () => void;
  onDeleteAccount: () => void;
}

export function SettingsAccountSection({ user, isAdmin, onChangePassword, onDeleteAccount }: Props) {
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

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={onChangePassword}>
            <KeyRound className="w-4 h-4 mr-2" />Change Password
          </Button>

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
