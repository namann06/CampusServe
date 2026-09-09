package com.community.repository;

import com.community.entity.ServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceRepository extends JpaRepository<ServiceEntity, Long> {
    List<ServiceEntity> findByCommunityIdAndIsAvailableTrue(Long communityId);
    List<ServiceEntity> findByCommunityIdAndCategoryIgnoreCaseAndIsAvailableTrue(Long communityId, String category);
    List<ServiceEntity> findByProviderId(Long providerId);
    List<ServiceEntity> findByCommunityId(Long communityId);
    long countByCommunityId(Long communityId);
}
