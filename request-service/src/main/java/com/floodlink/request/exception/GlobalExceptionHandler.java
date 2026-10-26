// Catches exceptions thrown anywhere in the controllers/services and returns the standard error JSON:
// { status, error, message }. This keeps controllers free of try/catch and gives the frontend one format to read.
package com.floodlink.request.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // Our own business errors (404 not found, 409 already claimed, ...)
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handleApiException(ApiException e) {
        return buildResponse(e.getStatus(), e.getMessage());
    }

    // @Valid failed: list every bad field, e.g. "contactPhone: must be a 10-digit phone number"
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return buildResponse(HttpStatus.BAD_REQUEST, message);
    }

    // Broken JSON or an unknown enum value such as "type": "BOAT"
    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Map<String, Object>> handleUnreadable(Exception e) {
        return buildResponse(HttpStatus.BAD_REQUEST, "Request body or parameter has an invalid value");
    }

    // @PreAuthorize rejected the user's role (e.g. a citizen trying to claim)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException e) {
        return buildResponse(HttpStatus.FORBIDDEN, "Your role is not allowed to do this");
    }

    // Anything else. Spring's own web errors (unknown URL, wrong HTTP method) already know their status code;
    // for truly unexpected errors we log the details for us and send a generic message to the client.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(Exception e) {
        if (e instanceof ErrorResponse springError) {
            HttpStatus status = HttpStatus.valueOf(springError.getStatusCode().value());
            return buildResponse(status, status.getReasonPhrase());
        }
        log.error("Unexpected error", e);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong on the server");
    }

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String message) {
        Map<String, Object> body = Map.of(
                "status", status.value(),
                "error", status.getReasonPhrase(),
                "message", message);
        return ResponseEntity.status(status).body(body);
    }
}
