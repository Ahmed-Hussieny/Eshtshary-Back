import axios from "axios";
import { config } from "dotenv";
import https from "https";
import crypto from "crypto";
config();

class PaymobService {
  constructor() {
    this.validateEnvVars();
    this.apiKey = process.env.PAYMOB_API_KEY;
    this.merchantId = process.env.PAYMOB_MERCHANT_ID;
    this.integrationIdCards = process.env.PAYMOB_INTEGRATION_ID_CARDS;
    this.integrationIdWallets = process.env.PAYMOB_INTEGRATION_ID_WALLETS;
    this.hmacSecret = process.env.PAYMOB_HMAC_SECRET;
    this.iframeId = process.env.PAYMOB_IFRAME_ID; // Added iframe ID for card payments
    this.baseUrl = "https://accept.paymobsolutions.com/api"; // Updated domain
    this.authToken = null;
    this.tokenExpiration = null;
  }

  validateEnvVars() {
    const requiredVars = [
      "PAYMOB_API_KEY",
      "PAYMOB_MERCHANT_ID",
      "PAYMOB_INTEGRATION_ID_CARDS",
      "PAYMOB_INTEGRATION_ID_WALLETS",
    ];

    const missingVars = requiredVars.filter((v) => !process.env[v]);

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required Paymob environment variables: ${missingVars.join(
          ", "
        )}`
      );
    }
  }

  async testPaymobConnectivity() {
    try {
      const endpoints = [
        "https://accept.paymob.com/api/auth/tokens",
        "https://pakistan.paymob.com/api/auth/tokens",
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, {
            timeout: 3000,
            validateStatus: () => true, // Don't throw on 404
          });

          // If we get any response (even 404), the endpoint is reachable
          if (response.status) {
            this.baseUrl = endpoint.replace("/auth/tokens", "");
            console.log(`Paymob API is reachable at ${this.baseUrl}`);
            return true;
          }
        } catch (e) {
          console.warn(`Failed to connect to ${endpoint}: ${e.message}`);
        }
      }

      throw new Error("All Paymob endpoints unreachable");
    } catch (err) {
      console.error("Network connectivity test failed:", err.message);
      throw new Error("Cannot reach Paymob servers");
    }
  }

  async authenticate() {
    try {
      // First try with current baseUrl
      try {
        return await this._attemptAuthentication();
      } catch (firstAttemptError) {
        console.warn(
          "First authentication attempt failed, trying alternative endpoints"
        );

        // Try alternative endpoints
        const endpoints = [
          "https://accept.paymob.com/api",
          "https://pakistan.paymob.com/api",
        ];

        for (const endpoint of endpoints) {
          try {
            this.baseUrl = endpoint;
            return await this._attemptAuthentication();
          } catch (e) {
            console.warn(`Failed with endpoint ${endpoint}:`, e.message);
          }
        }

        throw new Error("All authentication attempts failed");
      }
    } catch (error) {
      console.error("Authentication failed:", error);
      throw error;
    }
  }

  async _attemptAuthentication() {
    const response = await axios.post(
      `${this.baseUrl}/auth/tokens`,
      { api_key: this.apiKey },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 5000,
      }
    );

    if (!response.data.token) {
      throw new Error("Empty token response");
    }

    this.authToken = response.data.token;
    this.tokenExpiration = Date.now() + 24 * 60 * 60 * 1000;
    return this.authToken;
  }

  async ensureValidToken() {
    if (
      !this.authToken ||
      (this.tokenExpiration && Date.now() >= this.tokenExpiration - 60000)
    ) {
      await this.authenticate();
    }
  }

  async registerOrder(orderData) {
    try {
      await this.ensureValidToken();

      const defaultOrderData = {
        auth_token: this.authToken,
        delivery_needed: "false",
        merchant_id: this.merchantId,
        amount_cents: orderData.amount * 100, // Convert to cents
        currency: orderData.currency || "EGP",
        items: [],
        ...orderData,
      };

      const response = await axios.post(
        `${this.baseUrl}/ecommerce/orders`,
        defaultOrderData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error) {
      console.error("Paymob Order Registration Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(
        `Failed to register order: ${
          error.response?.data?.detail || error.message
        }`
      );
    }
  }

  async requestPaymentKey(params) {
    try {
        const response = await axios.post(
            `${this.baseUrl}/acceptance/payment_keys`,
            {
                auth_token: this.authToken,
                amount_cents: params.amount * 100, // Paymob expects cents
                currency: params.currency,
                order_id: params.orderId,
                integration_id: params.integrationId,
                billing_data: params.billingData || {  // Fallback if not provided
                    first_name: "Customer",
                    last_name: "User",
                    email: params.email,
                    phone_number: params.phone,
                    country: "EGY",
                    street: "N/A",
                    building: "N/A",
                    floor: "N/A",
                    apartment: "N/A",
                    city: "Cairo"
                },
                lock_order_when_paid: "true"
            },
            {
                headers: { "Content-Type": "application/json" },
                timeout: 15000
            }
        );
        return response.data.token;
    } catch (error) {
        console.error("Payment Key Request Error:", {
            message: error.message,
            response: error.response?.data,
        });
        throw new Error(`Failed to get payment key: ${error.message}`);
    }
}

  async processCardPayment(paymentData) {
    try {
      // Step 1: Register order
      const order = await this.registerOrder({
        amount: paymentData.amount,
        currency: paymentData.currency,
        items: paymentData.items,
      });

      // Step 2: Get payment key
      const paymentKey = await this.requestPaymentKey({
        orderId: order.id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        email: paymentData.email,
        phone: paymentData.phone,
        integrationId: this.integrationIdCards,
        billingData: paymentData.billingData,
      });

      // Step 3: Return payment data for frontend to handle iframe
      return {
        success: true,
        paymentKey,
        orderId: order.id,
        iframeUrl: `https://accept.paymob.com/api/acceptance/iframes/${this.iframeId}?payment_token=${paymentKey}`,
      };
    } catch (error) {
      console.error("Card Payment Processing Error:", error.message);
      throw error;
    }
  }

  async processWalletPayment(paymentData, walletType) {
    try {
        const validWallets = ["vodafone", "orange", "etisalat", "we"];
        const normalizedWalletType = walletType.toLowerCase();
        
        if (!validWallets.includes(normalizedWalletType)) {
            throw new Error(
                `Invalid wallet type. Supported wallets: ${validWallets.join(", ")}`
            );
        }

        // Validate phone number format
        if (!paymentData.phone.startsWith('+20') && !paymentData.phone.startsWith('01')) {
            console.warn('Phone number should ideally include country code (+20)');
        }

        // Step 1: Register order
        const order = await this.registerOrder({
            amount: paymentData.amount,
            currency: paymentData.currency,
            items: paymentData.items,
        });

        // Step 2: Get payment key
        const paymentKey = await this.requestPaymentKey({
            orderId: order.id,
            amount: paymentData.amount,
            currency: paymentData.currency,
            email: paymentData.email,
            phone: paymentData.phone,
            integrationId: this.integrationIdWallets,
            billingData: paymentData.billingData || {
                first_name: "Customer",
                last_name: "Name",
                email: paymentData.email,
                phone_number: paymentData.phone,
                country: "EGY"
            }
        });

        // Step 3: Process wallet payment
        const response = await axios.post(
            `${this.baseUrl}/acceptance/payments/pay`,
            {
                source: {
                    identifier: paymentData.phone.startsWith('+') 
                        ? paymentData.phone 
                        : `+20${paymentData.phone}`,
                    subtype: normalizedWalletType
                },
                payment_token: paymentKey,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.authToken}` // REQUIRED for Paymob
                },
                timeout: 15000,
            }
        );

        return response.data;
    } catch (error) {
        console.error("Full API Error:", error.response?.data); // Log full error
        throw new Error(`Wallet payment failed: ${error.response?.data?.message || error.message}`);
    }
}

//   verifyHMAC(query) {
//     if (!this.hmacSecret) {
//       throw new Error("HMAC secret not configured");
//     }

//     const receivedHmac = query.hmac;
//     if (!receivedHmac) {
//       throw new Error("No HMAC provided in query");
//     }

//     // Extract and sort all query parameters except hmac
//     const ordered = {};
//     Object.keys(query)
//       .sort()
//       .forEach((key) => {
//         if (key !== "hmac") {
//           ordered[key] = query[key];
//         }
//       });

//     const message = qs.stringify(ordered);
//     const generatedHmac = crypto
//       .createHmac("sha512", this.hmacSecret)
//       .update(message)
//       .digest("hex");

//     if (generatedHmac !== receivedHmac) {
//       console.error("HMAC Verification Failed:", {
//         received: receivedHmac,
//         generated: generatedHmac,
//         message,
//       });
//       throw new Error("Invalid HMAC signature");
//     }

//     return true;
//   }

  async getTransaction(transactionId) {
    try {
      await this.ensureValidToken();

      const response = await axios.get(
        `${this.baseUrl}/acceptance/transactions/${transactionId}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          params: {
            token: this.authToken,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "Failed to get transaction:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async refundTransaction(transactionId, refundData) {
    try {
      await this.ensureValidToken();

      const defaultRefundData = {
        auth_token: this.authToken,
        transaction_id: transactionId,
        amount_cents: refundData.amount * 100,
        ...refundData,
      };

      const response = await axios.post(
        `${this.baseUrl}/acceptance/void_refund/refund`,
        defaultRefundData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "Failed to refund transaction:",
        error.response?.data || error.message
      );
      throw error;
    }
  }
}

export default PaymobService;
