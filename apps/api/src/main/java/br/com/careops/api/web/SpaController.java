package br.com.careops.api.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Delivers the React entry page for browser navigation to application routes.
 * Static assets remain handled by Spring's resource handler and API routes are
 * intentionally excluded because they are all rooted at /api.
 */
@Controller
public class SpaController {

    @GetMapping({
        "/",
        "/gestao/**",
        "/paciente/**",
        "/parceiro/**",
        "/campanha/**"
    })
    public String index() {
        return "forward:/index.html";
    }
}
