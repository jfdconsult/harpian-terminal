// Shared type for the risk questionnaire record. The actual persistence
// lives on hqp-api (/v1/terminal/questionnaire) — see app/api/questionnaire/route.ts
// for why: this app runs on Vercel serverless functions, which have no
// durable local disk.
export interface QuestionnaireRecord {
  clientId: string;
  answeredAt: number;
  answers: number[]; // raw per-question values (1-3), in question order
  score: number; // sum of answers
  profile: "Conservative" | "Moderate" | "Aggressive";
}
