package org.myweb.uniplace.domain.support.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QQna is a Querydsl query type for Qna
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QQna extends EntityPathBase<Qna> {

    private static final long serialVersionUID = -650126015L;

    public static final QQna qna = new QQna("qna");

    public final org.myweb.uniplace.global.common.QBaseTimeEntity _super = new org.myweb.uniplace.global.common.QBaseTimeEntity(this);

    public final StringPath code = createString("code");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final StringPath fileCk = createString("fileCk");

    public final NumberPath<Integer> groupId = createNumber("groupId", Integer.class);

    public final NumberPath<Integer> parentId = createNumber("parentId", Integer.class);

    public final StringPath qnaCtnt = createString("qnaCtnt");

    public final NumberPath<Integer> qnaId = createNumber("qnaId", Integer.class);

    public final NumberPath<Integer> qnaLev = createNumber("qnaLev", Integer.class);

    public final EnumPath<org.myweb.uniplace.domain.support.domain.enums.QnaStatus> qnaSt = createEnum("qnaSt", org.myweb.uniplace.domain.support.domain.enums.QnaStatus.class);

    public final StringPath qnaTitle = createString("qnaTitle");

    public final NumberPath<Integer> readCount = createNumber("readCount", Integer.class);

    public final StringPath replyCk = createString("replyCk");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public final StringPath userId = createString("userId");

    public QQna(String variable) {
        super(Qna.class, forVariable(variable));
    }

    public QQna(Path<? extends Qna> path) {
        super(path.getType(), path.getMetadata());
    }

    public QQna(PathMetadata metadata) {
        super(Qna.class, metadata);
    }

}

