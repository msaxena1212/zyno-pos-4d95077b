import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield } from "lucide-react";

interface Role {
  id: string;
  name: string;
  code: string;
  description: string | null;
  role_level: number;
  status: string;
}

interface Permission {
  id: string;
  name: string;
  code: string;
  module_name: string;
  action_type: string;
}

interface RolePermission {
  permission_id: string;
  permissions: Permission;
}

const Roles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<string, RolePermission[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        supabase.from("roles").select("*").order("role_level", { ascending: false }),
        supabase.from("role_permissions").select("role_id, permission_id, permissions(id, name, code, module_name, action_type)"),
      ]);

      if (rolesRes.error) throw rolesRes.error;
      if (permissionsRes.error) throw permissionsRes.error;

      setRoles(rolesRes.data || []);

      const permMap: Record<string, RolePermission[]> = {};
      permissionsRes.data?.forEach((rp: any) => {
        if (!permMap[rp.role_id]) {
          permMap[rp.role_id] = [];
        }
        permMap[rp.role_id].push({
          permission_id: rp.permission_id,
          permissions: rp.permissions,
        });
      });
      setRolePermissions(permMap);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Role Management</h1>
        <p className="text-muted-foreground">View and manage system roles and permissions</p>
      </div>

      <div className="grid gap-6">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {role.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {role.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>Level {role.role_level}</Badge>
                  <Badge variant={role.status === "active" ? "default" : "secondary"}>
                    {role.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div>
                <h3 className="font-semibold mb-3">Permissions</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {rolePermissions[role.id]?.map((rp) => (
                    <div key={rp.permission_id} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">
                        {rp.permissions.module_name}
                      </Badge>
                      <span className="text-muted-foreground">{rp.permissions.name}</span>
                    </div>
                  )) || <p className="text-muted-foreground">No permissions assigned</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Roles;
