package org.myweb.uniplace.global.common;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QSoftDeleteEntity is a Querydsl query type for SoftDeleteEntity
 */
@Generated("com.querydsl.codegen.DefaultSupertypeSerializer")
public class QSoftDeleteEntity extends EntityPathBase<SoftDeleteEntity> {

    private static final long serialVersionUID = 1099446935L;

    public static final QSoftDeleteEntity softDeleteEntity = new QSoftDeleteEntity("softDeleteEntity");

    public final QBaseTimeEntity _super = new QBaseTimeEntity(this);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final StringPath deleteYn = createString("deleteYn");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public QSoftDeleteEntity(String variable) {
        super(SoftDeleteEntity.class, forVariable(variable));
    }

    public QSoftDeleteEntity(Path<? extends SoftDeleteEntity> path) {
        super(path.getType(), path.getMetadata());
    }

    public QSoftDeleteEntity(PathMetadata metadata) {
        super(SoftDeleteEntity.class, metadata);
    }

}

