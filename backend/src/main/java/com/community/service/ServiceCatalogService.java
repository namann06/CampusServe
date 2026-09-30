package com.community.service;

import com.community.config.UserPrincipal;
import com.community.dto.ServiceCreateRequest;
import com.community.dto.ServiceDto;
import com.community.entity.Community;
import com.community.entity.Role;
import com.community.entity.ServiceEntity;
import com.community.entity.User;
import com.community.exception.AppException;
import com.community.repository.CommunityRepository;
import com.community.repository.ServiceRepository;
import com.community.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceCatalogService {

    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;
    private final CommunityRepository communityRepository;

    @Transactional(readOnly = true)
    public List<ServiceDto> getCommunityServices(UserPrincipal currentUser, String category) {
        Long communityId = currentUser.getCommunityId();
        List<ServiceEntity> services;

        if (category != null && !category.isBlank() && !category.equalsIgnoreCase("ALL")) {
            services = serviceRepository.findByCommunityIdAndCategoryIgnoreCaseAndIsAvailableTrue(communityId, category.trim());
        } else {
            services = serviceRepository.findByCommunityIdAndIsAvailableTrue(communityId);
        }

        return services.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ServiceDto> getMyServices(UserPrincipal currentUser) {
        return serviceRepository.findByProviderId(currentUser.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ServiceDto createService(UserPrincipal currentUser, ServiceCreateRequest request) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        // Authority verification: Must be ROLE_PROVIDER or peer provider resident
        boolean isProvider = user.getRole() == Role.ROLE_PROVIDER;
        boolean isPeerProvider = user.getRole() == Role.ROLE_RESIDENT && Boolean.TRUE.equals(user.getIsPeerProvider());

        if (!isProvider && !isPeerProvider) {
            throw new AppException("Only registered providers or peer-providers can list services", HttpStatus.FORBIDDEN);
        }

        Community community = user.getCommunity();

        ServiceEntity service = ServiceEntity.builder()
                .provider(user)
                .community(community)
                .title(request.getTitle().trim())
                .category(request.getCategory().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : "")
                .basePrice(request.getBasePrice())
                .isAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : true)
                .build();

        return mapToDto(serviceRepository.save(service));
    }

    @Transactional
    public ServiceDto toggleAvailability(UserPrincipal currentUser, Long serviceId) {
        ServiceEntity service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new AppException("Service not found with id: " + serviceId, HttpStatus.NOT_FOUND));

        // BOLA / IDOR ownership validation
        if (!service.getProvider().getId().equals(currentUser.getId()) &&
            !currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            throw new AppException("Access denied: You are not authorized to modify this service", HttpStatus.FORBIDDEN);
        }

        service.setIsAvailable(!service.getIsAvailable());
        return mapToDto(serviceRepository.save(service));
    }

    public ServiceDto mapToDto(ServiceEntity service) {
        return ServiceDto.builder()
                .id(service.getId())
                .providerId(service.getProvider().getId())
                .providerName(service.getProvider().getName())
                .providerFlat(service.getProvider().getFlatOrRoomNo())
                .providerPhone(service.getProvider().getPhone())
                .communityId(service.getCommunity().getId())
                .category(service.getCategory())
                .title(service.getTitle())
                .description(service.getDescription())
                .basePrice(service.getBasePrice())
                .isAvailable(service.getIsAvailable())
                .createdAt(service.getCreatedAt())
                .build();
    }
}
