package org.myweb.uniplace.domain.support.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QComplain is a Querydsl query type for Complain
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QComplain extends EntityPathBase<Complain> {

    private static final long serialVersionUID = 1165626284L;

    public static final QComplain complain = new QComplain("complain");

    public final org.myweb.uniplace.global.common.QBaseTimeEntity _super = new org.myweb.uniplace.global.common.QBaseTimeEntity(this);

    public final StringPath code = createString("code");

    public final StringPath compCtnt = createString("compCtnt");

    public final NumberPath<Integer> compId = createNumber("compId", Integer.class);

    public final EnumPath<org.myweb.uniplace.domain.support.domain.enums.ComplainStatus> compSt = createEnum("compSt", org.myweb.uniplace.domain.support.domain.enums.ComplainStatus.class);

    public final StringPath compTitle = createString("compTitle");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final StringPath fileCk = createString("fileCk");

    public final StringPath replyCk = createString("replyCk");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public final StringPath userId = createString("userId");

    public QComplain(String variable) {
        super(Complain.class, forVariable(variable));
    }

    public QComplain(Path<? extends Complain> path) {
        super(path.getType(), path.getMetadata());
    }

    public QComplain(PathMetadata metadata) {
        super(Complain.class, metadata);
    }

}

