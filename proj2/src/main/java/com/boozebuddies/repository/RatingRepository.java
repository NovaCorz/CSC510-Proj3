package com.boozebuddies.repository;

import com.boozebuddies.entity.Rating;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for accessing {@link Rating} entities. Provides projections that support rating
 * summaries per merchant and per product which power recommendation and review features.
 */
@Repository
public interface RatingRepository extends JpaRepository<Rating, Long> {

  /**
   * Projection interface used for aggregating rating statistics keyed by product ID.
   *
   * @param productId the product identifier
   * @param averageRating the average rating value for the product
   * @param reviewCount the total number of reviews submitted for the product
   */
  interface ProductRatingAggregate {
    Long getProductId();

    Double getAverageRating();

    Long getReviewCount();
  }

  /**
   * Retrieves aggregated rating details for all products associated with a merchant.
   *
   * @param merchantId the merchant identifier
   * @return aggregated rating statistics grouped by product
   */
  @Query(
      """
      SELECT r.product.id AS productId,
             AVG(CAST(r.rating AS double)) AS averageRating,
             COUNT(r.id) AS reviewCount
      FROM Rating r
      WHERE r.product IS NOT NULL
        AND r.product.merchant.id = :merchantId
      GROUP BY r.product.id
      """)
  List<ProductRatingAggregate> findProductRatingSummaryByMerchant(
      @Param("merchantId") Long merchantId);

  /** Retrieves reviews for a merchant with the reviewer eagerly loaded. */
  @Query(
      """
      SELECT r FROM Rating r
      LEFT JOIN FETCH r.user
      WHERE r.merchant.id = :merchantId
      ORDER BY r.createdAt DESC
      """)
  List<Rating> findMerchantReviews(@Param("merchantId") Long merchantId);

  /** Retrieves reviews for a product with the reviewer eagerly loaded. */
  @Query(
      """
      SELECT r FROM Rating r
      LEFT JOIN FETCH r.user
      WHERE r.product.id = :productId
      ORDER BY r.createdAt DESC
      """)
  List<Rating> findProductReviews(@Param("productId") Long productId);

  @Query(
      "SELECT AVG(CAST(r.rating AS double)) FROM Rating r WHERE r.product.id = :productId AND r.product IS NOT NULL")
  Double computeAverageRatingForProduct(@Param("productId") Long productId);

  @Query(
      "SELECT AVG(CAST(r.rating AS double)) FROM Rating r WHERE r.driver.id = :driverId AND r.driver IS NOT NULL")
  Double computeAverageRatingForDriver(@Param("driverId") Long driverId);

  @Query(
      "SELECT AVG(CAST(r.rating AS double)) FROM Rating r WHERE r.merchant.id = :merchantId AND r.merchant IS NOT NULL")
  Double computeAverageRatingForMerchant(@Param("merchantId") Long merchantId);

  @Query("SELECT COUNT(r) FROM Rating r WHERE r.product.id = :productId AND r.product IS NOT NULL")
  Long countProductReviews(@Param("productId") Long productId);

  @Query("SELECT COUNT(r) FROM Rating r WHERE r.merchant.id = :merchantId AND r.merchant IS NOT NULL")
  Long countMerchantReviews(@Param("merchantId") Long merchantId);

  @Query("SELECT COUNT(r) FROM Rating r WHERE r.driver.id = :driverId AND r.driver IS NOT NULL")
  Long countDriverReviews(@Param("driverId") Long driverId);
}

