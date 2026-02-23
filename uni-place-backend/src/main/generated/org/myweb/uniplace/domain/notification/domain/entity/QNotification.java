package org.myweb.uniplace.domain.notification.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QNotification is a Querydsl query type for Notification
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QNotification extends EntityPathBase<Notification> {

    private static final long serialVersionUID = -306379220L;

    public static final QNotification notification = new QNotification("notification");

    public final EnumPath<org.myweb.uniplace.domain.notification.domain.enums.NotificationType> code = createEnum("code", org.myweb.uniplace.domain.notification.domain.enums.NotificationType.class);

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final StringPath isRead = createString("isRead");

    public final DateTimePath<java.time.LocalDateTime> isReadAt = createDateTime("isReadAt", java.time.LocalDateTime.class);

    public final StringPath message = createString("message");

    public final NumberPath<Integer> notificationId = createNumber("notificationId", Integer.class);

    public final StringPath receiverId = createString("receiverId");

    public final StringPath senderId = createString("senderId");

    public final EnumPath<org.myweb.uniplace.domain.notification.domain.enums.TargetType> target = createEnum("target", org.myweb.uniplace.domain.notification.domain.enums.TargetType.class);

    public final NumberPath<Integer> targetId = createNumber("targetId", Integer.class);

    public final StringPath urlPath = createString("urlPath");

    public QNotification(String variable) {
        super(Notification.class, forVariable(variable));
    }

    public QNotification(Path<? extends Notification> path) {
        super(path.getType(), path.getMetadata());
    }

    public QNotification(PathMetadata metadata) {
        super(Notification.class, metadata);
    }

}

