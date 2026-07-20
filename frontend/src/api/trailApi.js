import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

/**
 * Create a new trail for a topic.
 * Triggers AI generation of the first module — may take a few seconds.
 * Returns: { trail, modules: [firstModule] }
 */
export const createTrail = async (topicId, token) => {
  const response = await axios.post(
    `${API_BASE_URL}/trails`,
    { topicId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

/**
 * Get a trail by its ID, including modules and full concept roadmap.
 * Returns: { trail, modules, concepts }
 */
export const getTrailById = async (trailId, token) => {
  const response = await axios.get(`${API_BASE_URL}/trails/${trailId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
