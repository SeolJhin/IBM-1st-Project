package org.myweb.uniplace.domain.commerce.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QOrder is a Querydsl query type for Order
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QOrder extends EntityPathBase<Order> {

    private static final long serialVersionUID = 673821853L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QOrder order = new QOrder("order1");

    public final DateTimePath<java.time.LocalDateTime> orderCreatedAt = createDateTime("orderCreatedAt", java.time.LocalDateTime.class);

    public final NumberPath<Integer> orderId = createNumber("orderId", Integer.class);

    public final ListPath<OrderItem, QOrderItem> orderItems = this.<OrderItem, QOrderItem>createList("orderItems", OrderItem.class, QOrderItem.class, PathInits.DIRECT2);

    public final EnumPath<org.myweb.uniplace.domain.commerce.domain.enums.OrderStatus> orderSt = createEnum("orderSt", org.myweb.uniplace.domain.commerce.domain.enums.OrderStatus.class);

    public final NumberPath<Integer> paymentId = createNumber("paymentId", Integer.class);

    public final ListPath<RoomServiceOrder, QRoomServiceOrder> roomServiceOrders = this.<RoomServiceOrder, QRoomServiceOrder>createList("roomServiceOrders", RoomServiceOrder.class, QRoomServiceOrder.class, PathInits.DIRECT2);

    public final NumberPath<java.math.BigDecimal> totalPrice = createNumber("totalPrice", java.math.BigDecimal.class);

    public final org.myweb.uniplace.domain.user.domain.entity.QUser user;

    public QOrder(String variable) {
        this(Order.class, forVariable(variable), INITS);
    }

    public QOrder(Path<? extends Order> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QOrder(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QOrder(PathMetadata metadata, PathInits inits) {
        this(Order.class, metadata, inits);
    }

    public QOrder(Class<? extends Order> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.user = inits.isInitialized("user") ? new org.myweb.uniplace.domain.user.domain.entity.QUser(forProperty("user")) : null;
    }

}

