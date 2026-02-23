package org.myweb.uniplace.domain.payment.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QPaymentRefund is a Querydsl query type for PaymentRefund
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QPaymentRefund extends EntityPathBase<PaymentRefund> {

    private static final long serialVersionUID = 704905714L;

    public static final QPaymentRefund paymentRefund = new QPaymentRefund("paymentRefund");

    public final DateTimePath<java.time.LocalDateTime> completedAt = createDateTime("completedAt", java.time.LocalDateTime.class);

    public final NumberPath<Integer> paymentId = createNumber("paymentId", Integer.class);

    public final NumberPath<Integer> refundId = createNumber("refundId", Integer.class);

    public final NumberPath<java.math.BigDecimal> refundPrice = createNumber("refundPrice", java.math.BigDecimal.class);

    public final StringPath refundReason = createString("refundReason");

    public final EnumPath<PaymentRefund.RefundSt> refundSt = createEnum("refundSt", PaymentRefund.RefundSt.class);

    public QPaymentRefund(String variable) {
        super(PaymentRefund.class, forVariable(variable));
    }

    public QPaymentRefund(Path<? extends PaymentRefund> path) {
        super(path.getType(), path.getMetadata());
    }

    public QPaymentRefund(PathMetadata metadata) {
        super(PaymentRefund.class, metadata);
    }

}

