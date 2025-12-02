package com.boozebuddies.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** DTO representing a system-wide broadcast message that users can read. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemBroadcastDTO {

  /** Optional identifier for the broadcast (currently timestamp based). */
  private Long id;

  /** Message shared with the entire platform. */
  private String message;

  /** When the broadcast was recorded. */
  private LocalDateTime createdAt;
}


