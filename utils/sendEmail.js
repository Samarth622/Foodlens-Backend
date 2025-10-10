import Sib from "sib-api-v3-sdk";

const sendEmail = async (options) => {
  // Initialize Brevo client
  const client = Sib.ApiClient.instance;
  const apiKey = client.authentications["api-key"];
  apiKey.apiKey = process.env.BREVO_API_KEY;

  const tranEmailApi = new Sib.TransactionalEmailsApi();

  const sender = {
    email: process.env.FROM_EMAIL,
    name: process.env.FROM_NAME || "FoodLens",
  };

  const receivers = [{ email: options.to }];

  try {
    const response = await tranEmailApi.sendTransacEmail({
      sender,
      to: receivers,
      subject: options.subject,
      htmlContent: options.html,
      textContent: options.text,
    });

    console.log("✅ Email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Error sending email via Brevo API:", error.response?.body || error);
    throw new Error("Email could not be sent. Please try again later.");
  }
};

export default sendEmail;
