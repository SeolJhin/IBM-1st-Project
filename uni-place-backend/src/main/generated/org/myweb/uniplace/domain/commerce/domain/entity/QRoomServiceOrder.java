package org.myweb.uniplace.domain.commerce.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QRoomServiceOrder is a Querydsl query type for RoomServiceOrder
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QRoomServiceOrder extends EntityPathBase<RoomServiceOrder> {

    private static final long serialVersionUID = 1702287717L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QRoomServiceOrder roomServiceOrder = new QRoomServiceOrder("roomServiceOrder");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final NumberPath<Integer> orderId = createNumber("orderId", Integer.class);

    public final EnumPath<org.myweb.uniplace.domain.commerce.domain.enums.RoomServiceOrderStatus> orderSt = createEnum("orderSt", org.myweb.uniplace.domain.commerce.domain.enums.RoomServiceOrderStatus.class);

    public final QOrder parentOrder;

    public final org.myweb.uniplace.domain.property.domain.entity.QRoom room;

    public final StringPath roomServiceDesc = createString("roomServiceDesc");

    public final NumberPath<java.math.BigDecimal> totalPrice = createNumber("totalPrice", java.math.BigDecimal.class);

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public final org.myweb.uniplace.domain.user.domain.entity.QUser user;

    public QRoomServiceOrder(String variable) {
        this(RoomServiceOrder.class, forVariable(variable), INITS);
    }

    public QRoomServiceOrder(Path<? extends RoomServiceOrder> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QRoomServiceOrder(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QRoomServiceOrder(PathMetadata metadata, PathInits inits) {
        this(RoomServiceOrder.class, metadata, inits);
    }

    public QRoomServiceOrder(Class<? extends RoomServiceOrder> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.parentOrder = inits.isInitialized("parentOrder") ? new QOrder(forProperty("parentOrder"), inits.get("parentOrder")) : null;
        this.room = inits.isInitialized("room") ? new org.myweb.uniplace.domain.property.domain.entity.QRoom(forProperty("room"), inits.get("room")) : null;
        this.user = inits.isInitialized("user") ? new org.myweb.uniplace.domain.user.domain.entity.QUser(forProperty("user")) : null;
    }

}

