import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Bot, User, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Streamdown } from "streamdown";
import { useAuth } from "@/_core/hooks/useAuth";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function CoPilot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const [selectedAgencyId, setSelectedAgencyId] = useState<number | null>(null);
  const { data: agencies } = trpc.agency.list.useQuery();

  useEffect(() => {
    if (agencies && agencies.length > 0 && !selectedAgencyId) {
      setSelectedAgencyId(agencies[0].agency.id);
    }
  }, [agencies, selectedAgencyId]);

  const chatMutation = trpc.copilot.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
    },
    onError: (error) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I encountered an error: ${error.message}`,
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedAgencyId || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
        timestamp: new Date(),
      },
    ]);

    // Send to AI
    chatMutation.mutate({
      agencyId: selectedAgencyId,
      message: userMessage,
      conversationHistory: messages.slice(-5), // Last 5 messages for context
    });
  };

  const suggestedQuestions = [
    "What's my total MRR?",
    "Show me my active clients",
    "Which engagements need attention?",
    "Summarize my pending proposals",
    "What are my top priorities this week?",
  ];

  const handleSuggestionClick = (question: string) => {
    setInput(question);
  };

  if (!selectedAgencyId) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Co-Pilot</h1>
            <p className="text-muted-foreground mt-1">
              Ask me anything about your agency, clients, and engagements
            </p>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-6">
                <div className="p-4 rounded-full bg-primary/10">
                  <Bot className="h-12 w-12 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold">Welcome, {user?.name}!</h3>
                  <p className="text-muted-foreground max-w-md">
                    I'm your AI assistant. I can help you analyze your business metrics,
                    find client information, and provide insights about your agency.
                  </p>
                </div>
                <div className="space-y-2 w-full max-w-2xl">
                  <p className="text-sm text-muted-foreground text-center mb-3">
                    Try asking me:
                  </p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {suggestedQuestions.map((question, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        className="justify-start h-auto py-3 text-left"
                        onClick={() => handleSuggestionClick(question)}
                      >
                        <Sparkles className="mr-2 h-4 w-4 shrink-0" />
                        <span className="text-sm">{question}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="p-2 rounded-lg bg-primary/10 h-fit shrink-0">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div
                      className={`rounded-lg px-4 py-3 max-w-[80%] ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <Streamdown>{message.content}</Streamdown>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                      <p
                        className={`text-xs mt-2 ${
                          message.role === "user"
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="p-2 rounded-lg bg-primary/10 h-fit shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="p-2 rounded-lg bg-primary/10 h-fit">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div className="rounded-lg px-4 py-3 bg-muted">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about your agency..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
