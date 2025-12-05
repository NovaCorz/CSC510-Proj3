package com.boozebuddies.service.implementation;

import com.boozebuddies.dto.MerchantRecommendationDTO;
import com.boozebuddies.entity.Merchant;
import com.boozebuddies.entity.Product;
import com.boozebuddies.mapper.ProductMapper;
import com.boozebuddies.repository.ProductRepository;
import com.boozebuddies.repository.RatingRepository;
import com.boozebuddies.service.MerchantService;
import com.boozebuddies.service.RecommendationService;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Generates recommendations for merchants by combining rating insights and sales popularity.
 */
@Service
@RequiredArgsConstructor
public class RecommendationServiceImpl implements RecommendationService {

  private static final RatingStats EMPTY_STATS = new RatingStats(0.0, 0L);

  private final MerchantService merchantService;
  private final ProductRepository productRepository;
  private final RatingRepository ratingRepository;
  private final ProductMapper productMapper;

  @Override
  public MerchantRecommendationDTO recommendProductForMerchant(Long merchantId) {
    if (merchantId == null || merchantId <= 0) {
      throw new IllegalArgumentException("Merchant id must be provided");
    }

    Merchant merchant = merchantService.getMerchantById(merchantId);
    if (merchant == null) {
      throw new IllegalArgumentException("Merchant not found with id: " + merchantId);
    }

    List<Product> availableProducts =
        productRepository.findByMerchantIdAndAvailableTrue(merchantId);
    if (availableProducts.isEmpty()) {
      throw new IllegalStateException(
          "Merchant has no available products to generate a recommendation");
    }

    Map<Long, RatingStats> ratingStatsByProduct =
        ratingRepository.findProductRatingSummaryByMerchant(merchantId).stream()
            .collect(
                Collectors.toMap(
                    RatingRepository.ProductRatingAggregate::getProductId,
                    aggregate ->
                        new RatingStats(
                            Optional.ofNullable(aggregate.getAverageRating()).orElse(0.0),
                            Optional.ofNullable(aggregate.getReviewCount()).orElse(0L))));

    Product topRatedProduct =
        availableProducts.stream()
            .max(
                Comparator
                    .comparingDouble(
                        (Product product) ->
                            ratingStatsByProduct
                                .getOrDefault(product.getId(), EMPTY_STATS)
                                .average())
                    .thenComparingLong(
                        product ->
                            ratingStatsByProduct
                                .getOrDefault(product.getId(), EMPTY_STATS)
                                .reviewCount())
                    .thenComparing(Product::getId))
            .orElse(null);

    RatingStats topRatedStats =
        topRatedProduct != null
            ? ratingStatsByProduct.getOrDefault(topRatedProduct.getId(), EMPTY_STATS)
            : EMPTY_STATS;

    Product bestSellerFallback = productRepository.findTopRecommendedProduct(merchantId);
    if (bestSellerFallback == null) {
      int randomIndex = java.util.concurrent.ThreadLocalRandom.current().nextInt(availableProducts.size());
      bestSellerFallback = availableProducts.get(randomIndex);
    }

    Product recommendedProduct =
        topRatedStats.reviewCount() > 0 ? topRatedProduct : bestSellerFallback;
    RatingStats recommendationStats =
        ratingStatsByProduct.getOrDefault(recommendedProduct.getId(), EMPTY_STATS);

    String strategy =
        recommendationStats.reviewCount() > 0 ? "BEST_RATED" : "POPULAR_PICK";
    String message =
        buildChatbotMessage(
            merchant.getName(),
            recommendedProduct.getName(),
            recommendationStats,
            strategy);

    return MerchantRecommendationDTO.builder()
        .product(productMapper.toDTO(recommendedProduct))
        .averageRating(
            recommendationStats.reviewCount() > 0
                ? roundToSingleDecimal(recommendationStats.average())
                : null)
        .reviewCount(recommendationStats.reviewCount() > 0 ? recommendationStats.reviewCount() : null)
        .strategy(strategy)
        .message(message)
        .build();
  }

  private String buildChatbotMessage(
      String merchantName,
      String productName,
      RatingStats stats,
      String strategy) {
    if ("BEST_RATED".equals(strategy) && stats.reviewCount() > 0) {
      double rounded = roundToSingleDecimal(stats.average());
      return String.format(
          "Customers love the %s at %s — %.1f★ from %d reviews.",
          productName, merchantName, rounded, stats.reviewCount());
    }

    return String.format(
        "The %s is a popular pick at %s. Want to give it a try?", productName, merchantName);
  }

  private double roundToSingleDecimal(double value) {
    return Math.round(value * 10.0) / 10.0;
  }

  private record RatingStats(double average, long reviewCount) {
    RatingStats {
      if (Double.isNaN(average)) {
        average = 0.0;
      }
      if (reviewCount < 0) {
        reviewCount = 0;
      }
    }
  }
}

