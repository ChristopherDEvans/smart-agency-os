import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, Briefcase, AlertCircle, Plus, FileText, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [selectedAgencyId, setSelectedAgencyId] = useState<number | null>(null);

  // Fetch user's agencies
  const { data: agencies, isLoading: agenciesLoading } = trpc.agency.list.useQuery();

  // Set default agency when loaded
  useEffect(() => {
    if (agencies && agencies.length > 0 && !selectedAgencyId) {
      setSelectedAgencyId(agencies[0].agency.id);
    }
  }, [agencies, selectedAgencyId]);

  // Fetch data for selected agency
  const { data: clients } = trpc.clients.list.useQuery(
    { agencyId: selectedAgencyId! },
    { enabled: !!selectedAgencyId }
  );

  const { data: engagements } = trpc.engagement.list.useQuery(
    { agencyId: selectedAgencyId! },
    { enabled: !!selectedAgencyId }
  );

  const { data: proposals } = trpc.proposal.list.useQuery(
    { agencyId: selectedAgencyId! },
    { enabled: !!selectedAgencyId }
  );

  const { data: activities } = trpc.activity.list.useQuery(
    { agencyId: selectedAgencyId!, limit: 10 },
    { enabled: !!selectedAgencyId }
  );

  // Calculate KPIs
  const activeClients = clients?.filter(c => c.status === "active").length || 0;
  const activeEngagements = engagements?.filter(e => e.engagement.status === "active").length || 0;
  const totalMRR = engagements
    ?.filter(e => e.engagement.status === "active")
    .reduce((sum, e) => sum + (e.engagement.fee / 100), 0) || 0;
  const pendingProposals = proposals?.filter(p => p.proposal.status === "sent").length || 0;

  if (agenciesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!agencies || agencies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Welcome to Smart Agency OS</h2>
          <p className="text-muted-foreground">Create your first agency to get started</p>
        </div>
        <CreateAgencyButton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening with your agency.
          </p>
        </div>
        {agencies && agencies.length > 1 && (
          <select
            value={selectedAgencyId || ""}
            onChange={(e) => setSelectedAgencyId(Number(e.target.value))}
            className="px-4 py-2 rounded-lg border bg-background"
          >
            {agencies.map((a) => (
              <option key={a.agency.id} value={a.agency.id}>
                {a.agency.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{activeClients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {clients?.length || 0} total clients
            </p>
          </CardContent>
        </Card>

        <Card className="hover-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${totalMRR.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {activeEngagements} active engagements
            </p>
          </CardContent>
        </Card>

        <Card className="hover-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Engagements</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{activeEngagements}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {engagements?.length || 0} total engagements
            </p>
          </CardContent>
        </Card>

        <Card className="hover-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Proposals</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{pendingProposals}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting client response
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button
              onClick={() => setLocation("/clients")}
              variant="outline"
              className="justify-start h-auto py-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">New Client</div>
                <div className="text-xs text-muted-foreground">Add a new client</div>
              </div>
            </Button>

            <Button
              onClick={() => setLocation("/proposals")}
              variant="outline"
              className="justify-start h-auto py-4"
            >
              <FileText className="mr-2 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Create Proposal</div>
                <div className="text-xs text-muted-foreground">Generate AI proposal</div>
              </div>
            </Button>

            <Button
              onClick={() => setLocation("/reports")}
              variant="outline"
              className="justify-start h-auto py-4"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Send Report</div>
                <div className="text-xs text-muted-foreground">Generate client report</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activities && activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.log.id}
                  className="flex items-start gap-3 text-sm border-b last:border-0 pb-3 last:pb-0"
                >
                  <div className="flex-1">
                    <p className="font-medium">{activity.user.name}</p>
                    <p className="text-muted-foreground">{activity.log.action}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.log.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No recent activity
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CreateAgencyButton() {
  const utils = trpc.useUtils();
  const createAgency = trpc.agency.create.useMutation({
    onSuccess: () => {
      utils.agency.list.invalidate();
    },
  });

  const handleCreate = () => {
    const name = prompt("Enter your agency name:");
    if (name) {
      createAgency.mutate({ name });
    }
  };

  return (
    <Button onClick={handleCreate} size="lg">
      <Plus className="mr-2 h-4 w-4" />
      Create Agency
    </Button>
  );
}
