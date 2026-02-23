package org.myweb.uniplace.domain.payment.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QPaymentIntent is a Querydsl query type for PaymentIntent
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QPaymentIntent extends EntityPathBase<PaymentIntent> {

    private static final long serialVersionUID = 455956758L;

    public static final QPaymentIntent paymentIntent = new QPaymentIntent("paymentIntent");

    public final StringPath appSchemeUrl = createString("appSchemeUrl");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final StringPath failCode = createString("failCode");

    public final StringPath failMessage = createString("failMessage");

    public final EnumPath<PaymentIntentStatus> intentSt = createEnum("intentSt", PaymentIntentStatus.class);

    public final NumberPath<Integer> paymentId = createNumber("paymentId", Integer.class);

    public final NumberPath<Long> paymentIntentId = createNumber("paymentIntentId", Long.class);

    public final StringPath pgApproveJson = createString("pgApproveJson");

    public final StringPath pgReadyJson = createString("pgReadyJson");

    public final StringPath providerRefId = createString("providerRefId");

    public final StringPath returnedParamsJson = createString("returnedParamsJson");

    public final StringPath returnUrl = createString("returnUrl");

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public QPaymentIntent(String variable) {
        super(PaymentIntent.class, forVariable(variable));
    }

    public QPaymentIntent(Path<? extends PaymentIntent> path) {
        super(path.getType(), path.getMetadata());
    }

    public QPaymentIntent(PathMetadata metadata) {
        super(PaymentIntent.class, metadata);
    }

}

