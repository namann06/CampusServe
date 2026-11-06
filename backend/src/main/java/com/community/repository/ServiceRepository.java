package com.community.repository;

import com.community.entity.ServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceRepository extends JpaRepository<ServiceEntity, Long> {

    @Query("SELECT s FROM ServiceEntity s JOIN FETCH s.provider p WHERE s.community.id = :communityId AND s.isAvailable = true ORDER BY s.id ASC")
    List<ServiceEntity> findByCommunityIdAndIsAvailableTrue(@Param("communityId") Long communityId);

    @Query("SELECT s FROM ServiceEntity s JOIN FETCH s.provider p WHERE s.community.id = :communityId AND LOWER(s.category) = LOWER(:category) AND s.isAvailable = true ORDER BY s.id ASC")
    List<ServiceEntity> findByCommunityIdAndCategoryIgnoreCaseAndIsAvailableTrue(@Param("communityId") Long communityId, @Param("category") String category);

    @Query("SELECT s FROM ServiceEntity s JOIN FETCH s.provider p WHERE s.provider.id = :providerId ORDER BY s.id ASC")
    List<ServiceEntity> findByProviderId(@Param("providerId") Long providerId);

    @Query("SELECT s FROM ServiceEntity s JOIN FETCH s.provider p WHERE s.community.id = :communityId ORDER BY s.id ASC")
    List<ServiceEntity> findByCommunityId(@Param("communityId") Long communityId);

    long countByCommunityId(Long communityId);
}
