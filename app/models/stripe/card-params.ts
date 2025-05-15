// app/models/stripe/card-params.ts

import { IssuingCardSpendingControls } from './spending-controls';
import { IssuingCardShipping } from './card-shipping';
import { Stripe } from 'stripe';
// Use Stripe's actual types
export type CardType = Stripe.Issuing.CardCreateParams.Type;
export type CardStatus = Stripe.Issuing.CardCreateParams.Status;
export type ReplacementReason = Stripe.Issuing.CardCreateParams.ReplacementReason;

// Interface for PIN data
export interface PinData {
  encrypted_number?: string;
  verification?: {
    one_time_code: string;
  };
}

export interface CardCreateParams extends Omit<Stripe.Issuing.CardCreateParams, 'spending_controls' | 'shipping'> {
  cardholder: string;
  type: CardType;
  currency: string;
  status?: CardStatus;
  spending_controls?: any;
  second_line?: string;
  shipping?: any;
  replacement_for?: string;
  replacement_reason?: ReplacementReason;
  pin?: PinData;
  metadata?: Record<string, string>;
  personalization_design?: string;
}

export class IssuingCardParams {
  private params: CardCreateParams;

  /**
   * Constructor for creating card parameters
   */
  constructor(
    cardholder: string,
    type: CardType,
    currency: string = 'usd',
    status: CardStatus = 'active'
  ) {
    this.params = {
      cardholder,
      type,
      currency,
      status,
    };
  }

  /**
   * Add spending controls to the card
   */
  withSpendingControls(controls: IssuingCardSpendingControls | any): IssuingCardParams {
    if (controls) {
      this.params.spending_controls = controls instanceof IssuingCardSpendingControls 
        ? controls.toJSON() 
        : controls;
    }
    return this;
  }

  /**
   * Add second line text to the card
   */
  withSecondLine(text: string | undefined): IssuingCardParams {
    if (text) {
      this.params.second_line = text;
    }
    return this;
  }

  /**
   * Add shipping information to the card
   */
  withShipping(shipping: IssuingCardShipping | any | undefined): IssuingCardParams {
    if (shipping && (!(shipping instanceof Object) || Object.keys(shipping).length > 0)) {
      this.params.shipping = shipping instanceof IssuingCardShipping 
        ? shipping.toJSON() 
        : shipping;
    }
    return this;
  }

  /**
   * Add metadata to the card
   */
  withMetadata(metadata: Record<string, string> | undefined): IssuingCardParams {
    if (metadata) {
      this.params.metadata = metadata;
    }
    return this;
  }

  /**
   * Mark this card as a replacement
   */
  asReplacement(cardId: string, reason: ReplacementReason): IssuingCardParams {
    if (cardId) {
      this.params.replacement_for = cardId;
      this.params.replacement_reason = reason;
    }
    return this;
  }

  /**
   * Add personalization design to the card
   */
  withPersonalizationDesign(designId: string | undefined): IssuingCardParams {
    if (designId) {
      this.params.personalization_design = designId;
    }
    return this;
  }

  /**
   * Add PIN to the card
   */
  withPin(pin: PinData | undefined): IssuingCardParams {
    if (pin) {
      this.params.pin = pin;
    }
    return this;
  }

  /**
   * Convert to a Stripe-compatible object for API submission
   */
  toJSON(): CardCreateParams {
    return { ...this.params };
  }

  /**
   * Validate the card parameters
   */
  validate(): string | null {
    const { cardholder, type, currency, status, shipping } = this.params;

    if (!cardholder) {
      return "Cardholder ID is required";
    }

    if (!['virtual', 'physical'].includes(type)) {
      return "Card type must be 'virtual' or 'physical'";
    }

    if (!currency || !currency.match(/^[a-z]{3}$/)) {
      return "Currency must be a valid three-letter ISO currency code";
    }

    if (status && !['active', 'inactive', 'canceled'].includes(status)) {
      return "Status must be 'active', 'inactive', or 'canceled'";
    }

    if (type === 'physical' && !shipping) {
      return "Shipping information is required for physical cards";
    }

    if (this.params.second_line && this.params.second_line.length > 25) {
      return "Second line text cannot exceed 25 characters";
    }

    if (this.params.replacement_for && !this.params.replacement_reason) {
      return "Replacement reason is required when replacing a card";
    }

    return null;
  }

  /**
   * Static method to create a basic virtual card
   */
  static createVirtual(cardholderId: string): IssuingCardParams {
    return new IssuingCardParams(cardholderId, 'virtual', 'usd', 'active');
  }

  /**
   * Static method to create a physical card
   */
  static createPhysical(cardholderId: string): IssuingCardParams {
    return new IssuingCardParams(cardholderId, 'physical', 'usd', 'active');
  }
}