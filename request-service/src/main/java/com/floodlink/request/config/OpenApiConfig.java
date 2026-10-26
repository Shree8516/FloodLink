// Swagger/OpenAPI settings. Adds the title and an "Authorize" button to http://localhost:8080/swagger-ui.html
// so you can paste a JWT (from auth-realtime-service login) and try protected endpoints in the browser.
package com.floodlink.request.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(title = "FloodLink request-service API", version = "v1",
                description = "Flood help requests: create, list, edit, claim, resolve"),
        security = @SecurityRequirement(name = "bearerAuth"))
@SecurityScheme(name = "bearerAuth", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "JWT")
public class OpenApiConfig {
}
