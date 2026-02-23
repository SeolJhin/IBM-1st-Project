package org.myweb.uniplace.domain.billing.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QBillingOrder is a Querydsl query type for BillingOrder
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QBillingOrder extends EntityPathBase<BillingOrder> {

    private static final long serialVersionUID = -131486550L;

    public static final QBillingOrder billingOrder = new QBillingOrder("billingOrder");

    public final NumberPath<java.math.BigDecimal> amount = createNumber("amount", java.math.BigDecimal.class);

    public final NumberPath<Integer> chargeId = createNumber("chargeId", Integer.class);

    public final NumberPath<Integer> contractId = createNumber("contractId", Integer.class);

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final NumberPath<Integer> orderId = createNumber("orderId", Integer.class);

    public final StringPath orderSt = createString("orderSt");

    public final NumberPath<Integer> paymentId = createNumber("paymentId", Integer.class);

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public QBillingOrder(String variable) {
        super(BillingOrder.class, forVariable(variable));
    }

    public QBillingOrder(Path<? extends BillingOrder> path) {
        super(path.getType(), path.getMetadata());
    }

    public QBillingOrder(PathMetadata metadata) {
        super(BillingOrder.class, metadata);
    }

}

