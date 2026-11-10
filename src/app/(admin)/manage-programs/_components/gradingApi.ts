import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Grading rubrics ↔ backend (Postman "programs → admin → rubrics"). Each
 * program has two rubrics; the backend weights a submission's criterion
 * scores by them to compute its percent, and won't publish a program until
 * both have at least one criterion.
 */

export type RubricScope = "MiniProject" | "FinalProject";

export type ApiCriterion = {
  id: string;
  programId: string;
  scope: RubricScope;
  order: number;
  title: string;
  description: string | null;
  weightPercent: number;
  maxScore: number;
};

export type CriterionInput = { title: string; description: string; weightPercent: number; maxScore: number };

type ApiProgram = {
  id: string;
  title: string;
  publicationStatus?: string;
  school?: { name: string } | null;
};

const keys = {
  programs: ["manage-programs", "grading", "programs"] as const,
  rubric: (programId: string, scope: RubricScope) => ["manage-programs", "grading", "rubric", programId, scope] as const,
};

/** Every program (drafts included), for the program picker. */
export function useGradingPrograms() {
  return useQuery({
    queryKey: keys.programs,
    queryFn: async () => {
      const all: ApiProgram[] = [];
      for (let page = 1; ; page++) {
        const res = await api<{ items: ApiProgram[]; total: number }>("/programs/admin", { query: { page, pageSize: 100 } });
        all.push(...res.items);
        if (all.length >= res.total || res.items.length === 0) break;
      }
      return all.map((p) => ({ id: p.id, title: p.title, school: p.school?.name ?? "", status: p.publicationStatus ?? "" }));
    },
    staleTime: 5 * 60_000,
  });
}

export function useRubric(programId: string | null, scope: RubricScope) {
  return useQuery({
    queryKey: keys.rubric(programId ?? "", scope),
    queryFn: async () => {
      const list = await api<ApiCriterion[]>(`/programs/admin/${encodeURIComponent(programId!)}/rubrics/${scope}/criteria`);
      return [...list].sort((a, b) => a.order - b.order);
    },
    enabled: !!programId,
  });
}

/** Description is optional: an empty one is left out rather than sent blank. */
const body = (c: CriterionInput) => ({
  title: c.title,
  ...(c.description ? { description: c.description } : {}),
  weightPercent: c.weightPercent,
  maxScore: c.maxScore,
});

export function useSaveCriterion(programId: string, scope: RubricScope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: CriterionInput }) =>
      id
        ? api<ApiCriterion>(`/programs/admin/${encodeURIComponent(programId)}/rubrics/criteria/${encodeURIComponent(id)}`, { method: "PATCH", body: body(input) })
        : api<ApiCriterion>(`/programs/admin/${encodeURIComponent(programId)}/rubrics/${scope}/criteria`, { method: "POST", body: body(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.rubric(programId, scope) }),
  });
}

export function useDeleteCriterion(programId: string, scope: RubricScope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/programs/admin/${encodeURIComponent(programId)}/rubrics/criteria/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.rubric(programId, scope) }),
  });
}

/** Move a criterion up or down (PATCH { order }, 1-based). */
export function useMoveCriterion(programId: string, scope: RubricScope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, order }: { id: string; order: number }) =>
      api(`/programs/admin/${encodeURIComponent(programId)}/rubrics/criteria/${encodeURIComponent(id)}`, { method: "PATCH", body: { order } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.rubric(programId, scope) }),
  });
}
