package org.myweb.uniplace.domain.payment.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QPaymentStatusCode is a Querydsl query type for PaymentStatusCode
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QPaymentStatusCode extends EntityPathBase<PaymentStatusCode> {

    private static final long serialVersionUID = 408092281L;

    public static final QPaymentStatusCode paymentStatusCode = new QPaymentStatusCode("paymentStatusCode");

    public final StringPath desc = createString("desc");

    public final NumberPath<Integer> displayOrder = createNumber("displayOrder", Integer.class);

    public final NumberPath<Integer> isActive = createNumber("isActive", Integer.class);

    public final NumberPath<Integer> isTerminal = createNumber("isTerminal", Integer.class);

    public final StringPath statusCd = createString("statusCd");

    public QPaymentStatusCode(String variable) {
        super(PaymentStatusCode.class, forVariable(variable));
    }

    public QPaymentStatusCode(Path<? extends PaymentStatusCode> path) {
        super(path.getType(), path.getMetadata());
    }

    public QPaymentStatusCode(PathMetadata metadata) {
        super(PaymentStatusCode.class, metadata);
    }

}

