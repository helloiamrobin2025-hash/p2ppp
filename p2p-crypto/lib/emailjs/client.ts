import emailjs from "@emailjs/browser";

type EmailEnv = {
  serviceId: string;
  publicKey: string;
};

type TemplateMap = {
  welcome: string;
  login: string;
  transfer: string;
};

const getEmailEnv = (): EmailEnv | null => {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !publicKey) {
    return null;
  }

  return { serviceId, publicKey };
};

const getTemplateMap = (): TemplateMap | null => {
  const welcome = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_WELCOME;
  const login = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_LOGIN;
  const transfer = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_TRANSFER;

  if (!welcome || !login || !transfer) {
    return null;
  }

  return { welcome, login, transfer };
};

type SendEmailParams = {
  templateKey: keyof TemplateMap;
  templateParams: Record<string, string | number>;
};

export const sendEmail = async ({
  templateKey,
  templateParams,
}: SendEmailParams) => {
  const env = getEmailEnv();
  const templates = getTemplateMap();

  if (!env || !templates) {
    return false;
  }

  try {
    await emailjs.send(
      env.serviceId,
      templates[templateKey],
      templateParams,
      env.publicKey,
    );
    return true;
  } catch (error) {
    console.error("[EmailJS] Send failed:", error);
    return false;
  }
};
