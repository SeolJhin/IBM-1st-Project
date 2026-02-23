package org.myweb.uniplace.domain.payment.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QPayment is a Querydsl query type for Payment
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QPayment extends EntityPathBase<Payment> {

    private static final long serialVersionUID = -1641184806L;

    public static final QPayment payment = new QPayment("payment");

    public final NumberPath<java.math.BigDecimal> capturedPrice = createNumber("capturedPrice", java.math.BigDecimal.class);

    public final StringPath currency = createString("currency");

    public final StringPath idempotencyKey = createString("idempotencyKey");

    public final StringPath merchantUid = createString("merchantUid");

    public final DateTimePath<java.time.LocalDateTime> paidAt = createDateTime("paidAt", java.time.LocalDateTime.class);

    public final NumberPath<Integer> paymentId = createNumber("paymentId", Integer.class);

    public final NumberPath<Integer> paymentMethodId = createNumber("paymentMethodId", Integer.class);

    public final StringPath paymentSt = createString("paymentSt");

    public final StringPath provider = createString("provider");

    public final StringPath providerPaymentId = createString("providerPaymentId");

    public final NumberPath<Integer> serviceGoodsId = createNumber("serviceGoodsId", Integer.class);

    public final NumberPath<Integer> targetId = createNumber("targetId", Integer.class);

    public final StringPath targetType = createString("targetType");

    public final NumberPath<java.math.BigDecimal> taxExScopePrice = createNumber("taxExScopePrice", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> taxFreePrice = createNumber("taxFreePrice", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> taxScopePrice = createNumber("taxScopePrice", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> totalPrice = createNumber("totalPrice", java.math.BigDecimal.class);

    public final StringPath userId = createString("userId");

    public QPayment(String variable) {
        super(Payment.class, forVariable(variable));
    }

    public QPayment(Path<? extends Payment> path) {
        super(path.getType(), path.getMetadata());
    }

    public QPayment(PathMetadata metadata) {
        super(Payment.class, metadata);
    }

}

