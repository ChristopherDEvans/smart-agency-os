import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Gmail Integration Service using MCP
 * Provides email functionality through the Gmail MCP server
 */

interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  subject: string;
  snippet: string;
  date: string;
  labels: string[];
}

interface GmailThread {
  id: string;
  messages: {
    id: string;
    from: string;
    to: string[];
    subject: string;
    body: string;
    date: string;
  }[];
}

interface SendEmailInput {
  to: string[];
  subject: string;
  content: string;
  cc?: string[];
  bcc?: string[];
}

/**
 * Search Gmail messages
 */
export async function searchMessages(
  query?: string,
  maxResults: number = 50
): Promise<GmailMessage[]> {
  try {
    const input = JSON.stringify({
      q: query,
      max_results: maxResults,
    });

    const { stdout } = await execAsync(
      `manus-mcp-cli tool call gmail_search_messages --server gmail --input '${input}'`
    );

    const result = JSON.parse(stdout);
    
    // Parse the MCP response
    if (result.content && Array.isArray(result.content)) {
      const textContent = result.content.find((c: any) => c.type === "text");
      if (textContent && textContent.text) {
        const data = JSON.parse(textContent.text);
        return data.messages || [];
      }
    }

    return [];
  } catch (error) {
    console.error("[Gmail] Search failed:", error);
    throw new Error("Failed to search Gmail messages");
  }
}

/**
 * Read Gmail thread by ID
 */
export async function readThread(threadId: string): Promise<GmailThread | null> {
  try {
    const input = JSON.stringify({
      thread_ids: [threadId],
      include_full_messages: true,
    });

    const { stdout } = await execAsync(
      `manus-mcp-cli tool call gmail_read_threads --server gmail --input '${input}'`
    );

    const result = JSON.parse(stdout);
    
    if (result.content && Array.isArray(result.content)) {
      const textContent = result.content.find((c: any) => c.type === "text");
      if (textContent && textContent.text) {
        const data = JSON.parse(textContent.text);
        if (data.threads && data.threads.length > 0) {
          return data.threads[0];
        }
      }
    }

    return null;
  } catch (error) {
    console.error("[Gmail] Read thread failed:", error);
    throw new Error("Failed to read Gmail thread");
  }
}

/**
 * Send an email via Gmail
 */
export async function sendEmail(email: SendEmailInput): Promise<boolean> {
  try {
    const input = JSON.stringify({
      messages: [
        {
          to: email.to,
          subject: email.subject,
          content: email.content,
          cc: email.cc,
          bcc: email.bcc,
        },
      ],
    });

    const { stdout } = await execAsync(
      `manus-mcp-cli tool call gmail_send_messages --server gmail --input '${input}'`
    );

    const result = JSON.parse(stdout);
    
    // Check if send was successful
    if (result.content && Array.isArray(result.content)) {
      const textContent = result.content.find((c: any) => c.type === "text");
      if (textContent && textContent.text) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("[Gmail] Send email failed:", error);
    throw new Error("Failed to send email");
  }
}

/**
 * Get recent client emails
 */
export async function getClientEmails(clientEmail: string): Promise<GmailMessage[]> {
  const query = `from:${clientEmail} OR to:${clientEmail}`;
  return searchMessages(query, 20);
}

/**
 * Get unread emails
 */
export async function getUnreadEmails(): Promise<GmailMessage[]> {
  return searchMessages("is:unread", 50);
}
