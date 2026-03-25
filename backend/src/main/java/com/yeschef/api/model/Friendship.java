package com.yeschef.api.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(
    name="friendships",
    uniqueConstraints = @UniqueConstraint(columnNames = {"self_id", "friend_id"}) // (self_id, friend_id) pair can only appear once
)
public class Friendship {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;    

    @ManyToOne
    @JoinColumn(name = "self_id", nullable = false)
    @JsonIgnore
    private User self;

    @ManyToOne
    @JoinColumn(name = "friend_id", nullable = false)
    @JsonIgnore
    private User friend;

    public Long getId() { return id; }
    public User getSelf() { return self; }
    public User getFriend() { return friend; }

    public void setId(Long id) { this.id = id; }
    public void setSelf(User self) { this.self = self; }
    public void setFriend(User friend) { this.friend = friend; }
}