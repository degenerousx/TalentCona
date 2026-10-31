"use client";

import { useState, type FormEvent } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import { Input } from "@/components/shadcn/input";
import { Label } from "@/components/shadcn/label";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Requirements } from "./data";

type RequirementsPanelProps = {
  matching: boolean;
  /** True while results are shown, so Clear is offered. */
  hasResults: boolean;
  onMatch: (requirements: Requirements) => void;
  onClear: () => void;
};

/** The employer's requirements; matching ranks candidates against them. */
export function RequirementsPanel({ matching, hasResults, onMatch, onClear }: RequirementsPanelProps) {
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState("");
  const [years, setYears] = useState("");
  const [location, setLocation] = useState("");

  const skillList = skills.split(",").map((s) => s.trim()).filter(Boolean);
  const canMatch = role.trim() !== "" && skillList.length > 0;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canMatch) return;
    onMatch({ role: role.trim(), skills: skillList, minYearsExperience: Math.max(0, Number(years) || 0), location: location.trim() });
  }

  function clear() {
    setRole("");
    setSkills("");
    setYears("");
    setLocation("");
    onClear();
  }

  return (
    <Card as="section" tone="hairline" aria-labelledby="requirements-title" className="flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-1">
        <h2 id="requirements-title" className="flex items-center gap-2 text-lg leading-7 font-semibold text-ink">
          <Sparkles aria-hidden className="size-5 text-accent" strokeWidth={1.67} />
          Employer Requirements
        </h2>
        <p className="text-sm leading-5 text-slate-500">
          Describe the role, then match candidates by how well their CVs fit. Sample scoring for now — AI matching connects once the backend is ready.
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="req-role" className="text-sm font-normal text-ink">Role</Label>
            <Input id="req-role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Frontend Developer" className="h-[42px] px-3 md:text-sm" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="req-skills" className="text-sm font-normal text-ink">Required skills</Label>
            <Input id="req-skills" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. React, TypeScript, Git" aria-describedby="req-skills-hint" className="h-[42px] px-3 md:text-sm" />
            <p id="req-skills-hint" className="text-xs leading-4 text-slate-500">Separate skills with commas.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="req-years" className="text-sm font-normal text-ink">Minimum experience (years)</Label>
            <Input id="req-years" type="number" min={0} inputMode="numeric" value={years} onChange={(e) => setYears(e.target.value)} placeholder="0" className="h-[42px] px-3 md:text-sm" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="req-location" className="text-sm font-normal text-ink">Location <span className="text-slate-500">(optional)</span></Label>
            <Input id="req-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Lagos" className="h-[42px] px-3 md:text-sm" />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          {hasResults && (
            <Button variant="outline-accent" onClick={clear} disabled={matching} icon={<RotateCcw aria-hidden className="size-4" strokeWidth={1.33} />} className="font-medium">
              Clear
            </Button>
          )}
          <Button
            type="submit"
            variant="accent"
            disabled={!canMatch || matching}
            title={canMatch ? undefined : "Enter a role and at least one skill"}
            icon={<Sparkles aria-hidden className={matching ? "size-4 animate-pulse" : "size-4"} strokeWidth={1.33} />}
            className="font-medium"
          >
            {matching ? "Matching…" : "Match Candidates"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
