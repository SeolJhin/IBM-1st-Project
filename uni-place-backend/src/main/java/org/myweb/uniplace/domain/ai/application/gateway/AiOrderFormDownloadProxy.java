package org.myweb.uniplace.domain.ai.application.gateway;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class AiOrderFormDownloadProxy {

    private final RestClient aiRestClient;
    private final AiGatewayProperties properties;

    public AiOrderFormDownloadProxy(
        @Qualifier("aiRestClient") RestClient aiRestClient,
        AiGatewayProperties properties
    ) {
        this.aiRestClient = aiRestClient;
        this.properties = properties;
    }

    public ResponseEntity<ByteArrayResource> download(String fileName) {
        String encoded = URLEncoder.encode(fileName, StandardCharsets.UTF_8);
        byte[] body = aiRestClient.get()
            .uri(properties.getPaymentOrderFormDownloadPath() + "/" + encoded)
            .retrieve()
            .body(byte[].class);

        byte[] payload = body != null ? body : new byte[0];
        ByteArrayResource resource = new ByteArrayResource(payload);
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
            .contentLength(payload.length)
            .body(resource);
    }
}
