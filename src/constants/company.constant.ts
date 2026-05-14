export const COMPANY_INFO = {
  name: "Alsama",
  address: "",
  phone: "",
  email: "mdafsar.dev@gmail.com",
  websiteUrl: "https://alsama-dashboard.vercel.app",
  /**
   * Public CDN URLs of the Alsama wordmark (PNG raster).
   * `light` = dark-coloured logo for light backgrounds (default).
   * `dark`  = light-coloured logo for dark backgrounds (swapped via `prefers-color-scheme`).
   *
   * Optional `svgLight` / `svgDark`: host SVGs on your CDN and paste URLs here. The email template
   * uses `<img src="…">` pointing at those URLs (same deliverability as PNG). Inline SVG in HTML mail
   * is stripped or broken in Gmail/Outlook, so we do not embed giant inline `<svg>` blocks.
   */
  logoUrls: {
    light: "https://alsama-dashboard.vercel.app/Alsama-logo-light-mode.png",
    dark: "https://alsama-dashboard.vercel.app/Alsama-logo-dark-mode.png",
    svgLight: "",
    svgDark: "",
  },

  dashboardUrl: "",

  brandColors: {
    primary: "#24595f",
    secondary: "#e0a44b",
    accent: "",
    success: "",
    warning: "",
  },

  socialMedia: {
    facebook: "",
    instagram: "",
    youtube: "",
  },
} as const;
