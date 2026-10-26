// Entry point of request-service. Started with `mvn spring-boot:run`.
// Spring scans this package and its sub-packages for controllers, services, repositories and config.
package com.floodlink.request;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

// Users live in auth-realtime-service, not here, so we switch off Spring's default in-memory user
// (otherwise it would print a random password at startup).
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class RequestServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(RequestServiceApplication.class, args);
    }
}
