// IssuingCardSpendingControls.ts

// Interface for a single spending limit
interface SpendingLimit {
    amount: number; // Amount in smallest currency unit (e.g., cents for USD)
    interval: "per_authorization" | "daily" | "weekly" | "monthly" | "yearly" | "all_time";
    categories?: string[]; // Optional merchant category codes (MCCs)
  }
  
  // Interface for authorization controls
  interface AuthorizationControls {
    allowed_countries?: string[]; // ISO 3166-1 alpha-2 country codes
  }
  
  export class IssuingCardSpendingControls {
    // Properties
    spending_limits?: SpendingLimit[];
    allowed_categories?: string[];
    blocked_categories?: string[];
    allowed_authorization_controls?: AuthorizationControls;
    max_approval_amount?: number;
  
    // Constructor
    constructor(
      spendingLimits?: SpendingLimit[],
      allowedCategories?: string[],
      blockedCategories?: string[],
      allowedCountries?: string[],
      maxApprovalAmount?: number
    ) {
      this.spending_limits = spendingLimits ?? []; // Default to empty array
      this.allowed_categories = allowedCategories ?? []; // Default to empty array
      this.blocked_categories = blockedCategories ?? []; // Default to empty array
      this.allowed_authorization_controls = allowedCountries
        ? { allowed_countries: allowedCountries }
        : undefined; // Only set if countries provided
      this.max_approval_amount = maxApprovalAmount; // Undefined if not provided
    }
  
    // Method to convert to Stripe-compatible JSON
    toJSON(): object {
      return {
        spending_limits: this.spending_limits?.length ? this.spending_limits : undefined,
        allowed_categories: this.allowed_categories?.length ? this.allowed_categories : undefined,
        blocked_categories: this.blocked_categories?.length ? this.blocked_categories : undefined,
        allowed_authorization_controls: this.allowed_authorization_controls,
        max_approval_amount: this.max_approval_amount,
      };
    }
  
    // Method to validate the model
    validate(): string | null {
      if (this.spending_limits) {
        for (const limit of this.spending_limits) {
          if (limit.amount <= 0) {
            return "Spending limit amount must be positive";
          }
          if (!limit.interval) {
            return "Spending limit interval is required";
          }
          // Optional: Validate MCCs against a known list
          if (limit.categories) {
            for (const category of limit.categories) {
              if (!isValidMCC(category)) {
                return `Invalid merchant category code: ${category}`;
              }
            }
          }
        }
      }
      if (this.allowed_categories) {
        for (const category of this.allowed_categories) {
          if (!isValidMCC(category)) {
            return `Invalid allowed category code: ${category}`;
          }
        }
      }
      if (this.blocked_categories) {
        for (const category of this.blocked_categories) {
          if (!isValidMCC(category)) {
            return `Invalid blocked category code: ${category}`;
          }
        }
      }
      if (
        this.allowed_authorization_controls?.allowed_countries &&
        this.allowed_authorization_controls.allowed_countries.some(
          country => !country.match(/^[A-Z]{2}$/)
        )
      ) {
        return "Allowed countries must be valid ISO 3166-1 alpha-2 codes";
      }
      if (this.max_approval_amount && this.max_approval_amount <= 0) {
        return "Max approval amount must be positive";
      }
      return null;
    }
  }
  
  // Helper function to validate MCCs (simplified, extend with full MCC list)
  const validMCCs = [
    "grocery_stores",
    "restaurants",
    "hotels_motels_and_resorts",
    "gambling",
    "cryptocurrency_services",
    "office_supply_stores",
  ];
  function isValidMCC(category: string): boolean {
    return validMCCs.includes(category);
    // In production, use Stripe's full MCC list or API validation
  }