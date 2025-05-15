// IssuingCardShipping.ts

// Interface for address subfields
interface ShippingAddress {
    line1: string;
    line2?: string; // Optional
    city: string;
    state: string;
    postal_code: string;
    country: string; // ISO 3166-1 alpha-2 code (e.g., "US")
  }
  
  // Interface for customs information (optional, for international shipping)
  interface ShippingCustoms {
    ead?: string; // Electronic Advance Data
    tariff_number?: string; // Tariff number for customs
  }
  
  export class IssuingCardShipping {
    // Properties
    name: string;
    address: ShippingAddress;
    service?: "standard" | "express" | "priority";
    type?: "business" | "residential";
    carrier?: "usps" | "fedex" | "ups";
    phone_number?: string;
    customs?: ShippingCustoms;
  
    // Constructor
    constructor(
      name: string,
      address: ShippingAddress,
      service?: "standard" | "express" | "priority",
      type?: "business" | "residential",
      carrier?: "usps" | "fedex" | "ups",
      phoneNumber?: string,
      customs?: ShippingCustoms
    ) {
      this.name = name;
      this.address = address;
      this.service = service ?? "standard"; // Default to standard shipping
      this.type = type ?? "business"; // Default to business
      this.carrier = carrier; // Optional, Stripe selects if unset
      this.phone_number = phoneNumber;
      this.customs = customs;
    }
  
    // Method to convert to Stripe-compatible JSON
    toJSON(): object {
      return {
        name: this.name,
        address: {
          line1: this.address.line1,
          line2: this.address.line2,
          city: this.address.city,
          state: this.address.state,
          postal_code: this.address.postal_code,
          country: this.address.country,
        },
        service: this.service,
        type: this.type,
        carrier: this.carrier,
        phone_number: this.phone_number,
        customs: this.customs,
      };
    }
  
    // Method to validate the model
    validate(): string | null {
      if (!this.name.trim()) {
        return "Recipient name is required";
      }
      if (!this.address.line1.trim()) {
        return "Address line1 is required";
      }
      if (!this.address.city.trim()) {
        return "City is required";
      }
      if (!this.address.state.trim()) {
        return "State is required";
      }
      if (!this.address.postal_code.trim()) {
        return "Postal code is required";
      }
      if (!this.address.country.match(/^[A-Z]{2}$/)) {
        return "Country must be a valid ISO 3166-1 alpha-2 code";
      }
      if (this.phone_number && !this.phone_number.match(/^\+?[1-9]\d{1,14}$/)) {
        return "Invalid phone number format";
      }
      return null;
    }
  }