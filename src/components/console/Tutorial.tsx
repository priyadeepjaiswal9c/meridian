"use client";

import { useEffect, useState } from "react";
import { X, ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { useMeridian } from "@/lib/store";
import type { CascadeResult } from "@/lib/types";

const steps = ["What am I looking at?", "Choose what goes wrong", "Run the simulation", "Read the impact", "Compare the alternatives", "Change one thing"];
const targets = [null, "scenario", "scenario", "impact", "routes", "scenario"];
const button = "rounded-md border border-hairline px-3 py-2 text-[12px] font-medium hover:bg-surface-2 disabled:opacity-40";

export function Tutorial() {
  const [step, setStep] = useState(0);
  const [reference, setReference] = useState<CascadeResult | null>(null);
  const { running, hasRun, cascade, recommendations, approvedIds, intensity, scenario, phase, agentEvents, run, reset, setIntensity, setTutorialOpen } = useMeridian();

  useEffect(() => {
    const target = targets[step];
    const el = target ? document.querySelector<HTMLElement>(`[data-tour="${target}"]`) : null;
    el?.setAttribute("data-tutorial-active", "true");
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    return () => el?.removeAttribute("data-tutorial-active");
  }, [step, hasRun]);

  const blocked = running || (step === 2 && !hasRun) || (step === 3 && !cascade) || (step === 4 && !approvedIds.length);
  const next = () => {
    if (step === 3) setReference(cascade);
    setStep((s) => Math.min(5, s + 1));
  };
  const rerun = (value: number) => {
    setIntensity(value);
    void run(reference?.scenario.kind ?? "hormuz", value);
  };

  return (
    <aside aria-label="Console tutorial" className="panel pointer-events-auto flex min-h-0 flex-col overflow-y-auto p-5 text-[13px] leading-relaxed">
      <div className="flex items-center justify-between">
        <span className="eyebrow text-signal">Learn the console · {step + 1} / 6</span>
        <button className={button} onClick={() => setTutorialOpen(false)} aria-label="Close tutorial"><X size={14} /></button>
      </div>
      <div className="my-4 flex gap-1" aria-hidden>{steps.map((_, i) => <span key={i} className={`h-1 flex-1 rounded ${i <= step ? "bg-signal" : "bg-hairline"}`} />)}</div>
      <h2 className="font-display text-xl font-semibold">{steps[step]}</h2>
      <div className="my-4 space-y-4 text-text-dim" aria-live="polite">
        {step === 0 && <>
          <p>Meridian asks: <strong className="text-text">if an oil supply route is disrupted, what could happen to India, and where else could we buy from?</strong></p>
          <p>The map shows suppliers, shipping routes and refineries. The right side lets you create a disruption. After a run, the bottom shows alternative routes.</p>
          <p>You will choose a scenario, run it, read the impact, and try a different intensity.</p>
          <p className="rounded-md bg-signal-soft p-3 text-text">This is a prototype simulation. Its formulas and checks use preset assumptions; they are not forecasts or trading instructions.</p>
        </>}
        {step === 1 && <>
          <p><strong className="text-text">On the right, select Hormuz and set intensity to 50%.</strong> Drag the slider, or focus it and use the arrow keys.</p>
          <p>Hormuz affects Gulf shipping. Red Sea affects routes through Bab-el-Mandeb. OPEC+ models a production cut.</p>
          <p>Intensity is the strength of the simulated shock, not the chance it will happen. A higher value generally raises the estimated supply risk and oil price.</p>
          <div className="rounded-md bg-surface-2 p-3">Slider now: <strong>{intensity}%</strong>. Nothing is recalculated until you press <strong>Simulate crisis</strong>.</div>
        </>}
        {step === 2 && <>
          <p><strong className="text-text">Click Simulate crisis on the right.</strong> Wait for the result before continuing.</p>
          <p>The run identifies affected routes, estimates the impact, ranks alternatives and applies demo checks.</p>
          <p>The agent sequence is scripted to show the workflow. The numerical results come from formulas; optional AI only writes a summary.</p>
          <div className="rounded-md bg-surface-2 p-3">{running ? `Running: ${phase ?? "starting"}…` : hasRun ? `Finished: ${scenario.label}, ${scenario.intensity}% intensity.` : "Ready — waiting for your run."}</div>
          {running && <p className="text-xs">{agentEvents.at(-1)?.message}</p>}
        </>}
        {step === 3 && <>
          <p><strong className="text-text">Read Cascade impact on the right.</strong> It links supply risk to oil price, refinery use, pump price, GDP and reserve cover.</p>
          {cascade && <div className="space-y-2 rounded-md bg-surface-2 p-3">
            <p>In this run, <strong>{(cascade.supplyAtRiskBpd / 1e6).toFixed(2)} million barrels/day</strong> remain at risk after the assumed partial rerouting.</p>
            <p>Brent moves from <strong>${cascade.brentBaseline.toFixed(2)} to ${cascade.brentShocked.toFixed(2)}</strong>; reserve cover goes from <strong>{cascade.reserveDaysBaseline.toFixed(1)} to {cascade.reserveDaysAfter.toFixed(1)} days</strong>.</p>
          </div>}
          <p>Scroll that panel and open its assumptions. These explain the calculation. The tutorial will save this run so you can compare it later.</p>
        </>}
        {step === 4 && <>
          <p><strong className="text-text">Look at the route cards at the bottom.</strong> Hover a card to highlight its route on the map.</p>
          <p><strong>Prem.</strong> is extra cost per barrel versus Brent. <strong>Lead</strong> is travel time in days. <strong>Fit</strong> is how suitable the crude is for the refinery.</p>
          <p>The ranking weights cost 42%, travel time 28%, and grade fit 30%. Blocked routes and a preset rejected supplier are removed first.</p>
          <p>The shield percentage is a formula-based score, not a measured success probability. The checks are simulated, not a live compliance clearance.</p>
          <p><strong className="text-text">Click Simulate approval on one card.</strong> This changes the demo state and reduces its risk index by a fixed five points. It sends no order and does not recalculate the impact estimates.</p>
          <div className="rounded-md bg-surface-2 p-3">{recommendations.length} alternatives · {approvedIds.length} approved in this demo</div>
        </>}
        {step === 5 && <>
          <p><strong className="text-text">Keep the same scenario and change only intensity.</strong> Compare 30% with 80% using these buttons, or move the slider and run again.</p>
          <div className="flex gap-2"><button className={button} disabled={running} onClick={() => rerun(30)}>Run at 30%</button><button className={button} disabled={running} onClick={() => rerun(80)}>Run at 80%</button></div>
          {reference && cascade && <table className="w-full text-left text-xs"><caption className="mb-2 text-left">Saved run → current run</caption><thead><tr><th>Measure</th><th>Saved</th><th>Now</th></tr></thead><tbody>
            <tr><th>Scenario</th><td>{reference.scenario.kind}</td><td>{cascade.scenario.kind}</td></tr>
            <tr><th>Intensity</th><td>{reference.scenario.intensity}%</td><td>{cascade.scenario.intensity}%</td></tr>
            <tr><th>Brent</th><td>${reference.brentShocked.toFixed(1)}</td><td>${cascade.brentShocked.toFixed(1)}</td></tr>
            <tr><th>At risk (mb/d)</th><td>{(reference.supplyAtRiskBpd / 1e6).toFixed(2)}</td><td>{(cascade.supplyAtRiskBpd / 1e6).toFixed(2)}</td></tr>
            <tr><th>Reserve days</th><td>{reference.reserveDaysAfter.toFixed(1)}</td><td>{cascade.reserveDaysAfter.toFixed(1)}</td></tr>
          </tbody></table>}
          {running && <p>Running the comparison…</p>}
          <p>To try a different location, choose Red Sea and run again. Route rankings may stay the same when the surviving routes and their relative costs do not change.</p>
        </>}
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-hairline pt-4">
        <button className={button} disabled={step === 0 || running} onClick={() => setStep((s) => s - 1)}><ArrowLeft size={13} className="inline" /> Back</button>
        {step < 5 ? <button className={`${button} text-signal`} disabled={blocked} onClick={next}>Next <ArrowRight size={13} className="inline" /></button> : <button className={button} disabled={running} onClick={() => { reset(); setReference(null); setStep(0); }}><RotateCcw size={13} className="inline" /> Restart</button>}
      </div>
      {blocked && !running && <p className="mt-2 text-xs text-text-faint">{step === 4 ? "Approve a route to continue." : "Run a simulation to continue."}</p>}
    </aside>
  );
}
