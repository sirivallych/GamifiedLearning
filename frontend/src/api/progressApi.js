import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

/**
 * Get the logged-in user's progress records.
 * Returns: Array of { trail: {title, status}, module: {title, order}, completionStatus }
 */
export const getMyProgress = async (token) => {
  const response = await axios.get(`${API_BASE_URL}/progress`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
