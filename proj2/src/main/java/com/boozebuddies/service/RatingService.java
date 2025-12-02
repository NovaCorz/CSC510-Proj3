package com.boozebuddies.service;

import com.boozebuddies.entity.Driver;
import com.boozebuddies.entity.Merchant;
import com.boozebuddies.entity.Product;
import com.boozebuddies.entity.Rating;
import com.boozebuddies.entity.User;
import java.util.List;

public interface RatingService {

  /**
   * Allows a user to rate a product they purchased.
   *
   * @param user The user submitting the rating.
   * @param product The product being rated.
   * @param rating The rating value (e.g., 1-5 stars).
   * @param review Optional textual review.
   * @return The created Rating entity.
   */
  Rating rateProduct(User user, Product product, int rating, String review);

  /**
   * Allows a user to rate a driver who delivered their order.
   *
   * @param user The user submitting the rating.
   * @param driver The driver being rated.
   * @param rating The rating value (e.g., 1-5 stars).
   * @param review Optional textual review.
   * @return The created Rating entity.
   */
  Rating rateDriver(User user, Driver driver, int rating, String review);

  /**
   * Allows a user to rate a merchant from whom they purchased.
   *
   * @param user The user submitting the rating.
   * @param merchant The merchant being rated.
   * @param rating The rating value (e.g., 1-5 stars).
   * @param review Optional textual review.
   * @return The created Rating entity.
   */
  Rating rateMerchant(User user, Merchant merchant, int rating, String review);

  /**
   * Retrieves the average rating for a product.
   *
   * @param product The product for which to calculate the average rating.
   * @return The average rating value.
   */
  double getAverageRatingForProduct(Product product);

  /**
   * Retrieves the average rating for a driver.
   *
   * @param driver The driver for which to calculate the average rating.
   * @return The average rating value.
   */
  double getAverageRatingForDriver(Driver driver);

  /**
   * Retrieves the average rating for a merchant.
   *
   * @param merchant The merchant for which to calculate the average rating.
   * @return The average rating value.
   */
  double getAverageRatingForMerchant(Merchant merchant);

  /**
   * Retrieves reviews for a merchant in reverse chronological order.
   *
   * @param merchantId the merchant identifier
   * @return list of submitted ratings
   */
  List<Rating> getRatingsForMerchant(Long merchantId);

  /**
   * Retrieves reviews for a product in reverse chronological order.
   *
   * @param productId the product identifier
   * @return list of submitted ratings
   */
  List<Rating> getRatingsForProduct(Long productId);

  /**
   * Counts the total reviews for a merchant.
   *
   * @param merchantId the merchant identifier
   * @return total merchant review count
   */
  long getReviewCountForMerchant(Long merchantId);

  /**
   * Counts the total reviews for a product.
   *
   * @param productId the product identifier
   * @return total product review count
   */
  long getReviewCountForProduct(Long productId);
}
