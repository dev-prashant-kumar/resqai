
import {
  RankedResource,
  ResourceInput,
  ResourceType,
} from "../types/ai.types";

interface RankingOptions {
  recommendedTypes: ResourceType[];
  minimumCapacity?: number;
  requiredSkills?: string[];
}

export function rankResources(
  resources: ResourceInput[],
  options: RankingOptions
): RankedResource[] {
  const results = resources
    .filter(
      (resource) =>
        resource.status === "AVAILABLE" &&
        options.recommendedTypes.includes(resource.resource_type)
    )
    .map((resource) => {
      let score = 45;
      const reasons: string[] = [
        "Resource type matches incident requirements",
      ];

      // Skill matching
      const skills = (resource.skills ?? []).map((skill) =>
        skill.toLowerCase().trim()
      );

      const requiredSkills = (options.requiredSkills ?? []).map((skill) =>
        skill.toLowerCase().trim()
      );

      if (requiredSkills.length > 0) {
        const matchedSkills = requiredSkills.filter((skill) =>
          skills.includes(skill)
        );

        const skillScore =
          (matchedSkills.length / requiredSkills.length) * 25;

        score += skillScore;

        if (matchedSkills.length > 0) {
          reasons.push(`Matched skills: ${matchedSkills.join(", ")}`);
        } else {
          reasons.push("No required skills matched");
        }
      }

      // Capacity matching
      if (options.minimumCapacity !== undefined) {
        if (resource.capacity === null) {
          reasons.push("Capacity information unavailable");
        } else if (resource.capacity >= options.minimumCapacity) {
          score += 15;
          reasons.push("Capacity meets the requested amount");
        } else {
          reasons.push("Capacity is below the requested amount");
        }
      }

      // Distance scoring
      if (
        resource.distanceKm !== null &&
        resource.distanceKm !== undefined
      ) {
        if (resource.distanceKm <= 5) {
          score += 15;
          reasons.push("Located within 5 km");
        } else if (resource.distanceKm <= 15) {
          score += 10;
          reasons.push("Located within 15 km");
        } else if (resource.distanceKm <= 30) {
          score += 5;
          reasons.push("Located within 30 km");
        } else {
          reasons.push("Located more than 30 km away");
        }
      } else {
        reasons.push("Distance not available");
      }

      return {
        id: resource.id,
        name: resource.name,
        resource_type: resource.resource_type,
        score: Math.min(100, Math.round(score)),
        reasons,
        distance_km: resource.distanceKm ?? null,
      };
    });

  return results.sort((a, b) => b.score - a.score);
}
