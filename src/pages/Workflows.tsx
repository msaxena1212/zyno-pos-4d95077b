import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface WorkflowTask {
  id: string;
  task_name: string;
  task_type: string;
  status: string;
  due_date: string | null;
  created_at: string;
  assigned_to_user_id: string | null;
  assigned_to_role_id: string | null;
}

const Workflows = () => {
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("workflow_tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("workflow_tasks")
        .update(updates)
        .eq("id", taskId);

      if (error) throw error;

      toast.success("Task updated successfully");
      fetchTasks();
    } catch (error: any) {
      toast.error(error.message || "Failed to update task");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-accent" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Workflow Tasks</h1>
        <p className="text-muted-foreground">Manage and track workflow tasks</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter(t => t.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter(t => t.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter(t => t.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      {task.task_name}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{task.task_type.replace('_', ' ')}</TableCell>
                  <TableCell>
                    <Badge variant={
                      task.status === "completed" ? "default" : 
                      task.status === "in_progress" ? "secondary" : 
                      "outline"
                    }>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {task.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTaskStatus(task.id, 'in_progress')}
                        >
                          Start
                        </Button>
                      )}
                      {task.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => updateTaskStatus(task.id, 'completed')}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
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

export default Workflows;
