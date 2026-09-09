import { ChatComposer } from "#components/chat-composer";
import { ChatTimeline } from "#components/chat-timeline";
import { trpc } from "#lib/trpc";
import { useParams } from "react-router";
import z from "zod";

const chatIdSchema = z.string().uuid();
export default function ChatPage() {
  const params = useParams<{ chatId: string }>();
  const parsed = chatIdSchema.safeParse(params.chatId);

  if (!parsed.success) {
    return <p className="text-destructive">Invalid chat id.</p>;
  }
  return <ValidChatPage chatId={parsed.data} />;
}

function ValidChatPage({ chatId }: { chatId: string }) {
  const utils = trpc.useUtils();
  const chat = trpc.chatRouter.get.useQuery({
    chatId,
  });

  const sendMessage = trpc.chatRouter.sendMessage.useMutation({
    async onMutate(input) {
      await utils.chatRouter.get.cancel({
        chatId,
      });
      const previous = utils.chatRouter.get.getData({
        chatId,
      });
      const now = new Date();

      utils.chatRouter.get.setData(
        {
          chatId,
        },
        (current) => {
          if (!current) {
            return current;
          }
          return {
            ...current,
            messages: [
              ...current.messages,
              {
                id: input.clientMessageId,
                chatId,
                clientMessageId: input.clientMessageId,
                role: "USER" as const,
                status: "COMPLETED" as const,
                content: input.content,
                streamSequence: 0,
                createdAt: now,
                updatedAt: now,
              },
            ],
          };
        },
      );
      return { previous };
    },
    onError(_error, _input, context) {
      if (context?.previous) {
        utils.chatRouter.get.setData(
          {
            chatId,
          },
          context.previous,
        );
      }
    },
    async onSuccess(result) {
      utils.chatRouter.get.setData(
        {
          chatId,
        },
        (current) => {
          if (!current) {
            return current;
          }
          const messages = current.messages.map((message) =>
            message.clientMessageId === result.message.clientMessageId
              ? result.message
              : message,
          );
          const runs = current.runs.some((run) => run.id === result.run.id)
            ? current.runs
            : [
                ...current.runs,
                {
                  ...result.run,
                  events: [],
                  questionGroups: [],
                },
              ];
          return {
            ...current,
            activeRunId: result.run.id,
            updatedAt: result.chat.updatedAt,
            messages,
            runs,
          };
        },
      );

      await utils.chatRouter.list.invalidate();
    },
  });
  if (chat.isLoading) {
    return <p className="text-muted-foreground">Loading chat...</p>;
  }
  if (chat.error) {
    return <p className="text-destructive">{chat.error.message}</p>;
  }
  if (!chat.data) {
    return null;
  }

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <header>
        <h1 className="text-xl font-semibold">{chat.data.title ?? "Chat"}</h1>
      </header>

      <ChatTimeline chat={chat.data} />

      <div className="sticky bottom-0 bg-background py-4">
        <ChatComposer
          disabled={chat.data.activeRunId !== null}
          pending={sendMessage.isPending}
          onSend={async (content) => {
            await sendMessage.mutateAsync({
              chatId,
              clientMessageId: crypto.randomUUID(),
              content,
            });
          }}
        />

        {chat.data.activeRunId && (
          <p className="mt-2 text-xs text-muted-foreground">
            This Chat already has an active Run.
          </p>
        )}

        {sendMessage.error && (
          <p className="mt-2 text-sm text-destructive">
            {sendMessage.error.message}
          </p>
        )}
      </div>
    </section>
  );
}
