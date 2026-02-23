package org.myweb.uniplace.domain.commerce.domain.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QCartItem is a Querydsl query type for CartItem
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QCartItem extends EntityPathBase<CartItem> {

    private static final long serialVersionUID = -2078312796L;

    public static final QCartItem cartItem = new QCartItem("cartItem");

    public final NumberPath<Integer> cartId = createNumber("cartId", Integer.class);

    public final NumberPath<Integer> cartItemId = createNumber("cartItemId", Integer.class);

    public final NumberPath<java.math.BigDecimal> orderPrice = createNumber("orderPrice", java.math.BigDecimal.class);

    public final NumberPath<Integer> orderQuantity = createNumber("orderQuantity", Integer.class);

    public final NumberPath<Integer> prodId = createNumber("prodId", Integer.class);

    public QCartItem(String variable) {
        super(CartItem.class, forVariable(variable));
    }

    public QCartItem(Path<? extends CartItem> path) {
        super(path.getType(), path.getMetadata());
    }

    public QCartItem(PathMetadata metadata) {
        super(CartItem.class, metadata);
    }

}

