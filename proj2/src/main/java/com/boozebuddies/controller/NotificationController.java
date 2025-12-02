package com.boozebuddies.controller;

import com.boozebuddies.dto.ApiResponse;
import com.boozebuddies.dto.SystemBroadcastRequest;
import com.boozebuddies.security.annotation.RoleAnnotations.IsAdmin;
import com.boozebuddies.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Administrative endpoints for dispatching notifications through the {@link NotificationService}.
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

  private final NotificationService notificationService;

  /**
   * Broadcasts a system-wide notification message. Requires administrator privileges.
   *
   * @param request the broadcast request body
   * @return a success or error response
   */
  @PostMapping("/broadcast")
  @IsAdmin
  public ResponseEntity<ApiResponse<Void>> broadcastSystemMessage(
      @RequestBody SystemBroadcastRequest request) {
    String message = request != null ? request.getMessage() : null;
    if (message == null || message.trim().isEmpty()) {
      return ResponseEntity.badRequest().body(ApiResponse.error("Message must not be empty"));
    }

    notificationService.broadcastSystemMessage(message.trim());
    return ResponseEntity.ok(ApiResponse.success(null, "Broadcast sent successfully"));
  }
}

