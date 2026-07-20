import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

/**
 * Get personalised recommendations — concepts to revise, revision modules, AI suggestions.
 * Returns: { conceptsToRevise, suggestedRevision, nextTopics }
 */
export const getRecommendations = async (token) => {
  const response = await axios.get(`${API_BASE_URL}/recommendations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

/**
 * Force-refresh AI recommendations (re-runs LLM analysis).
 * Returns: { conceptsToRevise, suggestedRevision, nextTopics }
 */
export const refreshRecommendations = async (token) => {
  const response = await axios.post(
    `${API_BASE_URL}/recommendations/refresh`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};
