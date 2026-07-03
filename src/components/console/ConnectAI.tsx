"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { Check, ExternalLink, Loader2, Sparkles, X } from "lucide-react";
import { useMeridian } from "@/lib/store";
import { geminiValidate } from "@/lib/llm";
import { cn } from "@/lib/utils";

export function ConnectAI() {
  const { geminiKey, setGeminiKey } = useMeridian();
  const connected = !!geminiKey;
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const connect = async () => {
    const k = value.trim();
    if (!k) return;
    setBusy(true);
    const ok = await geminiValidate(k);
    setBusy(false);
    if (!ok) {
      toast.error("Couldn't reach Gemini with that key", { description: "Check the key or your rate limit and try again." });
      return;
    }
    setGeminiKey(k);
    setValue("");
    setOpen(false);
    toast.success("Gemini connected", { description: "Runs now write live LLM briefs — key stored only in this browser." });
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          title={connected ? "Gemini connected — manage" : "Connect a free Gemini key for live AI"}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
            connected
              ? "border-ok/35 bg-ok/[0.08] text-ok"
              : "border-hairline bg-surface-1 text-text-dim hover:border-hairline-strong hover:text-text",
          )}
        >
          <Sparkles size={12} />
          {connected ? "AI · Gemini" : "Connect AI"}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[100] w-[460px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-hairline bg-surface-1 p-6 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.35)]">
          <div className="mb-1 flex items-center justify-between">
            <Dialog.Title className="flex items-center gap-2 font-display text-[18px] font-semibold text-text">
              <Sparkles size={17} className="text-signal" /> Live AI synthesis
            </Dialog.Title>
            <Dialog.Close className="flex size-7 items-center justify-center rounded-md text-text-faint hover:bg-surface-2 hover:text-text">
              <X size={15} />
            </Dialog.Close>
          </div>
          <p className="mb-4 text-[13px] leading-relaxed text-text-dim">
            Meridian runs fully on its deterministic core. Connect a{" "}
            <span className="font-medium text-text">free Google Gemini key</span> to have an LLM write the
            executive brief live during a run. The key is sent straight to Google from your browser —{" "}
            <span className="font-medium text-text">never to our server or the repo</span>.
          </p>

          {connected ? (
            <div className="flex items-center justify-between rounded-lg border border-ok/30 bg-ok/[0.06] px-3.5 py-3">
              <span className="flex items-center gap-2 text-[13px] font-medium text-ok">
                <Check size={15} /> Connected · gemini-2.5-flash
              </span>
              <button
                onClick={() => {
                  setGeminiKey(null);
                  toast("Gemini disconnected");
                }}
                className="rounded-md border border-hairline bg-surface-1 px-2.5 py-1 text-[12px] text-text-dim hover:text-text"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <>
              <input
                type="password"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && connect()}
                placeholder="Paste your Gemini API key (AIza…)"
                className="w-full rounded-lg border border-hairline bg-surface-2 px-3.5 py-2.5 font-mono text-[13px] text-text outline-none placeholder:text-text-faint focus-visible:border-signal"
              />
              <div className="mt-3 flex items-center justify-between">
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[12px] text-signal hover:underline"
                >
                  Get a free key <ExternalLink size={11} />
                </a>
                <button
                  onClick={connect}
                  disabled={busy || !value.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-text px-4 py-2 text-[13px] font-semibold text-ink hover:opacity-90 disabled:opacity-40"
                >
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={13} />}
                  {busy ? "Verifying…" : "Connect"}
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
