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
import { Plus, BarChart3, Calendar, Sparkles, Send, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function Reports() {
  const [selectedAgencyId, setSelectedAgencyId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<number | null>(null);

  const { data: agencies } = trpc.agency.list.useQuery();

  useEffect(() => {
    if (agencies && agencies.length > 0 && !selectedAgencyId) {
      setSelectedAgencyId(agencies[0].agency.id);
    }
  }, [agencies, selectedAgencyId]);

  const { data: reports, isLoading } = trpc.report.list.useQuery(
    { agencyId: selectedAgencyId! },
    { enabled: !!selectedAgencyId }
  );

  const { data: engagements } = trpc.engagement.list.useQuery(
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
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Generate AI-powered client reports and track delivery
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </DialogTrigger>
          <CreateReportDialog
            agencyId={selectedAgencyId}
            engagements={engagements || []}
            onClose={() => setIsCreateDialogOpen(false)}
          />
        </Dialog>
      </div>

      {/* Report List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading reports...</div>
      ) : reports && reports.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((item) => (
            <ReportCard
              key={item.report.id}
              report={item.report}
              client={item.client}
              engagement={item.engagement}
              agencyId={selectedAgencyId}
              onClick={() => setSelectedReport(item.report.id)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Use AI to generate your first client report
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Report Detail Dialog */}
      {selectedReport && (
        <ReportDetailDialog
          reportId={selectedReport}
          agencyId={selectedAgencyId}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
}

function ReportCard({ report, client, engagement, agencyId, onClick }: any) {
  return (
    <Card className="hover-lift hover-glow cursor-pointer transition-all" onClick={onClick}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{report.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{client.name}</p>
          </div>
          {report.sentAt ? (
            <Badge variant="outline" className="text-green-400">
              <Send className="h-3 w-3 mr-1" />
              Sent
            </Badge>
          ) : (
            <Badge variant="outline" className="text-yellow-400">
              Draft
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Created {new Date(report.createdAt).toLocaleDateString()}</span>
        </div>
        {report.sentAt && (
          <div className="flex items-center gap-2 text-sm text-green-400">
            <Send className="h-4 w-4" />
            <span>Sent {new Date(report.sentAt).toLocaleDateString()}</span>
          </div>
        )}
        {report.risks && (
          <div className="flex items-center gap-2 text-sm text-orange-400">
            <AlertTriangle className="h-4 w-4" />
            <span>Contains risk items</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReportDetailDialog({ reportId, agencyId, onClose }: any) {
  const { data: report } = trpc.report.get.useQuery({
    reportId,
    agencyId,
  });

  const utils = trpc.useUtils();
  const sendReport = trpc.report.send.useMutation({
    onSuccess: () => {
      utils.report.list.invalidate();
      utils.report.get.invalidate({ reportId, agencyId });
      toast.success("Report marked as sent");
    },
  });

  const handleSend = () => {
    if (confirm("Mark this report as sent to the client?")) {
      sendReport.mutate({ reportId, agencyId });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{report?.title}</DialogTitle>
          <DialogDescription>
            Client report details and delivery status
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {report && (
            <>
              <div className="grid gap-4">
                <div>
                  <Label className="text-muted-foreground font-semibold">Summary</Label>
                  <p className="text-sm mt-2 p-3 bg-muted rounded-lg whitespace-pre-wrap">
                    {report.summary}
                  </p>
                </div>
                {report.risks && (
                  <div>
                    <Label className="text-muted-foreground font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-400" />
                      Risks & Concerns
                    </Label>
                    <p className="text-sm mt-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg whitespace-pre-wrap">
                      {report.risks}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground font-semibold">Next Steps</Label>
                  <p className="text-sm mt-2 p-3 bg-muted rounded-lg whitespace-pre-wrap">
                    {report.nextSteps}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t">
                  <div>
                    <span className="font-medium">Created:</span>{" "}
                    {new Date(report.createdAt).toLocaleDateString()}
                  </div>
                  {report.sentAt && (
                    <div>
                      <span className="font-medium">Sent:</span>{" "}
                      {new Date(report.sentAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {report && !report.sentAt && (
            <Button onClick={handleSend} disabled={sendReport.isPending}>
              <Send className="mr-2 h-4 w-4" />
              Mark as Sent
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateReportDialog({ agencyId, engagements, onClose }: any) {
  const [engagementId, setEngagementId] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [risks, setRisks] = useState("");
  const [nextSteps, setNextSteps] = useState("");

  const utils = trpc.useUtils();
  const createReport = trpc.report.create.useMutation({
    onSuccess: () => {
      utils.report.list.invalidate();
      toast.success("Report created successfully");
      onClose();
      setEngagementId("");
      setTitle("");
      setSummary("");
      setRisks("");
      setNextSteps("");
    },
    onError: (error) => {
      toast.error("Failed to create report: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createReport.mutate({
      agencyId,
      engagementId: Number(engagementId),
      title,
      summary,
      risks: risks || undefined,
      nextSteps,
    });
  };

  return (
    <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate Client Report
            </div>
          </DialogTitle>
          <DialogDescription>
            Create a comprehensive report for your client engagement.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="engagement">Engagement *</Label>
            <Select value={engagementId} onValueChange={setEngagementId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select an engagement" />
              </SelectTrigger>
              <SelectContent>
                {engagements.map((item: any) => (
                  <SelectItem key={item.engagement.id} value={item.engagement.id.toString()}>
                    {item.client.name} - {item.engagement.serviceTier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Report Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Weekly Progress Report - Week of Jan 15"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary">Summary *</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Summarize the work completed, key achievements, and overall progress..."
              rows={4}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="risks">Risks & Concerns</Label>
            <Textarea
              id="risks"
              value={risks}
              onChange={(e) => setRisks(e.target.value)}
              placeholder="Identify any risks, blockers, or concerns that need attention..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nextSteps">Next Steps *</Label>
            <Textarea
              id="nextSteps"
              value={nextSteps}
              onChange={(e) => setNextSteps(e.target.value)}
              placeholder="Outline the planned activities and deliverables for the next period..."
              rows={4}
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 inline mr-1" />
            AI-powered report generation will be available soon to auto-populate these fields based on engagement data
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createReport.isPending}>
            {createReport.isPending ? "Creating..." : "Create Report"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
