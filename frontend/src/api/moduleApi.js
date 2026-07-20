import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

/**
 * Get module metadata (title, concept, difficulty, duration, etc.)
 */
export const getModuleById = async (moduleId, token) => {
  const response = await axios.get(`${API_BASE_URL}/modules/${moduleId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

/**
 * Get or generate personalised AI content for a module.
 * Returns: { success, data: { introduction, objective, content, keyPoints, examples, summary } }
 */
export const getModuleContent = async (moduleId, token) => {
  const response = await axios.get(
    `${API_BASE_URL}/modules/${moduleId}/content`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

/**
 * Get or generate comprehensive full notes for a module.
 * Returns: { success, data: { title, sections: [{ heading, content }], gamifiedExamples } }
 */
export const getFullNotes = async (moduleId, token) => {
  const response = await axios.get(
    `${API_BASE_URL}/modules/${moduleId}/full-notes`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};
