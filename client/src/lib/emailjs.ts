import emailjs from '@emailjs/browser';

// EmailJS Configuration
const EMAILJS_SERVICE_ID = "service_5nqnofd";
const EMAILJS_TEMPLATE_ID = "template_45oiq5i";
const EMAILJS_PUBLIC_KEY = "XDXEr2zFsZwJ2r21m";

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

interface LeadEmailParams {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  area: number;
  pitch: number;
  eaveLength: number;
  valleyLength: number;
  price: number;
}

export async function sendLeadEmail(params: LeadEmailParams): Promise<boolean> {
  try {
    const templateParams = {
      to_name: "Admin",
      from_name: params.customerName || "Website Visitor",
      phone: params.customerPhone || "Not provided",
      email: params.customerEmail || "Not provided",
      address: params.address,
      area: params.area.toLocaleString(),
      pitch: `${params.pitch}/12`,
      eave_len: params.eaveLength.toLocaleString(),
      valley_len: params.valleyLength.toLocaleString(),
      price: `$${params.price.toLocaleString()}`,
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log("EmailJS response:", response);
    return response.status === 200;
  } catch (error) {
    console.error("EmailJS error:", error);
    return false;
  }
}
