import { api } from "./client";

export async function createReview(input: {
  requestId: string;
  rating: number;
  comment?: string;
}) {
  const { data } = await api.post("/reviews", input);
  return data;
}
