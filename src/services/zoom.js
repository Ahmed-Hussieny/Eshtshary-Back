import axios from 'axios';
import https from 'https';
import { config } from 'dotenv';

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
    const missing = requiredVars.filter(v => !process.env[v]);

    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }

    console.log('✅ Zoom Service initialized with environment variables');
  }

async testZoomConnectivity() {
  try {
    // Try with a longer timeout and simpler request
    await axios.get('https://zoom.us/health', {
      timeout: 10000,
      httpsAgent: new https.Agent({ 
        rejectUnauthorized: false, // Temporarily for testing
        keepAlive: true
      })
    });
    console.log('🌐 Zoom is reachable');
    return true;
  } catch (error) {
    console.warn('Primary connectivity test failed, trying alternative...');
    
    // Try a more basic endpoint
    try {
      await axios.head('https://zoom.us', { timeout: 10000 });
      return true;
    } catch (fallbackError) {
      console.error('All connectivity tests failed:', {
        primaryError: error.message,
        fallbackError: fallbackError.message
      });
      throw new Error('🌐 Cannot reach Zoom servers. Check your internet or DNS settings.');
    }
  }
}

 async getAccessToken() {
  try {
    await this.testZoomConnectivity();

    const authString = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const params = new URLSearchParams({
      grant_type: 'account_credentials',
      account_id: this.accountId
    });

    console.log('Requesting token with:', {
      clientId: this.clientId,
      accountId: this.accountId,
      base64Auth: authString.substring(0, 10) + '...' // log partial for security
    });

    const response = await axios.post(
      'https://zoom.us/oauth/token',
      params.toString(),
      {
        headers: {
          Authorization: `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 5000,
        httpsAgent: new https.Agent({ keepAlive: true })
      }
    );

    console.log('Token response:', {
      status: response.status,
      data: response.data
    });

    if (!response.data.access_token) {
      throw new Error('Zoom API returned no access token');
    }

    this.accessToken = response.data.access_token;
    this.tokenExpiration = Date.now() + response.data.expires_in * 1000;

    console.log('🔑 Zoom access token retrieved');
    return this.accessToken;
  } catch (error) {
    console.error('Full error details:', {
      message: error.message,
      code: error.code,
      response: {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      },
      stack: error.stack
    });
    const msg = error.response?.data?.error || error.message;
    throw new Error('Authentication failed: ' + msg);
  }
}

  async ensureValidToken() {
    const aboutToExpire = this.tokenExpiration && Date.now() >= this.tokenExpiration - 60000;
    if (!this.accessToken || aboutToExpire) {
      await this.getAccessToken();
    }
  }

  async createMeeting(meetingData = {}) {
    try {
      await this.ensureValidToken();

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

      const msg = error.response?.data?.message || error.message;
      console.error('❌ Create Meeting Error:', msg);
      throw new Error(`Failed to create meeting: ${msg}`);
    }
  }

  async getMeeting(meetingId) {
    try {
      await this.ensureValidToken();

      const response = await axios.get(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        {
          headers: { Authorization: `Bearer ${this.accessToken}` },
          timeout: 5000
        }
      );

      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      console.error('❌ Get Meeting Error:', msg);
      throw new Error(`Failed to get meeting: ${msg}`);
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
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      console.error('❌ Update Meeting Error:', msg);
      throw new Error(`Failed to update meeting: ${msg}`);
    }
  }

  async deleteMeeting(meetingId) {
    try {
      await this.ensureValidToken();

      await axios.delete(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        {
          headers: { Authorization: `Bearer ${this.accessToken}` },
          timeout: 5000
        }
      );

      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      console.error('❌ Delete Meeting Error:', msg);
      throw new Error(`Failed to delete meeting: ${msg}`);
    }
  }
}

export default ZoomService;
