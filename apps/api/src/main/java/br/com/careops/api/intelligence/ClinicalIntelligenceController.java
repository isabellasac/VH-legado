package br.com.careops.api.intelligence;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.careops.api.core.CareopsDataStore;
import br.com.careops.api.intelligence.ClinicalIntelligenceResponse.RagSourceResponse;

@RestController
@RequestMapping("/api/intelligence")
public class ClinicalIntelligenceController {

    private final CareopsDataStore store;

    public ClinicalIntelligenceController(CareopsDataStore store) {
        this.store = store;
    }

    @GetMapping("/sources")
    public List<RagSourceResponse> sources() {
        return store.ragSources().stream()
            .map(source -> new RagSourceResponse(
                source.id(),
                source.title(),
                source.scope(),
                source.version(),
                source.approvedBy(),
                source.approvedAt(),
                source.domain()
            ))
            .toList();
    }
}
