import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

/**
 * Get all available topics (public endpoint).
 * Returns: Array of { _id, title, description, icon, level, concepts, ... }
 */
export const getTopics = async () => {
  const response = await axios.get(`${API_BASE_URL}/topics`);
  return response.data;
};
