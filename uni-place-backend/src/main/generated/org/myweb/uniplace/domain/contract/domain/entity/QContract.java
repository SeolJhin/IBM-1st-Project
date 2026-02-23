package org.myweb.uniplace.domain.contract.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QContract is a Querydsl query type for Contract
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QContract extends EntityPathBase<Contract> {

    private static final long serialVersionUID = -1362921140L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QContract contract = new QContract("contract");

    public final DatePath<java.time.LocalDate> contractEnd = createDate("contractEnd", java.time.LocalDate.class);

    public final NumberPath<Integer> contractId = createNumber("contractId", Integer.class);

    public final NumberPath<Integer> contractPdfFileId = createNumber("contractPdfFileId", Integer.class);

    public final EnumPath<org.myweb.uniplace.domain.contract.domain.enums.ContractStatus> contractSt = createEnum("contractSt", org.myweb.uniplace.domain.contract.domain.enums.ContractStatus.class);

    public final DatePath<java.time.LocalDate> contractStart = createDate("contractStart", java.time.LocalDate.class);

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final NumberPath<java.math.BigDecimal> deposit = createNumber("deposit", java.math.BigDecimal.class);

    public final StringPath lessorAddr = createString("lessorAddr");

    public final StringPath lessorName = createString("lessorName");

    public final StringPath lessorRrn = createString("lessorRrn");

    public final NumberPath<Integer> lessorSignFileId = createNumber("lessorSignFileId", Integer.class);

    public final StringPath lessorTel = createString("lessorTel");

    public final NumberPath<java.math.BigDecimal> manageFee = createNumber("manageFee", java.math.BigDecimal.class);

    public final DateTimePath<java.time.LocalDateTime> moveinAt = createDateTime("moveinAt", java.time.LocalDateTime.class);

    public final NumberPath<Integer> paymentDay = createNumber("paymentDay", Integer.class);

    public final NumberPath<java.math.BigDecimal> rentPrice = createNumber("rentPrice", java.math.BigDecimal.class);

    public final EnumPath<Contract.RentType> rentType = createEnum("rentType", Contract.RentType.class);

    public final org.myweb.uniplace.domain.property.domain.entity.QRoom room;

    public final DateTimePath<java.time.LocalDateTime> signAt = createDateTime("signAt", java.time.LocalDateTime.class);

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public final org.myweb.uniplace.domain.user.domain.entity.QUser user;

    public QContract(String variable) {
        this(Contract.class, forVariable(variable), INITS);
    }

    public QContract(Path<? extends Contract> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QContract(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QContract(PathMetadata metadata, PathInits inits) {
        this(Contract.class, metadata, inits);
    }

    public QContract(Class<? extends Contract> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.room = inits.isInitialized("room") ? new org.myweb.uniplace.domain.property.domain.entity.QRoom(forProperty("room"), inits.get("room")) : null;
        this.user = inits.isInitialized("user") ? new org.myweb.uniplace.domain.user.domain.entity.QUser(forProperty("user")) : null;
    }

}

