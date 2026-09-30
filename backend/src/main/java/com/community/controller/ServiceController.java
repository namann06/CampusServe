package com.community.controller;

import com.community.config.UserPrincipal;
import com.community.dto.ServiceCreateRequest;
import com.community.dto.ServiceDto;
import com.community.service.ServiceCatalogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class ServiceController {

    private final ServiceCatalogService serviceCatalogService;

    @GetMapping
    public ResponseEntity<List<ServiceDto>> getServices(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(serviceCatalogService.getCommunityServices(currentUser, category));
    }

    @GetMapping("/my-services")
    public ResponseEntity<List<ServiceDto>> getMyServices(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(serviceCatalogService.getMyServices(currentUser));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PROVIDER', 'RESIDENT')")
    public ResponseEntity<ServiceDto> createService(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody ServiceCreateRequest request) {
        ServiceDto created = serviceCatalogService.createService(currentUser, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{id}/toggle-availability")
    public ResponseEntity<ServiceDto> toggleAvailability(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {
        return ResponseEntity.ok(serviceCatalogService.toggleAvailability(currentUser, id));
    }
}
