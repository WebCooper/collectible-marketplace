import { z } from "zod";

const url = (what: string) => z.string().trim().url(`${what} must be a full URL (https://…)`);

/** CreateListingDto / UpdateListingDto in backend/docs/openapi.json. */
export const listingSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(150, "Title must not exceed 150 characters"),
  description: z
    .string()
    .trim()
    .min(20, "Describe the item in at least 20 characters")
    .max(5000, "Description must not exceed 5000 characters"),
  category: z.enum(["OLD_COINS", "PROOF_COINS", "COMMEMORATIVE_COINS", "CURRENCY_NOTES", "STAMPS", "MEDALS"]),
  condition: z.enum(["POOR", "FAIR", "GOOD", "VERY_GOOD", "EXCELLENT", "MINT"]),
  era: z.string().trim().max(50, "Era must not exceed 50 characters"),
  denomination: z.string().trim().max(50, "Denomination must not exceed 50 characters"),
  startingPrice: z
    .string()
    .trim()
    .min(1, "Enter a price")
    .refine((v) => Number.isFinite(Number(v)) && Number(v) >= 1, "Price must be at least 1")
    .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), "Use at most 2 decimal places"),
  listingType: z.enum(["FIXED_PRICE", "AUCTION"]),
  /** One URL per entry; blank rows are ignored. */
  images: z.array(z.string().trim()).max(10, "At most 10 images"),
});

export const certificateSchema = z.object({
  fileUrl: url("Certificate link"),
  fileName: z.string().trim().min(1, "File name is required").max(255),
  issuer: z.string().trim().max(150, "Issuer must not exceed 150 characters"),
});

export const auctionSchema = z
  .object({
    startPrice: z.string().trim(),
    minIncrement: z.string().trim(),
    buyNowPrice: z.string().trim(),
    endTime: z.string().min(1, "Choose when bidding closes"),
  })
  .superRefine((v, ctx) => {
    const money = (key: "startPrice" | "minIncrement" | "buyNowPrice", optional = false) => {
      const raw = v[key];
      if (!raw && optional) return;
      const n = Number(raw);
      if (!raw || !Number.isFinite(n) || n < 1 || !/^\d+(\.\d{1,2})?$/.test(raw)) {
        ctx.addIssue({ code: "custom", path: [key], message: "Enter an amount of at least 1 (max 2 decimals)" });
      }
    };
    money("startPrice");
    money("minIncrement");
    money("buyNowPrice", true);
    if (v.buyNowPrice && Number(v.buyNowPrice) <= Number(v.startPrice)) {
      ctx.addIssue({ code: "custom", path: ["buyNowPrice"], message: "Buy Now must be above the opening price" });
    }
    if (v.endTime && new Date(v.endTime).getTime() <= Date.now()) {
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "The closing time must be in the future" });
    }
  });

export type ListingFormInput = z.input<typeof listingSchema>;
export type CertificateFormInput = z.input<typeof certificateSchema>;
export type AuctionFormInput = z.input<typeof auctionSchema>;
