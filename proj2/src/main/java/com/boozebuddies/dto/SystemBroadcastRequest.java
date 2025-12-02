package com.boozebuddies.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload used when administrators trigger a system-wide broadcast notification.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SystemBroadcastRequest {

  /** The message to broadcast to all users. */
  private String message;
}

