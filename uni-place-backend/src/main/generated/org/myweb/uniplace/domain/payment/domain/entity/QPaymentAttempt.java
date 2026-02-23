package org.myweb.uniplace.domain.payment.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QPaymentAttempt is a Querydsl query type for PaymentAttempt
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QPaymentAttempt extends EntityPathBase<PaymentAttempt> {

    private static final long serialVersionUID = -1383530605L;

    public static final QPaymentAttempt paymentAttempt = new QPaymentAttempt("paymentAttempt");

    public final NumberPath<Integer> attemptId = createNumber("attemptId", Integer.class);

    public final EnumPath<PaymentAttempt.AttemptSt> attemptSt = createEnum("attemptSt", PaymentAttempt.AttemptSt.class);

    public final DateTimePath<java.time.LocalDateTime> finishedAt = createDateTime("finishedAt", java.time.LocalDateTime.class);

    public final NumberPath<Integer> paymentId = createNumber("paymentId", Integer.class);

    public QPaymentAttempt(String variable) {
        super(PaymentAttempt.class, forVariable(variable));
    }

    public QPaymentAttempt(Path<? extends PaymentAttempt> path) {
        super(path.getType(), path.getMetadata());
    }

    public QPaymentAttempt(PathMetadata metadata) {
        super(PaymentAttempt.class, metadata);
    }

}

