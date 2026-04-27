package com.yeschef.api.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "notifications")
public class Notification {

    public enum Type {
        COMMENT, RATING, FRIEND_REQUEST, LIKED, SAVED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "recipient_user_id", nullable = false)
    @JsonIgnore
    private User recipient;

    @ManyToOne
    @JoinColumn(name = "actor_user_id", nullable = false)
    @JsonIgnore
    private User actor;

    // notification is either for a COMMENT, RATING, FRIEND_REQUEST, or LIKED
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Type type;

    // ID of whatever triggered notification
    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    private void onCreate() {
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public User getRecipient() { return recipient; }
    public User getActor() { return actor; }
    public Type getType() { return type; }
    public Long getReferenceId() { return referenceId; }
    public boolean isRead() { return isRead; }
    public Instant getCreatedAt() { return createdAt; }

    public void setRecipient(User recipient) { this.recipient = recipient; }
    public void setActor(User actor) { this.actor = actor; }
    public void setType(Type type) { this.type = type; }
    public void setReferenceId(Long referenceId) { this.referenceId = referenceId; }
    public void setRead(boolean isRead) { this.isRead = isRead; }
}
