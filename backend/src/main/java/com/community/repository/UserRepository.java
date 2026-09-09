package com.community.repository;

import com.community.entity.Community;
import com.community.entity.Role;
import com.community.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByCommunity(Community community);
    long countByCommunityIdAndRole(Long communityId, Role role);
    long countByCommunityId(Long communityId);
}
