package com.boozebuddies.service.implementation;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.boozebuddies.entity.Driver;
import com.boozebuddies.entity.Merchant;
import com.boozebuddies.entity.Product;
import com.boozebuddies.entity.Rating;
import com.boozebuddies.entity.User;
import com.boozebuddies.repository.DriverRepository;
import com.boozebuddies.repository.MerchantRepository;
import com.boozebuddies.repository.ProductRepository;
import com.boozebuddies.repository.RatingRepository;
import com.boozebuddies.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RatingServiceImplTest {

  @Mock private RatingRepository ratingRepository;
  @Mock private UserRepository userRepository;
  @Mock private ProductRepository productRepository;
  @Mock private DriverRepository driverRepository;
  @Mock private MerchantRepository merchantRepository;

  @InjectMocks private RatingServiceImpl ratingService;

  private User user;
  private Product product;
  private Driver driver;
  private Merchant merchant;

  @BeforeEach
  void setUp() {
    user = User.builder().id(1L).build();
    product = Product.builder().id(10L).build();
    driver = Driver.builder().id(20L).build();
    merchant = Merchant.builder().id(30L).build();
  }

  @Test
  void rateProduct_validInput_persistsRating() {
    when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
    when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));
    Rating persisted =
        Rating.builder().user(user).product(product).rating(5).review("Great product").build();

    when(ratingRepository.save(any(Rating.class))).thenReturn(persisted);

    Rating saved = ratingService.rateProduct(user, product, 5, "Great product");

    assertEquals(persisted, saved);
    verify(ratingRepository).save(argThat(r -> r.getProduct().equals(product) && r.getRating() == 5));
  }

  @Test
  void rateProduct_invalidScore_throwsException() {
    when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
    when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));

    assertThrows(
        IllegalArgumentException.class,
        () -> ratingService.rateProduct(user, product, 0, "invalid score"));
  }

  @Test
  void rateDriver_validInput_updatesAggregate() {
    when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
    when(driverRepository.findById(driver.getId())).thenReturn(Optional.of(driver));

    when(ratingRepository.save(any(Rating.class)))
        .thenAnswer(invocation -> invocation.<Rating>getArgument(0));

    ratingService.rateDriver(user, driver, 4, "Good driver");

    verify(ratingRepository).save(any(Rating.class));
    verify(ratingRepository).computeAverageRatingForDriver(driver.getId());
    verify(driverRepository).save(driver);
  }

  @Test
  void rateMerchant_validInput_updatesMerchantStats() {
    when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
    when(merchantRepository.findById(merchant.getId())).thenReturn(Optional.of(merchant));

    when(ratingRepository.save(any(Rating.class)))
        .thenAnswer(invocation -> invocation.<Rating>getArgument(0));
    when(ratingRepository.computeAverageRatingForMerchant(merchant.getId())).thenReturn(4.5);
    when(ratingRepository.countMerchantReviews(merchant.getId())).thenReturn(6L);

    ratingService.rateMerchant(user, merchant, 5, "Excellent");

    verify(ratingRepository).save(any(Rating.class));
    verify(merchantRepository).save(merchant);
    assertEquals(4.5, merchant.getRating());
    assertEquals(6, merchant.getTotalRatings());
  }

  @Test
  void getAverageRatingForProduct_delegatesToRepository() {
    when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));
    when(ratingRepository.computeAverageRatingForProduct(product.getId())).thenReturn(3.7);

    double average = ratingService.getAverageRatingForProduct(product);

    assertEquals(3.7, average);
    verify(ratingRepository).computeAverageRatingForProduct(product.getId());
  }

  @Test
  void getRatingsForMerchant_returnsReviews() {
    List<Rating> ratings = List.of(Rating.builder().id(1L).build());
    when(ratingRepository.findMerchantReviews(merchant.getId())).thenReturn(ratings);

    List<Rating> result = ratingService.getRatingsForMerchant(merchant.getId());

    assertEquals(ratings, result);
    verify(ratingRepository).findMerchantReviews(merchant.getId());
  }

  @Test
  void getRatingsForProduct_returnsReviews() {
    List<Rating> ratings = List.of(Rating.builder().id(2L).build());
    when(ratingRepository.findProductReviews(product.getId())).thenReturn(ratings);

    List<Rating> result = ratingService.getRatingsForProduct(product.getId());

    assertEquals(ratings, result);
    verify(ratingRepository).findProductReviews(product.getId());
  }

  @Test
  void getReviewCountForMerchant_returnsCount() {
    when(ratingRepository.countMerchantReviews(merchant.getId())).thenReturn(4L);

    long count = ratingService.getReviewCountForMerchant(merchant.getId());

    assertEquals(4L, count);
    verify(ratingRepository).countMerchantReviews(merchant.getId());
  }

  @Test
  void getReviewCountForProduct_returnsCount() {
    when(ratingRepository.countProductReviews(product.getId())).thenReturn(8L);

    long count = ratingService.getReviewCountForProduct(product.getId());

    assertEquals(8L, count);
    verify(ratingRepository).countProductReviews(product.getId());
  }
}
