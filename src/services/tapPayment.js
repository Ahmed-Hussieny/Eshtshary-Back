import axios from "axios";

export const createCharge = async ({
  price,
  title,
  id,
  username,
  email,
  currency = "EGP",
  metadata = {},
  post,
  redirect ,
}) => {
  try {
    console.log("Creating charge with the following details:", {
      price,
      title,
      id,
      username,
      email,
      currency,
      metadata,
      post,
      redirect,
    });
    const tapResponse = await axios.post(
      `${process.env.TAP_URL}/charges`,
      {
        amount: price, // Convert to smallest currency unit
        currency: currency,
        threeDSecure: true, // Consider enabling 3D Secure
        save_card: false,
        description: `Payment for: ${title}`,
        statement_descriptor: title.substring(0, 22), // Ensure it's <= 22 chars
        metadata,
        reference: {
          transaction: `logo_${id}`,
          order: `order_${id}`,
        },
        receipt: {
          email: true,
          sms: true,
        },
        customer: {
          first_name: username,
          email: email,
        },
        source: {
          id: "src_all" // Changed from src_card
        },
        post,
        redirect,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TAP_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    return tapResponse.data.transaction.url;
  } catch (error) {
    console.log("Full error response:", error.response?.data);
    return null;
  }
};
