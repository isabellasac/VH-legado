package br.com.careops.api.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${careops.cors.allowed-origins:}")
    private String allowedOriginsValue;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        List<String> allowedOrigins = Arrays.stream(allowedOriginsValue.split(","))
            .map(String::trim)
            .filter(origin -> !origin.isEmpty())
            .toList();

        if (allowedOrigins.isEmpty()) {
            allowedOrigins = List.of(
                "http://127.0.0.1:4173",
                "http://localhost:4173",
                "http://127.0.0.1:4190",
                "http://localhost:4190",
                "http://127.0.0.1:4195",
                "http://localhost:4195",
                "http://127.0.0.1:5173",
                "http://localhost:5173"
            );
        }

        registry.addMapping("/api/**")
            .allowedOrigins(allowedOrigins.toArray(String[]::new))
            .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .allowedHeaders("*");
    }
}
