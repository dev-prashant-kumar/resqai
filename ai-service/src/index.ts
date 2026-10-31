import { analyzeIncidentType } from "./services/incidentAnalyzer";
import { recommendResources } from "./services/resourceRecommender";
import { generateResponsePlan } from "./services/responsePlanner";
import { predictSeverity } from "./services/severityPredictor";
import type { IncidentInput } from "./types/ai.types";

export function runIncidentIntelligence(incident: IncidentInput) {
  // 1. Identify incident type
  const detectedType = analyzeIncidentType(incident);

  // 2. Predict severity
  const severityResult = predictSeverity(incident);

  // 3. Recommend suitable resources
  const recommendedResources = recommendResources(
    detectedType,
    incident.medical_required ?? false,
    incident.evacuation_required ?? false
  );

  // 4. Generate response plan
  const responsePlan = generateResponsePlan(
    detectedType,
    severityResult.severity,
    recommendedResources
  );

  return {
    analysis: {
      detected_type: detectedType,
      severity: severityResult.severity,
      risk_score: severityResult.score,
      risk_factors: severityResult.riskFactors,
      recommended_resource_types: recommendedResources,
      analysis_method: "RULE_BASED" as const,
      requires_human_review: true,
    },
    responsePlan,
  };
}