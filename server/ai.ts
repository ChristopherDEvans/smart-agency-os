import { invokeLLM } from "./_core/llm";

/**
 * AI Service for Smart Agency OS
 * Handles all LLM-powered features including proposal and report generation
 */

interface Client {
  name: string;
  industry?: string | null;
  website?: string | null;
}

interface ProposalGenerationInput {
  client: Client;
  title: string;
  brief?: string;
  serviceTier?: string;
  fee?: number;
}

interface ReportGenerationInput {
  client: Client;
  engagement: {
    serviceTier: string;
    fee: number;
    startDate: Date;
  };
  recentActivity?: string[];
  completedTasks?: string[];
}

/**
 * Generate a professional proposal using AI
 */
export async function generateProposal(input: ProposalGenerationInput): Promise<string> {
  const { client, title, brief, serviceTier, fee } = input;

  const systemPrompt = `You are an expert business proposal writer for a digital agency. 
Your task is to create professional, persuasive, and well-structured proposals that win clients.
Use a professional yet approachable tone. Focus on value, outcomes, and clear deliverables.`;

  const userPrompt = `Create a comprehensive business proposal with the following details:

**Proposal Title:** ${title}

**Client Information:**
- Company: ${client.name}
${client.industry ? `- Industry: ${client.industry}` : ""}
${client.website ? `- Website: ${client.website}` : ""}

${serviceTier ? `**Service Tier:** ${serviceTier}` : ""}
${fee ? `**Proposed Investment:** $${(fee / 100).toLocaleString()}/month` : ""}

${brief ? `**Project Brief:**\n${brief}` : ""}

Please structure the proposal with the following sections:
1. Executive Summary
2. Understanding Your Needs
3. Our Approach & Methodology
4. Scope of Work & Deliverables
5. Timeline & Milestones
6. Investment & Terms
7. Why Choose Us
8. Next Steps

Make it compelling, specific to the client's industry, and focused on delivering measurable value.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content || typeof content !== "string") {
      throw new Error("No content generated from LLM");
    }

    return content;
  } catch (error) {
    console.error("[AI] Proposal generation failed:", error);
    throw new Error("Failed to generate proposal. Please try again.");
  }
}

/**
 * Generate a client report using AI
 */
export async function generateReport(input: ReportGenerationInput): Promise<{
  summary: string;
  risks: string;
  nextSteps: string;
}> {
  const { client, engagement, recentActivity, completedTasks } = input;

  const systemPrompt = `You are an expert client success manager for a digital agency.
Your task is to create clear, honest, and actionable client reports that build trust and demonstrate value.
Be specific, data-driven, and proactive in identifying risks and opportunities.`;

  const userPrompt = `Create a comprehensive client report with the following context:

**Client:** ${client.name}
${client.industry ? `**Industry:** ${client.industry}` : ""}

**Engagement Details:**
- Service Tier: ${engagement.serviceTier}
- Monthly Investment: $${(engagement.fee / 100).toLocaleString()}
- Start Date: ${engagement.startDate.toLocaleDateString()}

${completedTasks && completedTasks.length > 0 ? `**Completed Tasks:**\n${completedTasks.map(t => `- ${t}`).join("\n")}` : ""}

${recentActivity && recentActivity.length > 0 ? `**Recent Activity:**\n${recentActivity.join("\n")}` : ""}

Please provide:

1. **SUMMARY** (2-3 paragraphs):
   - Overview of work completed this period
   - Key achievements and milestones
   - Overall progress assessment

2. **RISKS & CONCERNS** (bullet points):
   - Any blockers or challenges
   - Resource constraints
   - Timeline concerns
   - Budget considerations
   - If none, state "No significant risks identified at this time"

3. **NEXT STEPS** (bullet points):
   - Specific actions planned for next period
   - Upcoming milestones
   - Client action items (if any)
   - Timeline for deliverables

Be honest, specific, and actionable. Focus on value delivered and clear next steps.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content || typeof content !== "string") {
      throw new Error("No content generated from LLM");
    }

    // Parse the response into sections
    const summaryMatch = content.match(/(?:\*\*)?SUMMARY(?:\*\*)?:?\s*([\s\S]*?)(?=(?:\*\*)?RISKS|$)/i);
    const risksMatch = content.match(/(?:\*\*)?RISKS?\s*(?:&|AND)?\s*CONCERNS?(?:\*\*)?:?\s*([\s\S]*?)(?=(?:\*\*)?NEXT\s*STEPS?|$)/i);
    const nextStepsMatch = content.match(/(?:\*\*)?NEXT\s*STEPS?(?:\*\*)?:?\s*([\s\S]*?)$/i);

    const summary = summaryMatch ? summaryMatch[1].trim() : content.split("\n\n")[0] || "Summary not available";
    const risks = risksMatch ? risksMatch[1].trim() : "No significant risks identified at this time";
    const nextSteps = nextStepsMatch ? nextStepsMatch[1].trim() : "Next steps to be determined";

    return {
      summary,
      risks,
      nextSteps,
    };
  } catch (error) {
    console.error("[AI] Report generation failed:", error);
    throw new Error("Failed to generate report. Please try again.");
  }
}

/**
 * Generate suggestions for onboarding tasks based on service tier
 */
export async function generateOnboardingTasks(serviceTier: string, clientIndustry?: string): Promise<string[]> {
  const systemPrompt = `You are an expert project manager for a digital agency.
Generate a practical onboarding checklist for new client engagements.`;

  const userPrompt = `Generate 5-7 specific onboarding tasks for a new client engagement:
- Service Tier: ${serviceTier}
${clientIndustry ? `- Client Industry: ${clientIndustry}` : ""}

Return ONLY a JSON array of task strings, no other text.
Example: ["Task 1", "Task 2", "Task 3"]`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content || typeof content !== "string") {
      throw new Error("No content generated from LLM");
    }
    
    const tasks = JSON.parse(content);
    
    if (!Array.isArray(tasks)) {
      throw new Error("Invalid response format");
    }

    return tasks;
  } catch (error) {
    console.error("[AI] Onboarding task generation failed:", error);
    // Return default tasks as fallback
    return [
      "Kickoff meeting scheduled",
      "Access credentials provided",
      "Brand assets collected",
      "Project goals documented",
      "Communication channels set up",
    ];
  }
}
