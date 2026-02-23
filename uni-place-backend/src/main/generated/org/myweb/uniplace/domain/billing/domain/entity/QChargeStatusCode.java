package org.myweb.uniplace.domain.billing.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QChargeStatusCode is a Querydsl query type for ChargeStatusCode
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QChargeStatusCode extends EntityPathBase<ChargeStatusCode> {

    private static final long serialVersionUID = 934631018L;

    public static final QChargeStatusCode chargeStatusCode = new QChargeStatusCode("chargeStatusCode");

    public final StringPath description = createString("description");

    public final NumberPath<Integer> displayOrder = createNumber("displayOrder", Integer.class);

    public final NumberPath<Integer> isActive = createNumber("isActive", Integer.class);

    public final NumberPath<Integer> isTerminal = createNumber("isTerminal", Integer.class);

    public final StringPath statusCd = createString("statusCd");

    public QChargeStatusCode(String variable) {
        super(ChargeStatusCode.class, forVariable(variable));
    }

    public QChargeStatusCode(Path<? extends ChargeStatusCode> path) {
        super(path.getType(), path.getMetadata());
    }

    public QChargeStatusCode(PathMetadata metadata) {
        super(ChargeStatusCode.class, metadata);
    }

}

