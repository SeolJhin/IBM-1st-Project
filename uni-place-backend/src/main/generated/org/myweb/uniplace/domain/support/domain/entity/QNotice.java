package org.myweb.uniplace.domain.support.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QNotice is a Querydsl query type for Notice
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QNotice extends EntityPathBase<Notice> {

    private static final long serialVersionUID = -1980869029L;

    public static final QNotice notice = new QNotice("notice");

    public final org.myweb.uniplace.global.common.QBaseTimeEntity _super = new org.myweb.uniplace.global.common.QBaseTimeEntity(this);

    public final StringPath code = createString("code");

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final StringPath fileCk = createString("fileCk");

    public final DateTimePath<java.time.LocalDateTime> impEndAt = createDateTime("impEndAt", java.time.LocalDateTime.class);

    public final StringPath importance = createString("importance");

    public final StringPath noticeCtnt = createString("noticeCtnt");

    public final NumberPath<Integer> noticeId = createNumber("noticeId", Integer.class);

    public final EnumPath<org.myweb.uniplace.domain.support.domain.enums.NoticeStatus> noticeSt = createEnum("noticeSt", org.myweb.uniplace.domain.support.domain.enums.NoticeStatus.class);

    public final StringPath noticeTitle = createString("noticeTitle");

    public final NumberPath<Integer> readCount = createNumber("readCount", Integer.class);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> updatedAt = _super.updatedAt;

    public final StringPath userId = createString("userId");

    public QNotice(String variable) {
        super(Notice.class, forVariable(variable));
    }

    public QNotice(Path<? extends Notice> path) {
        super(path.getType(), path.getMetadata());
    }

    public QNotice(PathMetadata metadata) {
        super(Notice.class, metadata);
    }

}

