// Tells auth-realtime-service (Node, port 5000) that something changed, so it can push it to every browser
// via Socket.io. Called by HelpRequestService after each save. Failures are only logged: the data is already
// safe in PostgreSQL.
package com.floodlink.request.client;

import com.floodlink.request.dto.RealtimeEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class RealtimeClient {

    private static final Logger log = LoggerFactory.getLogger(RealtimeClient.class);

    private final RestClient restClient;

    public RealtimeClient(RestClient.Builder builder, @Value("${app.realtime-service.url}") String baseUrl) {
        SimpleClientHttpRequestFactory timeouts = new SimpleClientHttpRequestFactory();
        timeouts.setConnectTimeout(2000);
        timeouts.setReadTimeout(3000);
        this.restClient = builder.baseUrl(baseUrl).requestFactory(timeouts).build();
    }

    // event = Socket.io event name such as "request:claimed"; data = what the browsers receive.
    // userToken = the JWT of the user who caused the change; Node validates it like every other call.
    public void publish(String event, Object data, String userToken) {
        try {
            restClient.post().uri("/api/v1/events")
                    .header("Authorization", "Bearer " + userToken)
                    .body(new RealtimeEvent(event, data))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            log.warn("Could not notify auth-realtime-service about {}: {}", event, e.getMessage());
        }
    }
}
