import axios from "axios";
import { config } from "dotenv";
import https from 'https';
import qs from 'querystring';
config();

class ZoomService {
  constructor() {
    this.validateEnvVars();
    this.clientId = process.env.ZOOM_CLIENT_ID;
    this.clientSecret = process.env.ZOOM_CLIENT_SECRET;
    this.accountId = process.env.ZOOM_ACCOUNT_ID;
    this.accessToken = null;
    this.tokenExpiration = null;
  }

  validateEnvVars() {
    const requiredVars = ['ZOOM_CLIENT_ID', 'ZOOM_CLIENT_SECRET', 'ZOOM_ACCOUNT_ID'];
    const missingVars = requiredVars.filter(v => !process.env[v]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    console.log('Zoom Service initialized with:', {
      clientId: this.clientId,
      clientSecret: this.clientSecret ? '***' : 'MISSING',
      accountId: this.accountId
    });
  }

  async testZoomConnectivity() {
    try {
      await axios.get('https://zoom.us', { timeout: 3000 });
      console.log('Zoom domain is reachable');
      return true;
    } catch (err) {
      console.error('Cannot reach zoom.us domain:', err.message);
      throw new Error('Network connectivity issue with Zoom servers');
    }
  }

  async getAccessToken() {
    try {
      await this.testZoomConnectivity();

      const authString = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const params = new URLSearchParams();
      params.append('grant_type', 'account_credentials');
      params.append('account_id', this.accountId.trim());

      const response = await axios.post('https://zoom.us/oauth/token', 
        params.toString(), 
        {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 5000,
          httpsAgent: new https.Agent({ keepAlive: true }),
          proxy: false
        }
      );

      if (!response.data.access_token) {
        throw new Error('No access token received');
      }

      this.accessToken = response.data.access_token;
      this.tokenExpiration = Date.now() + (response.data.expires_in * 1000);
      console.log('Successfully obtained Zoom access token');
      return this.accessToken;
    } catch (error) {
      console.error('Full Zoom OAuth Error:', {
        message: error.message,
        stack: error.stack,
        response: {
          status: error.response?.status,
          headers: error.response?.headers,
          data: error.response?.data
        },
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          data: error.config?.data
        }
      });
      throw new Error('Authentication failed: ' + (error.response?.data?.error || error.message));
    }
  }

  async ensureValidToken() {
    if (!this.accessToken || (this.tokenExpiration && Date.now() >= this.tokenExpiration - 60000)) {
      await this.getAccessToken();
    }
  }

  async createMeeting(meetingData) {
    try {
      await this.ensureValidToken();

      const defaultMeetingData = {
        topic: 'Zoom Meeting',
        type: 2, // Scheduled meeting
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
        defaultMeetingData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      return {
        success: true,
        joinUrl: response.data.join_url,
        meetingId: response.data.id,
        password: response.data.password,
        startUrl: response.data.start_url
      };
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('Token expired, attempting to refresh...');
        await this.getAccessToken();
        return this.createMeeting(meetingData);
      }
      
      console.error('Zoom API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`Failed to create meeting: ${error.response?.data?.message || error.message}`);
    }
  }

  async getMeeting(meetingId) {
    try {
      await this.ensureValidToken();

      const response = await axios.get(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to get meeting:', error.response?.data || error.message);
      throw error;
    }
  }

  async updateMeeting(meetingId, updateData) {
    try {
      await this.ensureValidToken();

      const response = await axios.patch(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to update meeting:', error.response?.data || error.message);
      throw error;
    }
  }

  async deleteMeeting(meetingId) {
    try {
      await this.ensureValidToken();

      await axios.delete(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Failed to delete meeting:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default ZoomService;