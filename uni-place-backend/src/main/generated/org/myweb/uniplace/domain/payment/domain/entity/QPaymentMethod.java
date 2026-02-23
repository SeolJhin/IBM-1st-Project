package org.myweb.uniplace.domain.payment.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QPaymentMethod is a Querydsl query type for PaymentMethod
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QPaymentMethod extends EntityPathBase<PaymentMethod> {

    private static final long serialVersionUID = 562164571L;

    public static final QPaymentMethod paymentMethod = new QPaymentMethod("paymentMethod");

    public final NumberPath<Integer> isActive = createNumber("isActive", Integer.class);

    public final StringPath paymentMethodCd = createString("paymentMethodCd");

    public final NumberPath<Integer> paymentMethodId = createNumber("paymentMethodId", Integer.class);

    public final StringPath paymentMethodNm = createString("paymentMethodNm");

    public QPaymentMethod(String variable) {
        super(PaymentMethod.class, forVariable(variable));
    }

    public QPaymentMethod(Path<? extends PaymentMethod> path) {
        super(path.getType(), path.getMetadata());
    }

    public QPaymentMethod(PathMetadata metadata) {
        super(PaymentMethod.class, metadata);
    }

}

