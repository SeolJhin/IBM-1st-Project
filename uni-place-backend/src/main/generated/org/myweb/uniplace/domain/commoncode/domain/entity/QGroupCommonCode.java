package org.myweb.uniplace.domain.commoncode.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QGroupCommonCode is a Querydsl query type for GroupCommonCode
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QGroupCommonCode extends EntityPathBase<GroupCommonCode> {

    private static final long serialVersionUID = -637403421L;

    public static final QGroupCommonCode groupCommonCode = new QGroupCommonCode("groupCommonCode");

    public final org.myweb.uniplace.global.common.QBaseTimeEntity _super = new org.myweb.uniplace.global.common.QBaseTimeEntity(this);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final StringPath description = createString("description");

    public final StringPath groupCode = createString("groupCode");

    public final StringPath groupCodeName = createString("groupCodeName");

    public final NumberPath<Integer> isActive = createNumber("isActive", Integer.class);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public QGroupCommonCode(String variable) {
        super(GroupCommonCode.class, forVariable(variable));
    }

    public QGroupCommonCode(Path<? extends GroupCommonCode> path) {
        super(path.getType(), path.getMetadata());
    }

    public QGroupCommonCode(PathMetadata metadata) {
        super(GroupCommonCode.class, metadata);
    }

}

