import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Textarea } from "@agent-platform/ui/components/textarea";
import z from "zod";
import { Button } from "@agent-platform/ui/components/button";

const composerSchema = z.object({
  content: z.string().trim().min(1).max(20000),
});

type ComposerForm = z.infer<typeof composerSchema>;

type ChatComposerProps = {
  disabled?: boolean;
  pending?: boolean;
  onSend(content: string): Promise<void>;
};
export function ChatComposer({
  disabled = false,
  pending = false,
  onSend,
}: ChatComposerProps) {
  const form = useForm<ComposerForm>({
    resolver: zodResolver(composerSchema),
    defaultValues: {
      content: "",
    },
  });
  return (
    <form
      className="grid gap-2"
      onSubmit={form.handleSubmit(async ({ content }) => {
        await onSend(content);
        form.reset();
      })}
    >
      <Textarea
        placeholder="Ask anything..."
        disabled={disabled || pending}
        {...form.register("content")}
      />
      {form.formState.errors.content && (
        <p className="text-sm text-destructive">
          {form.formState.errors.content.message}
        </p>
      )}
      <Button className="ml-auto" type="submit" disabled={disabled || pending}>
        {pending ? "Sending..." : "Send"}
      </Button>
    </form>
  );
}
