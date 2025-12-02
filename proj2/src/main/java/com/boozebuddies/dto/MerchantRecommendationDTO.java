package com.boozebuddies.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO returned by the recommendation endpoint. Encapsulates the recommended product, the
 * message intended for the chatbot UI, and useful metadata like the rating summary that produced
 * the suggestion.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MerchantRecommendationDTO {

  /** Recommended product details. */
  private ProductDTO product;

  /** Human readable recommendation message that the chatbot can surface. */
  private String message;

  /** Average rating rounded to one decimal place when available. */
  private Double averageRating;

  /** Total review count backing the recommendation. */
  private Long reviewCount;

  /** Label describing why this product was recommended (e.g. BEST_RATED, POPULAR_PICK). */
  private String strategy;
}

