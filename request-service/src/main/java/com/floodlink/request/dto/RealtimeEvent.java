// Body that request-service sends to auth-realtime-service's POST /api/v1/events.
// "event" is the Socket.io event name (e.g. "request:created"), "data" is what browsers receive.
package com.floodlink.request.dto;

public record RealtimeEvent(String event, Object data) {
}
