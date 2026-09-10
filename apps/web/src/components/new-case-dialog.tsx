import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@case-intelligence/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Input } from "@case-intelligence/ui/components/input";
import { Label } from "@case-intelligence/ui/components/label";
import { Textarea } from "@case-intelligence/ui/components/textarea";
import { trpc } from "../lib/trpc";

type NewCaseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewCaseDialog({
  open,
  onOpenChange,
}: NewCaseDialogProps) {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createCase = trpc.caseRouter.create.useMutation({
    async onSuccess(caseItem) {
      await utils.caseRouter.list.invalidate();
      setName("");
      setDescription("");
      onOpenChange(false);
      navigate(`/cases/${caseItem.id}`);
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createCase.mutate({
      name,
      description: description || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New case</DialogTitle>
          <DialogDescription>
            Add a case to your review workspace.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-1.5">
            <Label htmlFor="case-name">Name</Label>
            <Input
              id="case-name"
              autoFocus
              maxLength={160}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Case name"
              required
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="case-description">Description (optional)</Label>
            <Textarea
              id="case-description"
              maxLength={2_000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add context for this case"
            />
          </div>

          {createCase.error && (
            <p role="alert" className="text-[13px] leading-5 text-danger">
              {createCase.error.message}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={createCase.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createCase.isPending || !name.trim()}>
              {createCase.isPending ? "Creating..." : "Create case"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
