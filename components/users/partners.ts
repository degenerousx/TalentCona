// Placeholder partner records from the design until the partners API exists.

export type Partner = {
  id: string;
  name: string;
  description: string;
  /** Background of the square logo tile. */
  color: string;
};

export const PARTNERS: Partner[] = [
  { id: "global-finance", name: "Global Finance Ltd.", description: "Providing loan opportunities", color: "#155DFC" },
];
