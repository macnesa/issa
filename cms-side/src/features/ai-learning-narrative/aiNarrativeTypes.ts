import type {
  AiNarrativeResponse,
  AiNarrativeSourceType,
} from "./aiNarrativeSchema";

export type AiNarrativeRequest = {
  dateFrom: string;
  dateTo: string;
  sourceTypes: AiNarrativeSourceType[];
  length: "short" | "medium";
};

export type AiNarrativeData = AiNarrativeResponse["data"];
export type AiNarrativeSection = AiNarrativeData["narrative"]["sections"][number];

export type EditableNarrativeSection = AiNarrativeSection & {
  localId: string;
};
