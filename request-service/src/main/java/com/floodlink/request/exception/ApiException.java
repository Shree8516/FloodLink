// One exception type for all "expected" errors (not found, already claimed, wrong password...).
// Services throw it with an HTTP status; GlobalExceptionHandler turns it into the standard JSON error.
package com.floodlink.request.exception;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
