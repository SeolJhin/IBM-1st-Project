package org.myweb.uniplace.domain.billing.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QMonthlyCharge is a Querydsl query type for MonthlyCharge
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QMonthlyCharge extends EntityPathBase<MonthlyCharge> {

    private static final long serialVersionUID = -2045959958L;

    public static final QMonthlyCharge monthlyCharge = new QMonthlyCharge("monthlyCharge");

    public final StringPath billingDt = createString("billingDt");

    public final NumberPath<Integer> chargeId = createNumber("chargeId", Integer.class);

    public final StringPath chargeSt = createString("chargeSt");

    public final StringPath chargeType = createString("chargeType");

    public final NumberPath<Integer> contractId = createNumber("contractId", Integer.class);

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final NumberPath<Integer> paymentId = createNumber("paymentId", Integer.class);

    public final NumberPath<java.math.BigDecimal> price = createNumber("price", java.math.BigDecimal.class);

    public QMonthlyCharge(String variable) {
        super(MonthlyCharge.class, forVariable(variable));
    }

    public QMonthlyCharge(Path<? extends MonthlyCharge> path) {
        super(path.getType(), path.getMetadata());
    }

    public QMonthlyCharge(PathMetadata metadata) {
        super(MonthlyCharge.class, metadata);
    }

}

