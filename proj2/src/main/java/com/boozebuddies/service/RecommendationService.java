package com.boozebuddies.service;

import com.boozebuddies.dto.MerchantRecommendationDTO;

/**
 * Provides recommendation insights such as suggesting products for a merchant chatbot experience.
 */
public interface RecommendationService {

  /**
   * Generates a recommendation for a merchant that can be surfaced through the chatbot UI.
   *
   * @param merchantId the merchant identifier
   * @return the recommendation payload including product details and messaging
   */
  MerchantRecommendationDTO recommendProductForMerchant(Long merchantId);
}

