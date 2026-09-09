import { ChatComposer } from "#components/chat-composer";
import { trpc } from "#lib/trpc";
import { useNavigate } from "react-router";

const NewChatPage = () => {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const sendMessage = trpc.chatRouter.sendMessage.useMutation({
    async onSuccess(result) {
      await utils.chatRouter.list.invalidate();
      navigate(`/chats/${result.chat.id}`, {
        replace: true,
      });
    },
  });

  return (
    <section className="mx-auto grid min-h-[70vh] max-w-3xl content-center gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">New chat</h1>

        <p className="mt-2 text-muted-foreground">Ask anything.</p>
      </div>

      <ChatComposer
        pending={sendMessage.isPending}
        onSend={async (content) => {
          await sendMessage.mutateAsync({
            chatId: null,
            clientMessageId: crypto.randomUUID(),
            content,
          });
        }}
      />
      {sendMessage.error && (
        <p className="text-sm text-destructive">{sendMessage.error.message}</p>
      )}
    </section>
  );
};

export default NewChatPage;
