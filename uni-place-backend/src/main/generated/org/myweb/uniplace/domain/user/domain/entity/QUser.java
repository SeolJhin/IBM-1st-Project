package org.myweb.uniplace.domain.user.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QUser is a Querydsl query type for User
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QUser extends EntityPathBase<User> {

    private static final long serialVersionUID = -1267943380L;

    public static final QUser user = new QUser("user");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final StringPath deleteYN = createString("deleteYN");

    public final DateTimePath<java.time.LocalDateTime> lastLoginAt = createDateTime("lastLoginAt", java.time.LocalDateTime.class);

    public final DatePath<java.time.LocalDate> userBirth = createDate("userBirth", java.time.LocalDate.class);

    public final StringPath userEmail = createString("userEmail");

    public final StringPath userId = createString("userId");

    public final StringPath userNm = createString("userNm");

    public final StringPath userPwd = createString("userPwd");

    public final EnumPath<org.myweb.uniplace.domain.user.domain.enums.UserRole> userRole = createEnum("userRole", org.myweb.uniplace.domain.user.domain.enums.UserRole.class);

    public final EnumPath<org.myweb.uniplace.domain.user.domain.enums.UserStatus> userSt = createEnum("userSt", org.myweb.uniplace.domain.user.domain.enums.UserStatus.class);

    public final StringPath userTel = createString("userTel");

    public QUser(String variable) {
        super(User.class, forVariable(variable));
    }

    public QUser(Path<? extends User> path) {
        super(path.getType(), path.getMetadata());
    }

    public QUser(PathMetadata metadata) {
        super(User.class, metadata);
    }

}

