import { api } from "./client";

export type ReportTargetType =
  | "PROPERTY"
  | "SERVICE"
  | "USER"
  | "MESSAGE"
  | "REVIEW";

export async function submitReport(input: {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details?: string;
}) {
  const { data } = await api.post("/reports", input);
  return data;
}
