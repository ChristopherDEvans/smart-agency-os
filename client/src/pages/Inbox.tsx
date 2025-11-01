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
import { Plus, Mail, Phone, MessageSquare, Calendar, User } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const COMMUNICATION_TYPES = [
  { value: "email", label: "Email", icon: Mail },
  { value: "call", label: "Phone Call", icon: Phone },
  { value: "meeting", label: "Meeting", icon: MessageSquare },
] as const;

export default function Inbox() {
  const [selectedAgencyId, setSelectedAgencyId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: agencies } = trpc.agency.list.useQuery();

  useEffect(() => {
    if (agencies && agencies.length > 0 && !selectedAgencyId) {
      setSelectedAgencyId(agencies[0].agency.id);
    }
  }, [agencies, selectedAgencyId]);

  const { data: communications, isLoading } = trpc.communication.list.useQuery(
    { agencyId: selectedAgencyId!, limit: 50 },
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
          <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
          <p className="text-muted-foreground mt-1">
            Track all client communications in one place
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Log Communication
            </Button>
          </DialogTrigger>
          <CreateCommunicationDialog
            agencyId={selectedAgencyId}
            clients={clients || []}
            onClose={() => setIsCreateDialogOpen(false)}
          />
        </Dialog>
      </div>

      {/* Communications List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading communications...</div>
      ) : communications && communications.length > 0 ? (
        <div className="space-y-3">
          {communications.map((item) => (
            <CommunicationCard
              key={item.communication.id}
              communication={item.communication}
              client={item.client}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No communications yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start logging client interactions to keep track of all touchpoints
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Log Communication
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CommunicationCard({ communication, client }: any) {
  const typeConfig = COMMUNICATION_TYPES.find((t) => t.value === communication.type);
  const Icon = typeConfig?.icon || MessageSquare;

  return (
    <Card className="hover-glow transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{communication.subject}</CardTitle>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{client.name}</span>
                <span>•</span>
                <Calendar className="h-3 w-3" />
                <span>{new Date(communication.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <Badge variant="outline">{typeConfig?.label}</Badge>
        </div>
      </CardHeader>
      {communication.notes && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">{communication.notes}</p>
        </CardContent>
      )}
    </Card>
  );
}

function CreateCommunicationDialog({ agencyId, clients, onClose }: any) {
  const [clientId, setClientId] = useState("");
  const [type, setType] = useState<"email" | "call" | "meeting">("email");
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0, 16));

  const utils = trpc.useUtils();
  const createCommunication = trpc.communication.create.useMutation({
    onSuccess: () => {
      utils.communication.list.invalidate();
      toast.success("Communication logged successfully");
      onClose();
      setClientId("");
      setType("email");
      setSubject("");
      setNotes("");
      setTimestamp(new Date().toISOString().slice(0, 16));
    },
    onError: (error) => {
      toast.error("Failed to log communication: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCommunication.mutate({
      agencyId,
      clientId: Number(clientId),
      type,
      subject,
      notes: notes || undefined,
      timestamp: new Date(timestamp),
    });
  };

  return (
    <DialogContent className="sm:max-w-[600px]">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Log Communication</DialogTitle>
          <DialogDescription>
            Record a client interaction to keep your team in sync.
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
            <Label htmlFor="type">Type *</Label>
            <Select value={type} onValueChange={(value: any) => setType(value)} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMUNICATION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex items-center gap-2">
                      <t.icon className="h-4 w-4" />
                      {t.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of the communication"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timestamp">Date & Time *</Label>
            <Input
              id="timestamp"
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detailed notes about the conversation..."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createCommunication.isPending}>
            {createCommunication.isPending ? "Logging..." : "Log Communication"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
