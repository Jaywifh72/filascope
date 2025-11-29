import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  role: "user" | "admin";
  role_id: string;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, created_at");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("id, user_id, role");

      if (rolesError) throw rolesError;

      const usersWithRoles = profiles?.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        return {
          ...profile,
          role: (userRole?.role || "user") as "user" | "admin",
          role_id: userRole?.id || "",
        };
      }) || [];

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRoleChange = async (userId: string, roleId: string, newRole: "user" | "admin") => {
    try {
      if (roleId) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole })
          .eq("id", roleId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "User role updated successfully",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    }
  };

  if (loading || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" asChild>
            <Link to="/admin/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        </div>

        <Card className="bg-card border-border">
          <div className="p-6">
            {loadingUsers ? (
              <div className="text-center text-muted-foreground">Loading users...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-muted/50">
                    <TableHead className="text-foreground">Email</TableHead>
                    <TableHead className="text-foreground">Role</TableHead>
                    <TableHead className="text-foreground">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-border hover:bg-muted/50">
                      <TableCell className="text-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value: "user" | "admin") =>
                            handleRoleChange(user.id, user.role_id, value)
                          }
                        >
                          <SelectTrigger className="w-32 bg-background border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminUsers;
