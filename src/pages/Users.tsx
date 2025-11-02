import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: string;
}

interface Role {
  id: string;
  name: string;
  code: string;
}

interface UserRole {
  role_id: string;
  roles: Role;
}

const Users = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, UserRole[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profilesRes, rolesRes, assignmentsRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("roles").select("*").order("name"),
        supabase.from("user_role_assignments").select("user_id, role_id, roles(id, name, code)").eq("status", "active"),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;

      setProfiles(profilesRes.data || []);
      setRoles(rolesRes.data || []);

      const roleMap: Record<string, UserRole[]> = {};
      assignmentsRes.data?.forEach((assignment: any) => {
        if (!roleMap[assignment.user_id]) {
          roleMap[assignment.user_id] = [];
        }
        roleMap[assignment.user_id].push({
          role_id: assignment.role_id,
          roles: assignment.roles,
        });
      });
      setUserRoles(roleMap);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async () => {
    if (!selectedUserId || !selectedRoleId) {
      toast.error("Please select a user and role");
      return;
    }

    try {
      const { data: brandData } = await supabase.from("brands").select("id").eq("code", "RETAIL_PRO").single();
      
      const { error } = await supabase.from("user_role_assignments").insert({
        user_id: selectedUserId,
        role_id: selectedRoleId,
        brand_id: brandData?.id,
      });

      if (error) throw error;

      toast.success("Role assigned successfully");
      setSelectedUserId("");
      setSelectedRoleId("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to assign role");
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users and assign roles</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Shield className="mr-2 h-4 w-4" />
              Assign Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Role to User</DialogTitle>
              <DialogDescription>Select a user and role to assign</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.first_name} {profile.last_name} ({profile.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={assignRole} className="w-full">
                Assign Role
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">
                    {profile.first_name} {profile.last_name}
                  </TableCell>
                  <TableCell>{profile.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 flex-wrap">
                      {userRoles[profile.id]?.map((ur) => (
                        <Badge key={ur.role_id} variant="secondary">
                          {ur.roles.name}
                        </Badge>
                      )) || <span className="text-muted-foreground">No roles assigned</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={profile.status === "active" ? "default" : "secondary"}>
                      {profile.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
