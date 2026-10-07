import "server-only";
import QRCode from "qrcode";

/** Renders `value` as an inline SVG QR code string (no network calls,
 * no client-side JS) for use directly in server-rendered markup. */
export async function renderTicketQrSvg(value: string): Promise<string> {
  return QRCode.toString(value, {
    type: "svg",
    margin: 1,
    color: { dark: "#2D1B4E", light: "#00000000" },
  });
}
