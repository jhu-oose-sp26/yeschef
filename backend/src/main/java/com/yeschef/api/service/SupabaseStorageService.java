package com.yeschef.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Service
public class SupabaseStorageService {

    private static final Logger log = LoggerFactory.getLogger(SupabaseStorageService.class);
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
        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";

        byte[] imageBytes;
        String uploadContentType;
        String uploadName;

        if (isHeic(file, contentType)) {
            imageBytes = convertHeicToJpeg(file.getBytes());
            uploadContentType = "image/jpeg";
            uploadName = "photo.jpg";
        } else {
            imageBytes = file.getBytes();
            uploadContentType = contentType;
            uploadName = originalName;
        }

        String filename = UUID.randomUUID() + "_" + uploadName;

        restClient.post()
            .uri("/" + BUCKET + "/" + filename)
            .contentType(MediaType.parseMediaType(uploadContentType))
            .body(imageBytes)
            .retrieve()
            .toBodilessEntity();

        return supabaseUrl + "/storage/v1/object/public/" + BUCKET + "/" + filename;
    }

    // Detect HEIC by content type first, then fall back to magic bytes.
    // Magic bytes: HEIF container has 'ftyp' at offset 4 and a HEIC/HEIF brand at offset 8.
    private boolean isHeic(MultipartFile file, String contentType) {
        String ct = contentType.toLowerCase();
        if (ct.contains("heic") || ct.contains("heif")) return true;

        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[12];
            if (is.read(header) < 12) return false;
            if (header[4] != 0x66 || header[5] != 0x74 || header[6] != 0x79 || header[7] != 0x70) return false;
            String brand = new String(header, 8, 4, StandardCharsets.ISO_8859_1);
            return brand.startsWith("hei") || brand.equals("mif1") || brand.equals("msf1");
        } catch (IOException e) {
            return false;
        }
    }

    private byte[] convertHeicToJpeg(byte[] heicBytes) throws IOException {
        Path tempIn = null;
        Path tempOut = null;
        try {
            tempIn = Files.createTempFile("heic-in-", ".heic");
            tempOut = Files.createTempFile("heic-out-", ".jpg");
            Files.write(tempIn, heicBytes);

            // ImageMagick 7 uses 'magick'; ImageMagick 6 uses 'convert'
            String[][] candidates = {
                {"magick", tempIn.toString(), "-quality", "85", tempOut.toString()},
                {"convert", tempIn.toString(), "-quality", "85", tempOut.toString()}
            };

            for (String[] cmd : candidates) {
                try {
                    ProcessBuilder pb = new ProcessBuilder(cmd);
                    pb.redirectErrorStream(true);
                    Process process = pb.start();
                    int exitCode = process.waitFor();
                    if (exitCode == 0) {
                        return Files.readAllBytes(tempOut);
                    }
                    log.warn("Command '{}' exited with code {}", cmd[0], exitCode);
                } catch (IOException e) {
                    log.debug("Command '{}' not available: {}", cmd[0], e.getMessage());
                }
            }

            throw new IOException("HEIC conversion failed: ImageMagick not found or conversion unsuccessful. Install ImageMagick locally (brew install imagemagick) or convert your image to JPEG before uploading.");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("HEIC conversion interrupted", e);
        } finally {
            try { if (tempIn != null) Files.deleteIfExists(tempIn); } catch (IOException ignored) {}
            try { if (tempOut != null) Files.deleteIfExists(tempOut); } catch (IOException ignored) {}
        }
    }
}
