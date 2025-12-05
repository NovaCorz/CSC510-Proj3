package com.boozebuddies.controller;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.boozebuddies.config.TestSecurityConfig;
import com.boozebuddies.dto.SystemBroadcastDTO;
import com.boozebuddies.dto.SystemBroadcastRequest;
import com.boozebuddies.security.JwtAuthenticationFilter;
import com.boozebuddies.service.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = NotificationController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(TestSecurityConfig.class)
class NotificationControllerTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  @MockBean private NotificationService notificationService;
  @MockBean private JwtAuthenticationFilter jwtAuthenticationFilter;

  @Test
  @WithMockUser
  @DisplayName("POST /api/notifications/broadcast stores message")
  void broadcastSystemMessage_success() throws Exception {
    String payload = objectMapper.writeValueAsString(new SystemBroadcastRequest("Hello"));

    mockMvc
        .perform(
            post("/api/notifications/broadcast")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(
            jsonPath("$.message")
                .value(containsString("Broadcast sent successfully")));

    verify(notificationService, times(1)).broadcastSystemMessage("Hello");
  }

  @Test
  @WithMockUser
  @DisplayName("GET /api/notifications returns broadcast list")
  void getBroadcasts_success() throws Exception {
    List<SystemBroadcastDTO> items =
        List.of(
            SystemBroadcastDTO.builder()
                .id(1L)
                .message("Scheduled maintenance")
                .createdAt(LocalDateTime.now())
                .build());

    when(notificationService.getRecentBroadcasts()).thenReturn(items);

    mockMvc
        .perform(get("/api/notifications"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data[0].message").value("Scheduled maintenance"));

    verify(notificationService, times(1)).getRecentBroadcasts();
  }
}


