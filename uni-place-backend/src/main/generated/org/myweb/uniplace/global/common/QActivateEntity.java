package org.myweb.uniplace.global.common;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QActivateEntity is a Querydsl query type for ActivateEntity
 */
@Generated("com.querydsl.codegen.DefaultSupertypeSerializer")
public class QActivateEntity extends EntityPathBase<ActivateEntity> {

    private static final long serialVersionUID = -968948139L;

    public static final QActivateEntity activateEntity = new QActivateEntity("activateEntity");

    public final QBaseTimeEntity _super = new QBaseTimeEntity(this);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final NumberPath<Integer> isActive = createNumber("isActive", Integer.class);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public QActivateEntity(String variable) {
        super(ActivateEntity.class, forVariable(variable));
    }

    public QActivateEntity(Path<? extends ActivateEntity> path) {
        super(path.getType(), path.getMetadata());
    }

    public QActivateEntity(PathMetadata metadata) {
        super(ActivateEntity.class, metadata);
    }

}

