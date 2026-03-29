package com.yeschef.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.yeschef.api.model.Friendship;
import com.yeschef.api.model.User;
import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {
    // check to see if a user has a friendship
    Optional<Friendship> findBySelfAndFriend(User self, User friend);
}
