import { invokeLLM } from "./_core/llm";
import * as db from "./db";

/**
 * AI Co-Pilot Service
 * Provides intelligent assistance with access to agency data
 */

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CoPilotContext {
  agencyId: number;
  message: string;
  conversationHistory?: Message[];
}

/**
 * Process a user query with full context of their agency data
 */
export async function processQuery(context: CoPilotContext): Promise<string> {
  const { agencyId, message, conversationHistory = [] } = context;

  // Gather agency context
  const [clients, engagements, proposals, reports] = await Promise.all([
    db.getClientsByAgency(agencyId),
    db.getEngagementsByAgency(agencyId),
    db.getProposalsByAgency(agencyId),
    db.getReportsByAgency(agencyId),
  ]);

  // Calculate key metrics
  const activeClients = clients.filter((c) => c.status === "active").length;
  const totalClients = clients.length;
  
  const activeEngagements = engagements.filter(
    (e) => e.engagement.status === "active"
  );
  const totalMRR = activeEngagements.reduce(
    (sum, e) => sum + e.engagement.fee / 100,
    0
  );

  const pendingProposals = proposals.filter(
    (p) => p.proposal.status === "sent"
  ).length;

  const onboardingEngagements = engagements.filter(
    (e) => e.engagement.status === "onboarding"
  );

  // Build context for AI
  const systemPrompt = `You are an AI assistant for Smart Agency OS, helping agency owners manage their business.

You have access to the following data about the user's agency:

**Clients:** ${totalClients} total (${activeClients} active)
${clients.slice(0, 5).map((c) => `- ${c.name} (${c.status}${c.industry ? `, ${c.industry}` : ""})`).join("\n")}
${clients.length > 5 ? `... and ${clients.length - 5} more` : ""}

**Engagements:** ${engagements.length} total (${activeEngagements.length} active)
**Monthly Recurring Revenue (MRR):** $${totalMRR.toLocaleString()}
${activeEngagements.slice(0, 3).map((e) => `- ${e.client.name}: ${e.engagement.serviceTier} - $${(e.engagement.fee / 100).toLocaleString()}/mo`).join("\n")}

**Proposals:** ${proposals.length} total (${pendingProposals} pending)

**Reports:** ${reports.length} total

**Engagements in Onboarding:** ${onboardingEngagements.length}

Your role:
- Answer questions about their business metrics, clients, and engagements
- Provide insights and recommendations
- Help them prioritize work and identify opportunities
- Be concise, helpful, and data-driven
- Use markdown formatting for better readability
- When showing lists or data, use tables or bullet points

If the user asks about specific clients or engagements, reference the data above.
If you don't have enough information to answer accurately, say so and suggest what data would help.`;

  try {
    // Build conversation messages
    const messages: any[] = [{ role: "system", content: systemPrompt }];

    // Add conversation history (last 5 exchanges for context)
    conversationHistory.slice(-10).forEach((msg) => {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    });

    // Add current user message
    messages.push({
      role: "user",
      content: message,
    });

    const response = await invokeLLM({ messages });

    const content = response.choices[0]?.message?.content;

    if (!content || typeof content !== "string") {
      throw new Error("No response from AI");
    }

    return content;
  } catch (error) {
    console.error("[CoPilot] Query processing failed:", error);
    throw new Error("I'm having trouble processing your request. Please try again.");
  }
}

/**
 * Generate quick insights about the agency
 */
export async function generateInsights(agencyId: number): Promise<{
  summary: string;
  recommendations: string[];
}> {
  const [clients, engagements, proposals] = await Promise.all([
    db.getClientsByAgency(agencyId),
    db.getEngagementsByAgency(agencyId),
    db.getProposalsByAgency(agencyId),
  ]);

  const activeClients = clients.filter((c) => c.status === "active").length;
  const prospectClients = clients.filter((c) => c.status === "prospect").length;
  const activeEngagements = engagements.filter(
    (e) => e.engagement.status === "active"
  ).length;
  const onboardingEngagements = engagements.filter(
    (e) => e.engagement.status === "onboarding"
  ).length;
  const pendingProposals = proposals.filter(
    (p) => p.proposal.status === "sent"
  ).length;

  const recommendations: string[] = [];

  if (prospectClients > 0) {
    recommendations.push(
      `You have ${prospectClients} prospect(s). Consider reaching out to move them forward.`
    );
  }

  if (onboardingEngagements > 0) {
    recommendations.push(
      `${onboardingEngagements} engagement(s) in onboarding. Focus on completing their setup tasks.`
    );
  }

  if (pendingProposals > 0) {
    recommendations.push(
      `${pendingProposals} proposal(s) awaiting response. Follow up with clients.`
    );
  }

  if (activeEngagements === 0 && activeClients > 0) {
    recommendations.push(
      `You have active clients but no active engagements. Create engagements to track work.`
    );
  }

  const summary = `You have ${activeClients} active client(s) with ${activeEngagements} active engagement(s).`;

  return { summary, recommendations };
}
