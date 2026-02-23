package org.myweb.uniplace.domain.affiliate.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QAffiliate is a Querydsl query type for Affiliate
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QAffiliate extends EntityPathBase<Affiliate> {

    private static final long serialVersionUID = -135331032L;

    public static final QAffiliate affiliate = new QAffiliate("affiliate");

    public final StringPath affiliateAddr = createString("affiliateAddr");

    public final StringPath affiliateCeo = createString("affiliateCeo");

    public final StringPath affiliateDesc = createString("affiliateDesc");

    public final StringPath affiliateEmail = createString("affiliateEmail");

    public final DateTimePath<java.time.LocalDateTime> affiliateEndAt = createDateTime("affiliateEndAt", java.time.LocalDateTime.class);

    public final StringPath affiliateFax = createString("affiliateFax");

    public final NumberPath<Integer> affiliateId = createNumber("affiliateId", Integer.class);

    public final StringPath affiliateNm = createString("affiliateNm");

    public final EnumPath<org.myweb.uniplace.domain.affiliate.domain.enums.AffiliateStatus> affiliateSt = createEnum("affiliateSt", org.myweb.uniplace.domain.affiliate.domain.enums.AffiliateStatus.class);

    public final DateTimePath<java.time.LocalDateTime> affiliateStartAt = createDateTime("affiliateStartAt", java.time.LocalDateTime.class);

    public final StringPath affiliateTel = createString("affiliateTel");

    public final NumberPath<Integer> buildingId = createNumber("buildingId", Integer.class);

    public final StringPath businessNo = createString("businessNo");

    public final StringPath code = createString("code");

    public QAffiliate(String variable) {
        super(Affiliate.class, forVariable(variable));
    }

    public QAffiliate(Path<? extends Affiliate> path) {
        super(path.getType(), path.getMetadata());
    }

    public QAffiliate(PathMetadata metadata) {
        super(Affiliate.class, metadata);
    }

}

