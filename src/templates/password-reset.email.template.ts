import { COMPANY_INFO } from "../constants/company.constant";

export interface PasswordResetEmailParams {
  recipientName: string;
  resetCode: string;
  resetLink: string;
  expiryMinutes: number;
}

/** Brand palette — only these two accent colors are used across the email. */
const PRIMARY = COMPANY_INFO.brandColors.primary || "#24595f";
const SECONDARY = COMPANY_INFO.brandColors.secondary || "#e0a44b";

/**
 * Header logo display width (px). Tall wordmarks (Arabic + ALSAMA) need a stable width
 * without `width:100%` (that stretches in Gmail) and without a low `max-height` (that squishes).
 */
const LOGO_DISPLAY_WIDTH_PX = 268;

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Password reset email — centred layout, Alsama palette. Logo sits at the **top inside** the white
 * card so there is no pale “stripe” gap between brand and body (common Gmail layout issue).
 *
 * Pattern mirrors `nayeems-click/src/templates/email.template.ts`:
 *  - `<img>` URLs from `COMPANY_INFO.logoUrls` (optional hosted SVG URLs); dark mode swaps assets.
 *  - `@media (prefers-color-scheme: dark)` + `[data-ogsc]` for Outlook dark previews.
 */
export const generatePasswordResetEmailHtml = (params: PasswordResetEmailParams): string => {
  const name = escapeHtml(params.recipientName.trim() || "there");
  const code = escapeHtml(params.resetCode);
  const link = escapeHtml(params.resetLink);
  const brand = escapeHtml(COMPANY_INFO.name);
  const year = new Date().getFullYear();

  const svgLight = String(COMPANY_INFO.logoUrls.svgLight ?? "").trim();
  const svgDark = String(COMPANY_INFO.logoUrls.svgDark ?? "").trim();
  const useHostedSvg = Boolean(svgLight && svgDark);
  const logoLightSrc = escapeHtml(useHostedSvg ? svgLight : COMPANY_INFO.logoUrls.light);
  const logoDarkSrc = escapeHtml(useHostedSvg ? svgDark : COMPANY_INFO.logoUrls.dark);

  const logoW = LOGO_DISPLAY_WIDTH_PX;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Reset your password</title>
  <style>
    @media (prefers-color-scheme: dark) {
      .dark-mode-bg { background-color: #0f2123 !important; }
      .dark-mode-card { background-color: #1a3338 !important; border-color: ${SECONDARY} !important; }
      .dark-mode-text { color: #f2f6f6 !important; }
      .dark-mode-text-secondary { color: #c5d9dc !important; }
      .dark-mode-text-heading { color: ${SECONDARY} !important; }
      .dark-mode-text-accent { color: ${SECONDARY} !important; }
      .dark-mode-border { border-color: ${SECONDARY} !important; }
      .dark-mode-btn { background-color: ${SECONDARY} !important; }
      .dark-mode-btn-text { color: ${PRIMARY} !important; background-color: ${SECONDARY} !important; }
      .logo-light { display: none !important; width: 0 !important; height: 0 !important; max-width: 0 !important; max-height: 0 !important; overflow: hidden !important; mso-hide: all !important; }
      .logo-dark { display: block !important; width: ${logoW}px !important; max-width: ${logoW}px !important; height: auto !important; margin-left: auto !important; margin-right: auto !important; overflow: visible !important; }
    }
    [data-ogsc] .dark-mode-bg { background-color: #0f2123 !important; }
    [data-ogsc] .dark-mode-card { background-color: #1a3338 !important; border-color: ${SECONDARY} !important; }
    [data-ogsc] .dark-mode-text { color: #f2f6f6 !important; }
    [data-ogsc] .dark-mode-text-secondary { color: #c5d9dc !important; }
    [data-ogsc] .dark-mode-text-heading { color: ${SECONDARY} !important; }
    [data-ogsc] .dark-mode-text-accent { color: ${SECONDARY} !important; }
    [data-ogsc] .dark-mode-border { border-color: ${SECONDARY} !important; }
    [data-ogsc] .dark-mode-btn { background-color: ${SECONDARY} !important; }
    [data-ogsc] .dark-mode-btn-text { color: ${PRIMARY} !important; background-color: ${SECONDARY} !important; }
    [data-ogsc] .logo-light { display: none !important; width: 0 !important; height: 0 !important; max-width: 0 !important; max-height: 0 !important; overflow: hidden !important; mso-hide: all !important; }
    [data-ogsc] .logo-dark { display: block !important; width: ${logoW}px !important; max-width: ${logoW}px !important; height: auto !important; margin-left: auto !important; margin-right: auto !important; overflow: visible !important; }
  </style>
</head>
<body class="dark-mode-bg" style="margin:0;padding:0;background-color:#f4f9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" class="dark-mode-bg" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f9f9;padding:22px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
          <!-- Card (logo sits inside card top → no grey strip between brand and body) -->
          <tr>
            <td style="padding:0;line-height:normal;">
              <table role="presentation" class="dark-mode-card" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;background-color:#ffffff;border:1px solid ${PRIMARY};border-radius:12px;">
                <!-- Logo (inside card — pulls brand down next to content) -->
                <tr>
                  <td align="center" style="padding:12px 22px 0 22px;text-align:center;">
                    <table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
                      <tr>
                        <td align="center" style="line-height:0;font-size:0;mso-line-height-rule:exactly;">
                          <!--[if mso]>
                          <table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0"><tr><td width="${logoW}" align="center">
                          <![endif]-->
                          <img class="logo-light"
                               src="${logoLightSrc}"
                               alt="${brand}"
                               width="${logoW}"
                               style="display:block;margin:0;padding:0;border:0;outline:none;text-decoration:none;width:${logoW}px;max-width:${logoW}px;height:auto;line-height:0;font-size:0;color:${PRIMARY};">
                          <img class="logo-dark"
                               src="${logoDarkSrc}"
                               alt="${brand}"
                               width="${logoW}"
                               style="display:none;mso-hide:all;width:0;max-width:0;height:0;line-height:0;font-size:0;overflow:hidden;border:0;margin:0;padding:0;">
                          <!--[if mso]>
                          </td></tr></table>
                          <![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Heading (centered) -->
                <tr>
                  <td style="padding:4px 22px 4px 22px;text-align:center;">
                    <h1 class="dark-mode-text-heading" style="margin:0;font-size:20px;font-weight:700;line-height:1.3;color:${PRIMARY};text-align:center;">
                      Forgot password
                    </h1>
                  </td>
                </tr>

                <!-- Body (left-aligned) -->
                <tr>
                  <td class="dark-mode-text" style="padding:14px 22px 0 22px;text-align:left;font-size:13px;line-height:1.55;color:${PRIMARY};">
                    <p style="margin:0 0 8px 0;text-align:left;"><strong>Hello, ${name},</strong></p>
                    <p class="dark-mode-text-secondary" style="margin:0 0 10px 0;font-size:13px;line-height:1.55;color:${PRIMARY};text-align:left;">
                      Not to worry, we&apos;ve got your back! To reset your password, use the code below in the ${brand} app:
                    </p>
                    <p style="margin:0 0 12px 0;font-size:13px;line-height:1.5;color:${PRIMARY};text-align:left;">
                      <strong>Code:</strong> <strong style="color:${SECONDARY};letter-spacing:0.03em;word-break:break-all;">${code}</strong>
                    </p>
                    <p class="dark-mode-text-secondary" style="margin:0 0 14px 0;font-size:12px;line-height:1.5;color:${PRIMARY};text-align:left;">
                      Or click the button to reset it through your browser.
                    </p>
                  </td>
                </tr>

                <!-- CTA button (centered) -->
                <tr>
                  <td align="center" style="padding:4px 22px 14px 22px;text-align:center;">
                    <table role="presentation" align="center" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                      <tr>
                        <td align="center" class="dark-mode-btn" style="border-radius:8px;background-color:${PRIMARY};">
                          <a href="${link}" target="_blank" rel="noopener noreferrer"
                             class="dark-mode-btn-text"
                             style="display:inline-block;padding:11px 26px;font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;background-color:${PRIMARY};">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Expiry note (left-aligned, part of body) -->
                <tr>
                  <td class="dark-mode-text-secondary" style="padding:0 22px 18px 22px;text-align:left;font-size:12px;line-height:1.5;color:${PRIMARY};">
                    This link and code expire in <strong style="color:${SECONDARY};">${params.expiryMinutes}</strong> minutes. If you didn&apos;t request this, you can ignore this email.
                  </td>
                </tr>

                <!-- Footer: copyright only (centered, inside card with divider) -->
                <tr>
                  <td class="dark-mode-text dark-mode-border" style="padding:14px 22px 16px 22px;text-align:center;border-top:1px solid ${PRIMARY};font-size:12px;line-height:1.5;color:${PRIMARY};">
                    © ${year} <strong style="color:${SECONDARY};">${brand}</strong> All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export const generatePasswordResetEmailText = (params: PasswordResetEmailParams): string => {
  const brand = COMPANY_INFO.name;
  return [
    `Reset your password - ${brand}`,
    "",
    `Hello, ${params.recipientName.trim() || "there"},`,
    "",
    `Not to worry — use this code in the ${brand} app to reset your password:`,
    params.resetCode,
    "",
    "Or open this link in your browser:",
    params.resetLink,
    "",
    `Expires in ${params.expiryMinutes} minutes.`,
    "",
    `© ${new Date().getFullYear()} ${brand}. All rights reserved.`,
  ].join("\n");
};
