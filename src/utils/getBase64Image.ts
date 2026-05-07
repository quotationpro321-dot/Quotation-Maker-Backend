import axios from "axios";

export const getBase64Image = async (url: string): Promise<string> => {
  if (!url) return "";
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const base64 = Buffer.from(response.data).toString("base64");
    const mimeType = response.headers["content-type"] || "image/png";
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching image:", error);
    return "";
  }
};
