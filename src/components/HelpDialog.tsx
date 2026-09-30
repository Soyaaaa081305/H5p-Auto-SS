import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface HelpDialogProps {
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
}

export function HelpDialog({ labelledBy, onClose, children }: HelpDialogProps) {
  const dialog = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = () =>
      Array.from(
        dialog.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ) ?? [],
      ).filter((node) => node.getClientRects().length > 0);

    (focusable()[0] ?? dialog.current)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close.current();
        return;
      }
      if (event.key !== "Tab") return;

      const nodes = focusable();
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) {
        event.preventDefault();
        dialog.current?.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handleKeyDown, true);
      previous?.focus();
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-zinc-950/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) close.current();
      }}
    >
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative z-[10000] p-6 space-y-5 transition-colors"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
