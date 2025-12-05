package com.boozebuddies.service.implementation;

import com.boozebuddies.entity.Driver;
import com.boozebuddies.entity.Merchant;
import com.boozebuddies.entity.Product;
import com.boozebuddies.entity.Rating;
import com.boozebuddies.entity.User;
import com.boozebuddies.model.RatingTargetType;
import com.boozebuddies.repository.DriverRepository;
import com.boozebuddies.repository.MerchantRepository;
import com.boozebuddies.repository.ProductRepository;
import com.boozebuddies.repository.RatingRepository;
import com.boozebuddies.repository.UserRepository;
import com.boozebuddies.service.RatingService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * JPA-backed implementation of {@link RatingService}. Persists ratings and reviews for merchants,
 * products, and drivers while keeping aggregate statistics up to date.
 */
@Service
@RequiredArgsConstructor
public class RatingServiceImpl implements RatingService {

  private final RatingRepository ratingRepository;
  private final UserRepository userRepository;
  private final ProductRepository productRepository;
  private final DriverRepository driverRepository;
  private final MerchantRepository merchantRepository;

  @Override
  @Transactional
  public Rating rateProduct(User user, Product product, int ratingValue, String review) {
    User reviewer = requireUser(user);
    Product persistedProduct = requireProduct(product);

    validateRating(ratingValue);

    Rating rating =
        Rating.builder()
            .user(reviewer)
            .product(persistedProduct)
            .targetType(RatingTargetType.PRODUCT)
            .targetId(persistedProduct.getId())
            .rating(ratingValue)
            .review(normalizeReview(review))
            .build();

    return ratingRepository.save(rating);
  }

  @Override
  @Transactional
  public Rating rateDriver(User user, Driver driver, int ratingValue, String review) {
    User reviewer = requireUser(user);
    Driver persistedDriver = requireDriver(driver);

    validateRating(ratingValue);

    Rating rating =
        Rating.builder()
            .user(reviewer)
            .driver(persistedDriver)
            .targetType(RatingTargetType.DRIVER)
            .targetId(persistedDriver.getId())
            .rating(ratingValue)
            .review(normalizeReview(review))
            .build();

    Rating saved = ratingRepository.save(rating);
    refreshDriverAggregate(persistedDriver);
    return saved;
  }

  @Override
  @Transactional
  public Rating rateMerchant(User user, Merchant merchant, int ratingValue, String review) {
    User reviewer = requireUser(user);
    Merchant persistedMerchant = requireMerchant(merchant);

    validateRating(ratingValue);

    Rating rating =
        Rating.builder()
            .user(reviewer)
            .merchant(persistedMerchant)
            .targetType(RatingTargetType.MERCHANT)
            .targetId(persistedMerchant.getId())
            .rating(ratingValue)
            .review(normalizeReview(review))
            .build();

    Rating saved = ratingRepository.save(rating);
    refreshMerchantAggregates(persistedMerchant);
    return saved;
  }

  @Override
  @Transactional(readOnly = true)
  public double getAverageRatingForProduct(Product product) {
    Product persistedProduct = requireProduct(product);
    Double average = ratingRepository.computeAverageRatingForProduct(persistedProduct.getId());
    return average != null ? average : 0.0;
  }

  @Override
  @Transactional(readOnly = true)
  public double getAverageRatingForDriver(Driver driver) {
    Driver persistedDriver = requireDriver(driver);
    Double average = ratingRepository.computeAverageRatingForDriver(persistedDriver.getId());
    return average != null ? average : 0.0;
  }

  @Override
  @Transactional(readOnly = true)
  public double getAverageRatingForMerchant(Merchant merchant) {
    Merchant persistedMerchant = requireMerchant(merchant);
    Double average = ratingRepository.computeAverageRatingForMerchant(persistedMerchant.getId());
    return average != null ? average : 0.0;
  }

  @Override
  @Transactional(readOnly = true)
  public List<Rating> getRatingsForMerchant(Long merchantId) {
    validateId(merchantId, "merchantId");
    return ratingRepository.findMerchantReviews(merchantId);
  }

  @Override
  @Transactional(readOnly = true)
  public List<Rating> getRatingsForProduct(Long productId) {
    validateId(productId, "productId");
    return ratingRepository.findProductReviews(productId);
  }

  @Override
  @Transactional(readOnly = true)
  public long getReviewCountForMerchant(Long merchantId) {
    validateId(merchantId, "merchantId");
    return ratingRepository.countMerchantReviews(merchantId);
  }

  @Override
  @Transactional(readOnly = true)
  public long getReviewCountForProduct(Long productId) {
    validateId(productId, "productId");
    return ratingRepository.countProductReviews(productId);
  }

  private void validateRating(int ratingValue) {
    if (ratingValue < 1 || ratingValue > 5) {
      throw new IllegalArgumentException("Rating value must be between 1 and 5");
    }
  }

  private void validateId(Long id, String field) {
    if (id == null || id <= 0) {
      throw new IllegalArgumentException(field + " must be provided");
    }
  }

  private User requireUser(User user) {
    if (user == null || user.getId() == null) {
      throw new IllegalArgumentException("User information is required to submit a rating");
    }
    return userRepository
        .findById(user.getId())
        .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + user.getId()));
  }

  private Product requireProduct(Product product) {
    if (product == null || product.getId() == null) {
      throw new IllegalArgumentException("Product information is required");
    }
    return productRepository
        .findById(product.getId())
        .orElseThrow(
            () -> new IllegalArgumentException("Product not found with id: " + product.getId()));
  }

  private Driver requireDriver(Driver driver) {
    if (driver == null || driver.getId() == null) {
      throw new IllegalArgumentException("Driver information is required");
    }
    return driverRepository
        .findById(driver.getId())
        .orElseThrow(
            () -> new IllegalArgumentException("Driver not found with id: " + driver.getId()));
  }

  private Merchant requireMerchant(Merchant merchant) {
    if (merchant == null || merchant.getId() == null) {
      throw new IllegalArgumentException("Merchant information is required");
    }
    return merchantRepository
        .findById(merchant.getId())
        .orElseThrow(
            () -> new IllegalArgumentException("Merchant not found with id: " + merchant.getId()));
  }

  private String normalizeReview(String review) {
    if (review == null) {
      return null;
    }
    String trimmed = review.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }

  private void refreshMerchantAggregates(Merchant merchant) {
    Double average = ratingRepository.computeAverageRatingForMerchant(merchant.getId());
    Long count = ratingRepository.countMerchantReviews(merchant.getId());
    merchant.setRating(average != null ? roundToSingleDecimal(average) : 0.0);
    merchant.setTotalRatings(count != null ? count.intValue() : 0);
    merchantRepository.save(merchant);
  }

  private void refreshDriverAggregate(Driver driver) {
    Double average = ratingRepository.computeAverageRatingForDriver(driver.getId());
    driver.setRating(average != null ? roundToSingleDecimal(average) : 0.0);
    driverRepository.save(driver);
  }

  private double roundToSingleDecimal(double value) {
    if (Double.isNaN(value)) {
      return 0.0;
    }
    return Math.round(value * 10.0) / 10.0;
  }
}
