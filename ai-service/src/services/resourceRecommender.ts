
import {
  IncidentType,
  ResourceType,
} from "../types/ai.types";

export function recommendResources(
  incidentType: IncidentType,
  medicalRequired: boolean,
  evacuationRequired: boolean
): ResourceType[] {
  const recommendations = new Set<ResourceType>();

  switch (incidentType) {
    case "MEDICAL":
    case "ROAD_ACCIDENT":
      recommendations.add("AMBULANCE");
      recommendations.add("MEDICAL_TEAM");
      recommendations.add("EMERGENCY_VEHICLE");
      break;

    case "FIRE":
      recommendations.add("EMERGENCY_VEHICLE");
      recommendations.add("RESCUE_TEAM");
      recommendations.add("AMBULANCE");
      break;

    case "FLOOD":
      recommendations.add("RESCUE_TEAM");
      recommendations.add("EMERGENCY_VEHICLE");
      recommendations.add("SHELTER");
      break;

    case "EVACUATION":
      recommendations.add("RESCUE_TEAM");
      recommendations.add("SHELTER");
      recommendations.add("VOLUNTEER");
      break;

    default:
      recommendations.add("RESCUE_TEAM");
      recommendations.add("EMERGENCY_VEHICLE");
      break;
  }

  if (medicalRequired) {
    recommendations.add("AMBULANCE");
    recommendations.add("MEDICAL_TEAM");
  }

  if (evacuationRequired) {
    recommendations.add("RESCUE_TEAM");
    recommendations.add("SHELTER");
    recommendations.add("VOLUNTEER");
  }

  return Array.from(recommendations);
}
