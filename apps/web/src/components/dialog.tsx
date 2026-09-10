import {
  createContext,
  useContext,
  type ComponentProps,
  type ReactNode,
} from "react";
import { X } from "@agent-platform/ui/components/icons";
import { cn } from "@agent-platform/ui/lib/utils";

type DialogContextValue = {
  onOpenChange: (open: boolean) => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <DialogContext.Provider value={{ onOpenChange }}>
      <div className="fixed inset-0 z-50">
        <div
          aria-hidden="true"
          className="absolute inset-0 cursor-default bg-foreground/20 backdrop-blur-[1px]"
          onClick={() => onOpenChange(false)}
        />
        {children}
      </div>
    </DialogContext.Provider>
  );
}

function DialogContent({ className, children, onKeyDown, ...props }: ComponentProps<"div">) {
  const context = useContext(DialogContext);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        "absolute top-1/2 left-1/2 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border border-border bg-surface p-4 text-foreground shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          context?.onOpenChange(false);
          return;
        }
        onKeyDown?.(event);
      }}
      {...props}
    >
      {children}
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => context?.onOpenChange(false)}
      >
        <X aria-hidden="true" size={15} strokeWidth={1.8} />
      </button>
    </div>
  );
}

function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("grid gap-1", className)} {...props} />;
}

function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center justify-end gap-2", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn("pr-7 text-base font-semibold leading-6", className)} {...props} />;
}

function DialogDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn("text-[13px] leading-5 text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
};
