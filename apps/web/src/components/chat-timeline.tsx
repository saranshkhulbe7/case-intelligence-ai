import type { RouterOutputs } from "#lib/trpc-types";

type ChatView = RouterOutputs["chatRouter"]["get"];

type ChatTimelineProps = {
  chat: ChatView;
};

export function ChatTimeline({ chat }: ChatTimelineProps) {
  return (
    <div className="grid p-4">
      {chat.messages.map((message) => {
        const run =
          message.role === "USER"
            ? chat.runs.find((item) => item.triggerMessageId === message.id)
            : null;

        return (
          <div key={message.id} className="grid gap-2">
            <article className="rounded-lg border border-border p-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {message.role === "USER" ? "You" : "Agent"}
              </p>
              <p className="whitespace-nowrap">{message.content}</p>
              {message.role === "ASSISTANT" &&
                message.status === "STREAMING" && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Streaming...
                  </p>
                )}
            </article>
            {run && (
              <div className="ml-6 rounded-md border border-border p-3 text-sm">
                <p>
                  <strong>Run:</strong> {run.status}
                </p>

                {run.events.length > 0 && (
                  <div className="mt-2 grid gap-1 text-muted-foreground">
                    {run.events.map((event) => (
                      <p key={event.id}>{event.message}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
