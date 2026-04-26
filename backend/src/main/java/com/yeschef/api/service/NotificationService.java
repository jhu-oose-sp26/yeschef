package com.yeschef.api.service;

import com.yeschef.api.repository.NotificationRepository;
import com.yeschef.api.model.Notification;
import com.yeschef.api.model.User;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public void createNotification(
            User recipient,
            User actor,
            Notification.Type type,
            Long referenceId
    ) {
        if (recipient.getId().equals(actor.getId())) return;

        Notification n = new Notification();
        n.setRecipient(recipient);
        n.setActor(actor);
        n.setType(type);
        n.setReferenceId(referenceId);

        notificationRepository.save(n);
    }
}