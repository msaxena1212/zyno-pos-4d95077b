import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";

export default function SeedUsers() {
  const [loading, setLoading] = useState(false);

  const seedUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seed-users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Test users created successfully!");
        console.log("Results:", data.results);
      } else {
        toast.error(data.error || "Failed to create users");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to seed users");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Seed Test Users
          </CardTitle>
          <CardDescription>
            Create test users with different roles for testing the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Users to be created:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-secondary rounded">
                <span>admin@retailpro.com</span>
                <span className="text-muted-foreground">System Administrator</span>
              </div>
              <div className="flex justify-between p-2 bg-secondary rounded">
                <span>manager@retailpro.com</span>
                <span className="text-muted-foreground">Store Manager</span>
              </div>
              <div className="flex justify-between p-2 bg-secondary rounded">
                <span>marketing@retailpro.com</span>
                <span className="text-muted-foreground">Marketing Manager</span>
              </div>
              <div className="flex justify-between p-2 bg-secondary rounded">
                <span>stock@retailpro.com</span>
                <span className="text-muted-foreground">Stock Manager</span>
              </div>
              <div className="flex justify-between p-2 bg-secondary rounded">
                <span>cashier@retailpro.com</span>
                <span className="text-muted-foreground">Cashier</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              All users will have the password: <code className="bg-muted px-2 py-1 rounded">Admin123!</code>
            </p>
          </div>

          <Button onClick={seedUsers} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Users...
              </>
            ) : (
              'Create Test Users'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
