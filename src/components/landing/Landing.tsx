"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Globe } from "@/components/landing/Globe";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useMeridian } from "@/lib/store";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

// A Brent-like intraday spike path (hand-drawn, viewBox 0 0 600 220)
const BRENT_PATH =
  "M0,150 C40,148 70,152 100,149 C130,146 160,151 190,148 C220,145 250,150 280,147 " +
  "C300,145 315,146 330,142 C345,138 355,120 365,88 C372,66 378,54 386,48 " +
  "C394,42 404,44 414,52 C428,63 444,60 460,64 C490,71 520,66 550,70 C570,73 585,70 600,72";

export function Landing() {
  const root = useRef<HTMLDivElement>(null);
  const brentRef = useRef<SVGPathElement>(null);

  // sync theme class → store on mount
  useEffect(() => {
    useMeridian.getState().init();
  }, []);

  // Lenis smooth scroll, driven by GSAP's ticker (single clock; ScrollTrigger stays in sync)
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.11 });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  useGSAP(
    () => {
      // ── top progress bar ─────────────────────────────────────────────────
      gsap.to(".progress-bar", {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 0.4 },
      });

      // ── hero: headline chars rise, sub + cue fade in ─────────────────────
      const split = SplitText.create(".hero-h1", { type: "lines,words" });
      gsap.set(".hero-sub, .hero-kicker, .hero-cue, .hero-tags", { opacity: 0, y: 14 });
      gsap
        .timeline({ defaults: { ease: "power4.out" } })
        .from(split.words, { yPercent: 110, opacity: 0, stagger: 0.035, duration: 0.9, delay: 0.15 })
        .to(".hero-kicker", { opacity: 1, y: 0, duration: 0.5 }, "-=0.55")
        .to(".hero-sub", { opacity: 1, y: 0, duration: 0.55 }, "-=0.35")
        .to(".hero-tags", { opacity: 1, y: 0, duration: 0.5 }, "-=0.35")
        .to(".hero-cue", { opacity: 0.7, y: 0, duration: 0.5 }, "-=0.2");

      // scroll cue bob; removed after first scroll
      const bob = gsap.to(".hero-cue-icon", { y: 6, repeat: -1, yoyo: true, duration: 1, ease: "sine.inOut" });
      ScrollTrigger.create({
        trigger: root.current,
        start: "top+=80 top",
        once: true,
        onEnter: () => {
          bob.kill();
          gsap.to(".hero-cue", { opacity: 0, duration: 0.3 });
        },
      });

      // ── stakes: pinned, stats count once ────────────────────────────────
      const stats: { sel: string; to: number; fmt: (n: number) => string }[] = [
        { sel: ".stat-import", to: 88, fmt: (n) => `${Math.round(n)}%` },
        { sel: ".stat-hormuz", to: 42, fmt: (n) => `${Math.round(n)}%` },
        { sel: ".stat-reserve", to: 9.5, fmt: (n) => `${n.toFixed(1)}` },
      ];
      gsap.set(".stat-card", { opacity: 0, y: 26 });
      ScrollTrigger.create({
        trigger: ".sec-stakes",
        start: "top 62%",
        once: true,
        onEnter: () => {
          gsap.to(".stat-card", { opacity: 1, y: 0, stagger: 0.14, duration: 0.55, ease: "power3.out" });
          stats.forEach((s, i) => {
            const counter = { v: 0 };
            const el = root.current?.querySelector<HTMLElement>(s.sel);
            if (!el) return;
            gsap.to(counter, {
              v: s.to,
              duration: 1.15,
              delay: 0.15 + i * 0.15,
              ease: "expo.out",
              onUpdate: () => (el.textContent = s.fmt(counter.v)),
            });
          });
        },
      });
      gsap.from(".stakes-line", {
        opacity: 0,
        y: 18,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: { trigger: ".stakes-line", start: "top 78%", once: true },
      });

      // ── shock: pinned scene — the Brent spike draws itself ──────────────
      const path = brentRef.current;
      if (path) {
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        gsap.set(".shock-dot, .shock-callout", { opacity: 0, scale: 0.6, transformOrigin: "center" });
        gsap.set(".shock-beat", { opacity: 0, y: 22 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ".sec-shock",
            start: "top top",
            end: "+=220%",
            pin: true,
            scrub: 0.6,
          },
        });
        tl.to(path, { strokeDashoffset: len * 0.42, ease: "none", duration: 3 })
          .to(".shock-beat-1", { opacity: 1, y: 0, duration: 0.8 }, 0.6)
          .to(path, { strokeDashoffset: 0, ease: "none", duration: 2.4 })
          .to(".shock-dot", { opacity: 1, scale: 1, duration: 0.5 }, "-=1.2")
          .to(".shock-callout", { opacity: 1, scale: 1, duration: 0.6 }, "-=1.0")
          .to(".shock-beat-2", { opacity: 1, y: 0, duration: 0.8 }, "-=1.2")
          .to(".shock-beat-3", { opacity: 1, y: 0, duration: 0.9 }, "+=0.4")
          .to({}, { duration: 0.8 }); // hold on the payoff

      }

      // ── the loop: pills cascade in ───────────────────────────────────────
      gsap.set(".loop-pill", { opacity: 0, y: 26 });
      gsap.set(".loop-close", { opacity: 0 });
      ScrollTrigger.create({
        trigger: ".sec-loop",
        start: "top 58%",
        once: true,
        onEnter: () => {
          gsap.to(".loop-pill", { opacity: 1, y: 0, stagger: 0.13, duration: 0.55, ease: "power3.out" });
          gsap.to(".loop-close", { opacity: 1, duration: 0.7, delay: 0.75 });
        },
      });

      // ── proof + CTA gentle rises ─────────────────────────────────────────
      gsap.utils.toArray<HTMLElement>(".rise").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 22,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 82%", once: true },
        });
      });

      // ── 3D tilt cards (pointer-tracked perspective) ──────────────────────
      gsap.utils.toArray<HTMLElement>(".tilt").forEach((card) => {
        gsap.set(card, { transformPerspective: 700 });
        const rx = gsap.quickTo(card, "rotationX", { duration: 0.45, ease: "power2.out" });
        const ry = gsap.quickTo(card, "rotationY", { duration: 0.45, ease: "power2.out" });
        card.addEventListener("pointermove", (e) => {
          const r = card.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * 9);
          rx(-((e.clientY - r.top) / r.height - 0.5) * 7);
        });
        card.addEventListener("pointerleave", () => {
          rx(0);
          ry(0);
        });
      });

      // ── magnetic CTA ─────────────────────────────────────────────────────
      const magnet = root.current?.querySelector<HTMLElement>(".magnetic");
      if (magnet) {
        const mx = gsap.quickTo(magnet, "x", { duration: 0.35, ease: "power3.out" });
        const my = gsap.quickTo(magnet, "y", { duration: 0.35, ease: "power3.out" });
        const zone = magnet.parentElement!;
        zone.addEventListener("pointermove", (e) => {
          const r = magnet.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const dx = e.clientX - cx;
          const dy = e.clientY - cy;
          if (Math.hypot(dx, dy) < 140) {
            mx(dx * 0.22);
            my(dy * 0.22);
          } else {
            mx(0);
            my(0);
          }
        });
        zone.addEventListener("pointerleave", () => {
          mx(0);
          my(0);
        });
      }

      // pins measured before fonts load → refresh once ready
      document.fonts?.ready?.then(() => ScrollTrigger.refresh());
    },
    { scope: root },
  );

  return (
    <div ref={root} className="bg-ink text-text">
      {/* progress bar */}
      <div className="progress-bar fixed left-0 top-0 z-50 h-[2px] w-full origin-left scale-x-0 bg-data" />

      {/* theme toggle */}
      <div className="fixed right-5 top-5 z-50">
        <ThemeToggle />
      </div>

      {/* ── 1 · HERO ── */}
      <section className="relative mx-auto grid min-h-dvh max-w-[1200px] items-center gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
        <div>
          <div className="hero-kicker flex items-center gap-2.5">
            <svg width="22" height="22" viewBox="0 0 30 30" fill="none">
              <circle cx="15" cy="15" r="12.5" stroke="#171717" strokeWidth="1.4" />
              <ellipse cx="15" cy="15" rx="5" ry="12.5" stroke="#0f62fe" strokeWidth="1.2" />
              <line x1="2.5" y1="15" x2="27.5" y2="15" stroke="#0f62fe" strokeWidth="1.2" />
            </svg>
            <span className="text-[13px] font-medium text-text-dim">Meridian</span>
            <span className="text-[13px] text-text-faint">· National energy resilience intelligence</span>
          </div>

          <h1 className="hero-h1 mt-7 font-display text-[clamp(40px,5.6vw,72px)] font-semibold leading-[1.04] tracking-tight">
            The world's fifth-largest economy floats on{" "}
            <em className="text-alert not-italic font-display italic">borrowed oil</em>.
          </h1>

          <p className="hero-sub mt-6 max-w-[46ch] text-[17px] leading-relaxed text-text-dim">
            India imports nearly nine of every ten barrels it refines — and much of it sails through
            one strait it doesn't control. Meridian watches the world, models the shock, and answers
            with a verified plan.
          </p>

          <div className="hero-tags mt-7 flex flex-wrap gap-2.5">
            <span className="rounded-full border border-hairline bg-surface-1 px-3.5 py-1.5 font-mono text-[12px] text-text-dim">
              ET AI Hackathon 2.0
            </span>
            <span className="rounded-full border border-hairline bg-surface-1 px-3.5 py-1.5 font-mono text-[12px] text-text-dim">
              Problem #2 · Energy supply-chain resilience
            </span>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <Globe size={560} className="drop-shadow-[0_30px_60px_rgba(30,58,95,0.12)]" />
          <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] text-text-faint">
            Live corridors · red = transits the Strait of Hormuz · drag to spin
          </div>
        </div>

        <div className="hero-cue absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-text-faint">
          <span className="text-[11.5px]">Scroll</span>
          <ChevronDown size={15} className="hero-cue-icon" />
        </div>
      </section>

      {/* ── 2 · THE STAKES ── */}
      <section className="sec-stakes mx-auto max-w-[1200px] px-6 py-[16vh] lg:px-10">
        <div className="eyebrow rise font-mono">01 · The exposure</div>
        <h2 className="rise mt-3 max-w-[24ch] font-display text-[clamp(30px,3.6vw,48px)] font-semibold leading-[1.08]">
          Three numbers decide what a litre of petrol costs in Patna.
        </h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <div className="stat-card tilt panel p-7">
            <div className="stat-import num font-display text-[clamp(48px,5.5vw,72px)] font-semibold leading-none text-data">
              0%
            </div>
            <div className="mt-3 text-[14px] text-text-dim">of India's crude is imported</div>
          </div>
          <div className="stat-card tilt panel p-7">
            <div className="stat-hormuz num font-display text-[clamp(48px,5.5vw,72px)] font-semibold leading-none text-alert">
              0%
            </div>
            <div className="mt-3 text-[14px] text-text-dim">sails through the Strait of Hormuz</div>
          </div>
          <div className="stat-card tilt panel p-7">
            <div className="flex items-baseline gap-1">
              <span className="stat-reserve num font-display text-[clamp(48px,5.5vw,72px)] font-semibold leading-none text-signal">
                0
              </span>
              <span className="font-display text-[clamp(22px,2.4vw,30px)] font-semibold text-signal">days</span>
            </div>
            <div className="mt-3 text-[14px] text-text-dim">of strategic petroleum reserve cover</div>
          </div>
        </div>
        <p className="stakes-line mt-12 max-w-[52ch] text-[19px] leading-relaxed text-text">
          This is not a theoretical risk. It is a structural vulnerability that geopolitics
          stress-tests <em className="font-display italic">every few years</em>.
        </p>
      </section>

      {/* ── 3 · THE SHOCK (pinned) ── */}
      <section className="sec-shock relative flex min-h-dvh items-center bg-surface-1">
        <div className="mx-auto grid w-full max-w-[1200px] items-center gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
          <div>
            <div className="eyebrow font-mono">02 · June 2025 — the stress test</div>
            <h2 className="mt-3 max-w-[20ch] font-display text-[clamp(30px,3.6vw,48px)] font-semibold leading-[1.08]">
              One naval standoff. Eight percent in a session.
            </h2>
            <div className="mt-8 space-y-5">
              <p className="shock-beat shock-beat-1 max-w-[44ch] text-[16.5px] leading-relaxed text-text-dim">
                A US–Iran confrontation put the strait at risk. Brent spiked. Indian refiners
                scrambled onto spot markets at steep premiums.
              </p>
              <p className="shock-beat shock-beat-2 max-w-[44ch] text-[16.5px] leading-relaxed text-text-dim">
                The sensors saw it. The AIS feeds saw it. The price screens saw it.
              </p>
              <p className="shock-beat shock-beat-3 max-w-[44ch] font-display text-[22px] italic leading-snug text-text">
                Every system watched. <span className="text-alert">None of them acted.</span>
              </p>
            </div>
          </div>

          <div className="panel relative p-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="eyebrow">Brent crude · intraday</span>
              <span className="num font-mono text-[11px] text-text-faint">17 Jun 2025</span>
            </div>
            <svg viewBox="0 0 600 220" className="w-full">
              <line x1="0" y1="150" x2="600" y2="150" stroke="#e9eaec" strokeDasharray="4 5" />
              <path
                ref={brentRef}
                d={BRENT_PATH}
                fill="none"
                stroke="var(--color-alert)"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <circle className="shock-dot" cx="386" cy="48" r="4.5" fill="var(--color-alert)" />
              <g className="shock-callout">
                <rect x="404" y="24" width="118" height="34" rx="6" fill="var(--color-text)" />
                <text x="463" y="46" textAnchor="middle" fill="var(--color-ink)" fontSize="15" fontWeight="600">
                  +8% · 1 session
                </text>
              </g>
            </svg>
            <div className="mt-2 flex justify-between font-mono text-[10.5px] text-text-faint">
              <span>09:00</span>
              <span>12:00</span>
              <span>15:00</span>
              <span>18:00</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4 · THE LOOP ── */}
      <section className="sec-loop mx-auto max-w-[1200px] px-6 py-[18vh] lg:px-10">
        <div className="eyebrow rise font-mono">03 · The answer</div>
        <h2 className="rise mt-3 max-w-[22ch] font-display text-[clamp(30px,3.8vw,50px)] font-semibold leading-[1.08]">
          Meridian doesn't watch the storm. It <span className="text-signal">steers the ship</span>.
        </h2>
        <div className="mt-12 grid gap-3.5 md:grid-cols-4">
          {[
            { k: "1 · Sense", cls: "text-signal", t: "Fuse the signals", d: "GDELT news, AIS tracks, prices, sanctions — read continuously." },
            { k: "2 · Reason", cls: "text-data", t: "Model the cascade", d: "Shock → crude → refinery runs → pump price → GDP. Auditable." },
            { k: "3 · Act", cls: "text-ok", t: "Rank the reroutes", d: "Alternative corridors scored on cost, lead time, grade fit." },
            { k: "4 · Verify", cls: "text-warn", t: "Audit before action", d: "Compliance, logistics, finance — checked before a human sees it." },
          ].map((p) => (
            <div key={p.k} className="loop-pill tilt panel p-6">
              <div className={`font-mono text-[11.5px] font-medium ${p.cls}`}>{p.k}</div>
              <div className="mt-2 text-[16px] font-semibold text-text">{p.t}</div>
              <div className="mt-1.5 text-[13.5px] leading-relaxed text-text-dim">{p.d}</div>
            </div>
          ))}
        </div>
        <p className="loop-close mt-10 max-w-[54ch] text-[18px] leading-relaxed text-text-dim">
          In the live demo, the cheapest barrels are <span className="font-semibold text-alert">rejected on a price-cap breach</span> and
          the Hormuz-bypass is promoted — <span className="font-semibold text-text">the loop closes in seconds, with an audit trail</span>.
        </p>
      </section>

      {/* ── 5 · PROOF ── */}
      <section className="border-y border-hairline bg-surface-1">
        <div className="mx-auto grid max-w-[1200px] gap-4 px-6 py-[10vh] md:grid-cols-3 lg:px-10">
          {[
            { n: "~9s", d: "from first signal to a verified, executable plan" },
            { n: "3", d: "reroutes staged per crisis — compliance, logistics, finance checked" },
            { n: "₹10⁴ cr", d: "modelled national cost per sustained shock — the price of reacting late" },
          ].map((c) => (
            <div key={c.d} className="rise">
              <div className="num font-display text-[clamp(38px,4vw,54px)] font-semibold leading-none text-text">{c.n}</div>
              <div className="mt-2.5 max-w-[30ch] text-[13.5px] leading-relaxed text-text-dim">{c.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6 · CTA ── */}
      <section className="relative mx-auto flex min-h-[88vh] max-w-[1200px] flex-col items-start justify-center px-6 lg:px-10">
        <div className="eyebrow rise font-mono">04 · Act II</div>
        <h2 className="rise mt-3 font-display text-[clamp(40px,6vw,80px)] font-semibold leading-[1.02] tracking-tight">
          See it <em className="italic text-signal">steer</em>.
        </h2>
        <p className="rise mt-5 max-w-[46ch] text-[17px] leading-relaxed text-text-dim">
          Open the console, fire a Hormuz closure, and watch Meridian sense it, price it, and answer
          it — camera and all.
        </p>
        <div className="rise mt-9 flex flex-wrap items-center gap-3.5">
          <Link
            href="/console"
            className="magnetic group flex items-center gap-2.5 rounded-[9px] bg-text px-7 py-3.5 text-[15px] font-semibold text-ink hover:opacity-90"
          >
            Enter the console
            <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <a
            href="/pitch.html"
            target="_blank"
            className="rounded-[9px] border border-hairline bg-surface-1 px-6 py-3.5 text-[15px] font-medium text-text-dim hover:border-hairline-strong hover:text-text"
          >
            Read the pitch deck
          </a>
        </div>
        <div className="absolute bottom-8 left-6 right-6 flex items-center justify-between border-t border-hairline pt-5 lg:left-10 lg:right-10">
          <span className="text-[12px] text-text-faint">Built for ET AI Hackathon 2.0</span>
          <span className="font-display text-[13px] italic text-text-faint">Meridian</span>
        </div>
      </section>
    </div>
  );
}
