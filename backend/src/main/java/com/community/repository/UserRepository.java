package com.community.repository;

import com.community.entity.Community;
import com.community.entity.Role;
import com.community.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u JOIN FETCH u.community WHERE LOWER(u.email) = LOWER(:email)")
    Optional<User> findByEmailWithCommunity(@Param("email") String email);

    boolean existsByEmail(String email);
    List<User> findByCommunity(Community community);
    List<User> findByCommunityId(Long communityId);

    @Query("SELECT u FROM User u JOIN FETCH u.community WHERE u.community.id = :communityId")
    List<User> findByCommunityIdWithCommunity(@Param("communityId") Long communityId);

    long countByCommunityIdAndRole(Long communityId, Role role);
    long countByCommunityId(Long communityId);
}
