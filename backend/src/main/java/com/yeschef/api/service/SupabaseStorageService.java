package com.yeschef.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
public class SupabaseStorageService {

    private final RestClient restClient;
    private final String supabaseUrl;
    private static final String BUCKET = "post-images";

    public SupabaseStorageService(
        @Value("${supabase.url}") String supabaseUrl,
        @Value("${supabase.service-key}") String serviceKey
    ) {
        this.supabaseUrl = supabaseUrl;
        this.restClient = RestClient.builder()
            .baseUrl(supabaseUrl + "/storage/v1/object")
            .defaultHeader("Authorization", "Bearer " + serviceKey)
            .build();
    }

    public String uploadImage(MultipartFile file) throws IOException {
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload";
        String filename = UUID.randomUUID() + "_" + originalName;
        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";

        restClient.post()
            .uri("/" + BUCKET + "/" + filename)
            .contentType(MediaType.parseMediaType(contentType))
            .body(file.getBytes())
            .retrieve()
            .toBodilessEntity();

        return supabaseUrl + "/storage/v1/object/public/" + BUCKET + "/" + filename;
    }
}
