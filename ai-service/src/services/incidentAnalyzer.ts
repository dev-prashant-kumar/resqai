
import {
  IncidentInput,
  IncidentType,
} from "../types/ai.types";

const KEYWORD_MAP: Record<IncidentType, string[]> = {
  FIRE: [
    "fire", "burning", "smoke", "flames",
    "explosion", "building on fire",
  ],
  FLOOD: [
    "flood", "flooding", "waterlogging",
    "heavy rain", "overflow", "drowning",
  ],
  ROAD_ACCIDENT: [
    "accident", "collision", "crash",
    "vehicle", "truck", "bike accident",
  ],
  MEDICAL: [
    "injury", "injured", "unconscious",
    "bleeding", "heart attack", "medical",
  ],
  EVACUATION: [
    "evacuation", "trapped", "rescue",
    "people stranded", "building collapse",
  ],
  OTHER: [],
};

export function analyzeIncidentType(
  incident: IncidentInput
): IncidentType {
  if (incident.incident_type !== "OTHER") {
    return incident.incident_type;
  }

  const text =
    `${incident.title} ${incident.description}`.toLowerCase();

  let bestType: IncidentType = "OTHER";
  let bestScore = 0;

  for (const [type, keywords] of Object.entries(KEYWORD_MAP)) {
    if (type === "OTHER") continue;

    const score = keywords.reduce(
      (total, keyword) =>
        total + (text.includes(keyword) ? 1 : 0),
      0
    );

    if (score > bestScore) {
      bestScore = score;
      bestType = type as IncidentType;
    }
  }

  return bestType;
}
