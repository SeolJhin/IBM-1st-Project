package org.myweb.uniplace.domain.system.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QCompanyInfo is a Querydsl query type for CompanyInfo
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QCompanyInfo extends EntityPathBase<CompanyInfo> {

    private static final long serialVersionUID = -572909586L;

    public static final QCompanyInfo companyInfo = new QCompanyInfo("companyInfo");

    public final StringPath businessNo = createString("businessNo");

    public final StringPath companyAddr = createString("companyAddr");

    public final StringPath companyCeo = createString("companyCeo");

    public final StringPath companyEmail = createString("companyEmail");

    public final NumberPath<Integer> companyId = createNumber("companyId", Integer.class);

    public final StringPath companyNm = createString("companyNm");

    public final StringPath companyTel = createString("companyTel");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public QCompanyInfo(String variable) {
        super(CompanyInfo.class, forVariable(variable));
    }

    public QCompanyInfo(Path<? extends CompanyInfo> path) {
        super(path.getType(), path.getMetadata());
    }

    public QCompanyInfo(PathMetadata metadata) {
        super(CompanyInfo.class, metadata);
    }

}

