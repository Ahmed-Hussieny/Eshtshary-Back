import axios from 'axios';
import https from 'https';
import { config } from 'dotenv';

config();

class ZoomService {
  constructor() {
    try {
      this.validateEnvVars();
      this.clientId = process.env.ZOOM_CLIENT_ID;
      this.clientSecret = process.env.ZOOM_CLIENT_SECRET;
      this.accountId = process.env.ZOOM_ACCOUNT_ID;

      this.accessToken = null;
      this.tokenExpiration = null;
    } catch (err) {
      console.error('🚨 ZoomService initialization error:', err.message);
      this.disabled = true; // Prevent execution
    }
  }

  validateEnvVars() {
    const requiredVars = ['ZOOM_CLIENT_ID', 'ZOOM_CLIENT_SECRET', 'ZOOM_ACCOUNT_ID'];
    const missing = requiredVars.filter(v => !process.env[v]);

    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }

    console.log('✅ Zoom Service initialized with environment variables');
  }

  async testZoomConnectivity() {
    try {
      await axios.get('https://zoom.us/health', {
        timeout: 10000,
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
          keepAlive: true
        })
      });
      console.log('🌐 Zoom is reachable');
      return true;
    } catch (error) {
      console.warn('⚠️ Primary connectivity test failed:', error.message);
      try {
        await axios.head('https://zoom.us', { timeout: 10000 });
        console.log('🌐 Zoom reachable via fallback');
        return true;
      } catch (fallbackError) {
        console.error('❌ All Zoom connectivity tests failed:', {
          primary: error.message,
          fallback: fallbackError.message
        });
        return false;
      }
    }
  }

  async getAccessToken() {
    if (this.disabled) return null;

    try {
      const canReachZoom = await this.testZoomConnectivity();
      if (!canReachZoom) return null;

      const authString = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const params = new URLSearchParams({
        grant_type: 'account_credentials',
        account_id: this.accountId
      });

      const response = await axios.post(
        'https://zoom.us/oauth/token',
        params.toString(),
        {
          headers: {
            Authorization: `Basic ${authString}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000,
          httpsAgent: new https.Agent({ keepAlive: true })
        }
      );

      if (!response.data.access_token) {
        console.error('❌ Zoom API returned no access token');
        return null;
      }

      this.accessToken = response.data.access_token;
      this.tokenExpiration = Date.now() + response.data.expires_in * 1000;

      console.log('🔑 Zoom access token retrieved');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Zoom token error:', {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      return null;
    }
  }

  async ensureValidToken() {
    if (this.disabled) return false;

    const aboutToExpire = this.tokenExpiration && Date.now() >= this.tokenExpiration - 60000;
    if (!this.accessToken || aboutToExpire) {
      const token = await this.getAccessToken();
      return !!token;
    }
    return true;
  }

  async createMeeting(meetingData = {}) {
    if (this.disabled) return { success: false, message: 'ZoomService is disabled' };

    try {
      const valid = await this.ensureValidToken();
      if (!valid) throw new Error('Invalid or missing Zoom access token');

      const payload = {
        topic: 'Zoom Meeting',
        type: 2,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true
        },
        ...meetingData
      };

      const response = await axios.post(
        'https://api.zoom.us/v2/users/me/meetings',
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      return {
        success: true,
        joinUrl: response.data.join_url,
        startUrl: response.data.start_url,
        meetingId: response.data.id,
        password: response.data.password
      };
    } catch (error) {
      if (error.response?.status === 401) {
        console.warn('🔁 Token expired. Retrying...');
        await this.getAccessToken();
        return this.createMeeting(meetingData);
      }

      console.error('❌ Create Meeting Error:', error.message);
      return { success: false, message: error.message };
    }
  }

  async getMeeting(meetingId) {
    if (this.disabled) return null;

    try {
      const valid = await this.ensureValidToken();
      if (!valid) return null;

      const response = await axios.get(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        {
          headers: { Authorization: `Bearer ${this.accessToken}` },
          timeout: 5000
        }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Get Meeting Error:', error.message);
      return null;
    }
  }

  async updateMeeting(meetingId, updateData) {
    if (this.disabled) return null;

    try {
      const valid = await this.ensureValidToken();
      if (!valid) return null;

      const response = await axios.patch(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Update Meeting Error:', error.message);
      return null;
    }
  }

  async deleteMeeting(meetingId) {
    if (this.disabled) return { success: false };

    try {
      const valid = await this.ensureValidToken();
      if (!valid) return { success: false };

      await axios.delete(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        {
          headers: { Authorization: `Bearer ${this.accessToken}` },
          timeout: 5000
        }
      );

      return { success: true };
    } catch (error) {
      console.error('❌ Delete Meeting Error:', error.message);
      return { success: false };
    }
  }
}

export default ZoomService;
