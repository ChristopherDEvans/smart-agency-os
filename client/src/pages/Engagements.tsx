import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Briefcase, DollarSign, Calendar, CheckCircle2, Circle } from "lucide-react";
import { useState, useEffect } from "react";
import { ENGAGEMENT_STATUSES, SERVICE_TIERS } from "@/const";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export default function Engagements() {
  const [selectedAgencyId, setSelectedAgencyId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEngagement, setSelectedEngagement] = useState<number | null>(null);

  const { data: agencies } = trpc.agency.list.useQuery();

  useEffect(() => {
    if (agencies && agencies.length > 0 && !selectedAgencyId) {
      setSelectedAgencyId(agencies[0].agency.id);
    }
  }, [agencies, selectedAgencyId]);

  const { data: engagements, isLoading } = trpc.engagement.list.useQuery(
    { agencyId: selectedAgencyId! },
    { enabled: !!selectedAgencyId }
  );

  const { data: clients } = trpc.clients.list.useQuery(
    { agencyId: selectedAgencyId! },
    { enabled: !!selectedAgencyId }
  );

  if (!selectedAgencyId) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Engagements</h1>
          <p className="text-muted-foreground mt-1">
            Manage client engagements and track onboarding progress
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Engagement
            </Button>
          </DialogTrigger>
          <CreateEngagementDialog
            agencyId={selectedAgencyId}
            clients={clients || []}
            onClose={() => setIsCreateDialogOpen(false)}
          />
        </Dialog>
      </div>

      {/* Engagement List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading engagements...</div>
      ) : engagements && engagements.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {engagements.map((item) => (
            <EngagementCard
              key={item.engagement.id}
              engagement={item.engagement}
              client={item.client}
              agencyId={selectedAgencyId}
              onClick={() => setSelectedEngagement(item.engagement.id)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No engagements yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first engagement to start tracking client work
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Engagement
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Engagement Detail Dialog */}
      {selectedEngagement && (
        <EngagementDetailDialog
          engagementId={selectedEngagement}
          agencyId={selectedAgencyId}
          onClose={() => setSelectedEngagement(null)}
        />
      )}
    </div>
  );
}

function EngagementCard({ engagement, client, agencyId, onClick }: any) {
  const statusConfig = ENGAGEMENT_STATUSES.find((s) => s.value === engagement.status);
  
  const { data: tasks } = trpc.engagement.getTasks.useQuery({
    engagementId: engagement.id,
  });

  const completedTasks = tasks?.filter((t) => t.isDone).length || 0;
  const totalTasks = tasks?.length || 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Card className="hover-lift hover-glow cursor-pointer transition-all" onClick={onClick}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{client.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{engagement.serviceTier}</p>
          </div>
          <Badge variant="outline" className={statusConfig?.color}>
            {statusConfig?.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">${(engagement.fee / 100).toLocaleString()}/mo</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Started {new Date(engagement.startDate).toLocaleDateString()}</span>
        </div>
        {totalTasks > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Onboarding Progress</span>
              <span className="font-medium">{completedTasks}/{totalTasks}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EngagementDetailDialog({ engagementId, agencyId, onClose }: any) {
  const { data: engagement } = trpc.engagement.get.useQuery({
    engagementId,
    agencyId,
  });

  const { data: tasks } = trpc.engagement.getTasks.useQuery({
    engagementId,
  });

  const utils = trpc.useUtils();
  const updateTask = trpc.engagement.updateTask.useMutation({
    onSuccess: () => {
      utils.engagement.getTasks.invalidate({ engagementId });
    },
  });

  const toggleTask = (taskId: number, isDone: boolean) => {
    updateTask.mutate({ taskId, isDone: !isDone });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Engagement Details</DialogTitle>
          <DialogDescription>
            Manage onboarding tasks and track progress
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {engagement && (
            <div className="grid gap-3">
              <div>
                <Label className="text-muted-foreground">Service Tier</Label>
                <p className="font-medium">{engagement.serviceTier}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Monthly Fee</Label>
                <p className="font-medium">${(engagement.fee / 100).toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Start Date</Label>
                <p className="font-medium">{new Date(engagement.startDate).toLocaleDateString()}</p>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Onboarding Checklist</h4>
            <div className="space-y-2">
              {tasks && tasks.length > 0 ? (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => toggleTask(task.id, task.isDone)}
                  >
                    {task.isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                    <span className={task.isDone ? "line-through text-muted-foreground" : ""}>
                      {task.title}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tasks yet
                </p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateEngagementDialog({ agencyId, clients, onClose }: any) {
  const [clientId, setClientId] = useState("");
  const [serviceTier, setServiceTier] = useState("");
  const [fee, setFee] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const utils = trpc.useUtils();
  const createEngagement = trpc.engagement.create.useMutation({
    onSuccess: () => {
      utils.engagement.list.invalidate();
      toast.success("Engagement created successfully");
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to create engagement: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEngagement.mutate({
      agencyId,
      clientId: Number(clientId),
      serviceTier,
      fee: Math.round(parseFloat(fee) * 100), // Convert to cents
      startDate: new Date(startDate),
      notes: notes || undefined,
    });
  };

  return (
    <DialogContent className="sm:max-w-[500px]">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Create New Engagement</DialogTitle>
          <DialogDescription>
            Set up a new client engagement with service details and pricing.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            <Select value={clientId} onValueChange={setClientId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client: any) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="serviceTier">Service Tier *</Label>
            <Select value={serviceTier} onValueChange={setServiceTier} required>
              <SelectTrigger>
                <SelectValue placeholder="Select service tier" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TIERS.map((tier) => (
                  <SelectItem key={tier} value={tier}>
                    {tier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fee">Monthly Fee (USD) *</Label>
            <Input
              id="fee"
              type="number"
              step="0.01"
              min="0"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="5000.00"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date *</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details about this engagement..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createEngagement.isPending}>
            {createEngagement.isPending ? "Creating..." : "Create Engagement"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
