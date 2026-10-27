// Calls insights-service (Flask, port 5001) to check whether a new request is a duplicate and to get its
// priority score + reasons. Used by HelpRequestService.createRequest. If Flask is down, returns a safe fallback.
package com.floodlink.request.client;

import com.floodlink.request.dto.AnalyzeRequest;
import com.floodlink.request.dto.AnalyzeResult;
import com.floodlink.request.model.HelpRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;

@Component
public class InsightsClient {

    private static final Logger log = LoggerFactory.getLogger(InsightsClient.class);

    private final RestClient restClient;

    // Spring Boot's RestClient.Builder already knows how to write dates as ISO strings ("2025-12-02T10:15:00")
    public InsightsClient(RestClient.Builder builder,
                          @Value("${app.insights-service.url}") String baseUrl,
                          @Value("${app.insights-service.read-timeout-ms}") int readTimeoutMs) {
        // The priority is judged by a local LLM (Ollama), which needs seconds, not milliseconds. The read timeout
        // must be a bit longer than OLLAMA_TIMEOUT_SECONDS in insights-service. If it still runs out, the fallback
        // below saves the request with a default priority, so a citizen is never blocked from asking for help.
        SimpleClientHttpRequestFactory timeouts = new SimpleClientHttpRequestFactory();
        timeouts.setConnectTimeout(2000);
        timeouts.setReadTimeout(readTimeoutMs);
        this.restClient = builder.baseUrl(baseUrl).requestFactory(timeouts).build();
    }

    // userToken = the caller's JWT. We forward it because insights-service validates JWTs too.
    public AnalyzeResult analyze(HelpRequest newRequest, List<HelpRequest> recentRequests, String userToken) {
        AnalyzeRequest body = new AnalyzeRequest(
                AnalyzeRequest.Item.from(newRequest),
                recentRequests.stream().map(AnalyzeRequest.Item::from).toList());
        try {
            AnalyzeResult result = restClient.post().uri("/api/v1/analyze")
                    .header("Authorization", "Bearer " + userToken)
                    .body(body)
                    .retrieve()
                    .body(AnalyzeResult.class);
            return result != null ? result : AnalyzeResult.fallback();
        } catch (RestClientException e) {
            log.warn("insights-service unavailable, using fallback priority: {}", e.getMessage());
            return AnalyzeResult.fallback();
        }
    }
}
