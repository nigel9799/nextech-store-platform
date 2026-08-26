export type StorefrontConfig = {
  brandName: string;
  logoPath: string;
  primaryColor: string;
  announcementEnabled: boolean;
  announcementText: string;
  announcementButton: string;
  announcementLink: string;
  navigation: {
    shop: string;
    prebuilt: string;
    contact: string;
  };
  cart: {
    label: string;
    enquiryLabel: string;
    continueLabel: string;
    emptyTitle: string;
    emptyBody: string;
  };
  hero: {
    eyebrow: string;
    lineOne: string;
    accent: string;
    lineTwo: string;
    body: string;
    primaryButton: string;
    secondaryButton: string;
    trustPoints: string[];
    cardLabel: string;
    cardTitle: string;
    cardLink: string;
  };
  shop: {
    eyebrow: string;
    heading: string;
    viewAll: string;
    typesLabel: string;
    searchPlaceholder: string;
    addButton: string;
    scrollHint: string;
  };
  build: {
    eyebrow: string;
    headingOne: string;
    headingTwo: string;
    body: string;
    steps: string[];
    button: string;
  };
  services: Array<{ title: string; body: string; icon: string }>;
  contact: {
    eyebrow: string;
    headingOne: string;
    headingTwo: string;
    body: string;
    directLabel: string;
    submitButton: string;
    helperText: string;
    email: string;
    phoneOne: string;
    phoneTwo: string;
    location: string;
  };
  footer: {
    callLabel: string;
    emailLabel: string;
    linksLabel: string;
    shopLink: string;
    buildLink: string;
    adminLink: string;
    copyright: string;
    privacyLabel: string;
    termsLabel: string;
    deliveryLabel: string;
  };
};

export type StorefrontCategory = {
  id: string;
  slug: string;
  name: string;
  displayOrder: number;
};

export type StorefrontProduct = {
  id: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  name: string;
  slug: string;
  sku: string;
  shortSpec: string;
  priceMinor: number;
  oldPriceMinor: number | null;
  currencyCode: string;
  tag: string | null;
  displayOrder: number;
};

export type StorefrontLegalPage = {
  kind: "privacy" | "terms" | "delivery_returns";
  title: string;
  body: string;
};

export type StorefrontData = {
  tenant: { id: string; slug: string; businessName: string; hostname: string };
  config: StorefrontConfig;
  categories: StorefrontCategory[];
  products: StorefrontProduct[];
  legalPages: StorefrontLegalPage[];
};
