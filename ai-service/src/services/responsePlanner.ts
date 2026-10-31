
import {
  IncidentType,
  ResponsePlan,
  Severity,
  ResourceType,
} from "../types/ai.types";

export function generateResponsePlan(
  incidentType: IncidentType,
  severity: Severity,
  recommendedResources: ResourceType[]
): ResponsePlan {
  const immediateActions: string[] = [
    "Verify the incident details with the reporting source.",
    "Confirm the incident location and access conditions.",
    "Request operator review before assigning resources.",
  ];

  if (incidentType === "FIRE") {
    immediateActions.push(
      "Ask the operator to verify fire spread and evacuation conditions.",
      "Confirm access routes and potential hazards."
    );
  }

  if (incidentType === "FLOOD") {
    immediateActions.push(
      "Check reported water levels and access restrictions.",
      "Verify whether people are stranded or require evacuation."
    );
  }

  if (incidentType === "ROAD_ACCIDENT") {
    immediateActions.push(
      "Verify the number and condition of affected people.",
      "Check whether traffic control or additional medical support is needed."
    );
  }

  if (incidentType === "MEDICAL") {
    immediateActions.push(
      "Request verification of the reported medical emergency.",
      "Prioritize professional medical assessment."
    );
  }

  if (severity === "HIGH" || severity === "CRITICAL") {
    immediateActions.push(
      "Escalate the incident for immediate human operator review.",
      "Check whether additional response units are required."
    );
  }

  return {
    priority: severity,
    immediate_actions: immediateActions,
    recommended_resources: recommendedResources,
    operator_notes: [
      "This plan is generated from programmed decision rules.",
      "Recommendations require human verification.",
      "A missing resource or location record must not be interpreted as availability.",
    ],
  };
}
