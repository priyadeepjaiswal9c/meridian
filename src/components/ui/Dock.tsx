"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Dock — the console panel shell. Every dock is:
 *  · collapsible (chevron) — collapses to its header strip
 *  · enlargeable (⤢) — opens the same content in a large centered dialog
 */
export function Dock({
  eyebrow,
  title,
  right,
  children,
  className,
  bodyClassName,
  defaultOpen = true,
  grow = false,
}: {
  eyebrow: string;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  defaultOpen?: boolean;
  /** fills remaining rail height while open */
  grow?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [big, setBig] = useState(false);

  return (
    <div
      className={cn(
        "panel pointer-events-auto flex flex-col overflow-hidden",
        grow && open ? "min-h-0 flex-1" : "flex-none",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-2.5">
        <button
          onClick={() => setOpen((v) => !v)}
          className="group flex min-w-0 flex-1 items-center gap-2.5 text-left"
          aria-expanded={open}
        >
          <ChevronDown
            size={14}
            className={cn(
              "shrink-0 text-text-faint transition-transform duration-200 group-hover:text-text-dim",
              !open && "-rotate-90",
            )}
          />
          <span className="min-w-0">
            <span className="eyebrow block">{eyebrow}</span>
            <span className="block truncate text-[13.5px] font-semibold text-text">{title}</span>
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          {right}
          <button
            onClick={() => setBig(true)}
            className="flex size-6 items-center justify-center rounded-md text-text-faint hover:bg-surface-2 hover:text-text"
            title="Enlarge"
            aria-label={`Enlarge ${title}`}
          >
            <Maximize2 size={12.5} />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
            className={cn("flex min-h-0 flex-col", grow && "flex-1")}
          >
            <div className={cn("flex min-h-0 flex-1 flex-col", bodyClassName)}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enlarged view */}
      <Dialog.Root open={big} onOpenChange={setBig}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-[2px] data-[state=open]:animate-[rise_0.18s_ease-out]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[85] flex max-h-[84vh] w-[720px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-hairline bg-surface-1 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between border-b border-hairline px-5 py-3.5">
              <div>
                <div className="eyebrow">{eyebrow}</div>
                <Dialog.Title className="text-[15px] font-semibold text-text">{title}</Dialog.Title>
              </div>
              <Dialog.Close
                className="flex size-7 items-center justify-center rounded-md text-text-faint hover:bg-surface-2 hover:text-text"
                aria-label="Close"
              >
                <X size={15} />
              </Dialog.Close>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
