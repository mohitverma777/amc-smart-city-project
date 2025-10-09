import axios from "axios";

const API_BASE = process.env.REACT_APP_API_GATEWAY_URL || "http://localhost:3000/api/utility-management";

class UtilityService {
  async getUtilitiesOverview() {
    try {
      const res = await axios.get(`${API_BASE}/utilities/overview`);
      return { success: true, data: res.data.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  }

  async getStatistics() {
    try {
      const res = await axios.get(`${API_BASE}/utilities/statistics`);
      return { success: true, data: res.data.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  }
}

export default new UtilityService();
