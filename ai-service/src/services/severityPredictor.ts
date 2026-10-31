
import {
  IncidentInput,
  Severity,
} from "../types/ai.types";

const CRITICAL_INDICATORS = [
  "not breathing",
  "unconscious",
  "severe bleeding",
  "multiple fatalities",
  "people trapped",
  "building collapse",
  "chemical leak",
  "gas leak",
  "major explosion",
];

export function predictSeverity(incident: IncidentInput): {
  severity: Severity;
  score: number;
  riskFactors: string[];
} {
  const text =
    `${incident.title} ${incident.description}`.toLowerCase();

  const riskFactors: string[] = [];
  let score = 0;

  const affected = Math.max(0, incident.affected_people ?? 0);

  if (affected >= 20) {
    score += 35;
    riskFactors.push("20 or more people affected");
  } else if (affected >= 10) {
    score += 25;
    riskFactors.push("10 or more people affected");
  } else if (affected >= 5) {
    score += 15;
    riskFactors.push("Multiple people affected");
  } else if (affected > 0) {
    score += 5;
  }

  if (incident.medical_required) {
    score += 20;
    riskFactors.push("Medical assistance reported");
  }

  if (incident.evacuation_required) {
    score += 25;
    riskFactors.push("Evacuation reported as necessary");
  }

  const criticalMatches = CRITICAL_INDICATORS.filter(
    (keyword) => text.includes(keyword)
  );

  if (criticalMatches.length > 0) {
    score += 30;
    riskFactors.push(
      ...criticalMatches.map(
        (keyword) => `Critical indicator mentioned: ${keyword}`
      )
    );
  }

  score = Math.min(score, 100);

  // A critical indicator always triggers the highest
  // review priority, regardless of the numeric score.
  let severity: Severity;

  if (criticalMatches.length > 0 || score >= 75) {
    severity = "CRITICAL";
  } else if (score >= 50) {
    severity = "HIGH";
  } else if (score >= 25) {
    severity = "MEDIUM";
  } else {
    severity = "LOW";
  }

  return {
    severity,
    score,
    riskFactors,
  };
}
