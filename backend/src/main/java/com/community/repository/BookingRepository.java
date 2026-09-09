package com.community.repository;

import com.community.entity.Booking;
import com.community.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    @Query("SELECT b FROM Booking b " +
           "JOIN FETCH b.service s " +
           "JOIN FETCH b.resident r " +
           "JOIN FETCH b.provider p " +
           "LEFT JOIN FETCH b.review rev " +
           "WHERE b.community.id = :communityId " +
           "AND (b.resident.id = :userId OR b.provider.id = :userId) " +
           "ORDER BY b.createdAt DESC")
    List<Booking> findMyBookingsInCommunity(@Param("communityId") Long communityId, @Param("userId") Long userId);

    @Query("SELECT b FROM Booking b " +
           "JOIN FETCH b.service s " +
           "JOIN FETCH b.resident r " +
           "JOIN FETCH b.provider p " +
           "LEFT JOIN FETCH b.review rev " +
           "WHERE b.community.id = :communityId " +
           "ORDER BY b.createdAt DESC")
    List<Booking> findAllByCommunityIdOrderByCreatedAtDesc(@Param("communityId") Long communityId);

    long countByCommunityId(Long communityId);

    long countByCommunityIdAndStatus(Long communityId, BookingStatus status);

    @Query("SELECT COUNT(DISTINCT b.provider.id) FROM Booking b WHERE b.community.id = :communityId AND b.status IN ('ACCEPTED', 'IN_PROGRESS')")
    long countActiveProvidersInCommunity(@Param("communityId") Long communityId);
}
