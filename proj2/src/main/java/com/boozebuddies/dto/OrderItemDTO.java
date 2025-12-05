package com.boozebuddies.dto;
import com.boozebuddies.entity.OrderItem;
import java.math.BigDecimal;
import lombok.*;

/** Data transfer object for order item information. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemDTO {
  /** The unique order item ID */
  private Long id;

  /** The ID of the order this item belongs to */
  private Long orderId;

  /** The ID of the product */
  private Long productId;

  /** The name of the product */
  private String productName;

  /** The quantity of the product ordered */
  private Integer quantity;

  /** The unit price of the product */
  private BigDecimal unitPrice;

  /** The subtotal for this order item */
  private BigDecimal subtotal;

  // Mapper method
    public static OrderItemDTO fromEntity(OrderItem item) {
        return OrderItemDTO.builder()
                .id(item.getId())
                .orderId(item.getOrder() != null ? item.getOrder().getId() : null)
                .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                .productName(item.getProduct() != null ? item.getProduct().getName() : null)
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .subtotal(item.getSubtotal())
                .build();
    }
}
