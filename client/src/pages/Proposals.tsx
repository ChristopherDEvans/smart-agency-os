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
import { Plus, FileText, Calendar, Sparkles, Send, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { PROPOSAL_STATUSES } from "@/const";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function Proposals() {
  const [selectedAgencyId, setSelectedAgencyId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null);

  const { data: agencies } = trpc.agency.list.useQuery();

  useEffect(() => {
    if (agencies && agencies.length > 0 && !selectedAgencyId) {
      setSelectedAgencyId(agencies[0].agency.id);
    }
  }, [agencies, selectedAgencyId]);

  const { data: proposals, isLoading } = trpc.proposal.list.useQuery(
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
          <h1 className="text-3xl font-bold tracking-tight">Proposals</h1>
          <p className="text-muted-foreground mt-1">
            Create AI-powered proposals and track their status
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Proposal
            </Button>
          </DialogTrigger>
          <CreateProposalDialog
            agencyId={selectedAgencyId}
            clients={clients || []}
            onClose={() => setIsCreateDialogOpen(false)}
          />
        </Dialog>
      </div>

      {/* Proposal List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading proposals...</div>
      ) : proposals && proposals.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {proposals.map((item) => (
            <ProposalCard
              key={item.proposal.id}
              proposal={item.proposal}
              client={item.client}
              agencyId={selectedAgencyId}
              onClick={() => setSelectedProposal(item.proposal.id)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No proposals yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Use AI to generate your first proposal
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Proposal
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Proposal Detail Dialog */}
      {selectedProposal && (
        <ProposalDetailDialog
          proposalId={selectedProposal}
          agencyId={selectedAgencyId}
          onClose={() => setSelectedProposal(null)}
        />
      )}
    </div>
  );
}

function ProposalCard({ proposal, client, agencyId, onClick }: any) {
  const statusConfig = PROPOSAL_STATUSES.find((s) => s.value === proposal.status);
  
  const getStatusIcon = () => {
    switch (proposal.status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "sent":
        return <Send className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Card className="hover-lift hover-glow cursor-pointer transition-all" onClick={onClick}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{proposal.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{client.name}</p>
          </div>
          <Badge variant="outline" className={`${statusConfig?.color} flex items-center gap-1`}>
            {getStatusIcon()}
            {statusConfig?.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Created {new Date(proposal.createdAt).toLocaleDateString()}</span>
        </div>
        {proposal.sentAt && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Send className="h-4 w-4" />
            <span>Sent {new Date(proposal.sentAt).toLocaleDateString()}</span>
          </div>
        )}
        {proposal.approvedAt && (
          <div className="flex items-center gap-2 text-sm text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span>Approved {new Date(proposal.approvedAt).toLocaleDateString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProposalDetailDialog({ proposalId, agencyId, onClose }: any) {
  const { data: proposal } = trpc.proposal.get.useQuery({
    proposalId,
    agencyId,
  });

  const utils = trpc.useUtils();
  const updateProposal = trpc.proposal.update.useMutation({
    onSuccess: () => {
      utils.proposal.list.invalidate();
      utils.proposal.get.invalidate({ proposalId, agencyId });
      toast.success("Proposal updated successfully");
    },
  });

  const handleStatusChange = (status: string) => {
    updateProposal.mutate({
      proposalId,
      agencyId,
      status: status as any,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{proposal?.title}</DialogTitle>
          <DialogDescription>
            Proposal details and status management
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {proposal && (
            <>
              <div className="grid gap-3">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="flex gap-2 mt-2">
                    {PROPOSAL_STATUSES.map((status) => (
                      <Button
                        key={status.value}
                        variant={proposal.status === status.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStatusChange(status.value)}
                        disabled={updateProposal.isPending}
                      >
                        {status.label}
                      </Button>
                    ))}
                  </div>
                </div>
                {proposal.brief && (
                  <div>
                    <Label className="text-muted-foreground">Original Brief</Label>
                    <p className="text-sm mt-1 p-3 bg-muted rounded-lg">{proposal.brief}</p>
                  </div>
                )}
                {proposal.content && (
                  <div>
                    <Label className="text-muted-foreground">Proposal Content</Label>
                    <div className="text-sm mt-1 p-3 bg-muted rounded-lg max-h-96 overflow-y-auto">
                      {proposal.content}
                    </div>
                  </div>
                )}
                {!proposal.content && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>AI proposal generation coming soon!</p>
                    <p className="text-xs mt-1">This feature will use LLM to generate proposals</p>
                  </div>
                )}
              </div>
            </>
          )}
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

function CreateProposalDialog({ agencyId, clients, onClose }: any) {
  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");

  const utils = trpc.useUtils();
  const createProposal = trpc.proposal.create.useMutation({
    onSuccess: () => {
      utils.proposal.list.invalidate();
      toast.success("Proposal created successfully");
      onClose();
      setClientId("");
      setTitle("");
      setBrief("");
    },
    onError: (error) => {
      toast.error("Failed to create proposal: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProposal.mutate({
      agencyId,
      clientId: Number(clientId),
      title,
      brief: brief || undefined,
    });
  };

  return (
    <DialogContent className="sm:max-w-[600px]">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate AI Proposal
            </div>
          </DialogTitle>
          <DialogDescription>
            Provide details about the proposal and let AI generate a professional document for you.
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
            <Label htmlFor="title">Proposal Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Q1 2024 Digital Marketing Strategy"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brief">Project Brief</Label>
            <Textarea
              id="brief"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Describe the project scope, objectives, deliverables, timeline, and any specific requirements..."
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              The AI will use this information to generate a comprehensive proposal
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createProposal.isPending}>
            {createProposal.isPending ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Proposal
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
