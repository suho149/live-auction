package com.suho149.liveauction.domain.product.repository;

import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.suho149.liveauction.domain.product.dto.ProductSearchCondition;
import com.suho149.liveauction.domain.product.entity.Category;
import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.product.entity.ProductStatus;
import jakarta.persistence.EntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static com.suho149.liveauction.domain.product.entity.QProduct.product;
import static org.springframework.util.StringUtils.hasText;

public class ProductRepositoryImpl implements ProductRepositoryCustom {
    private final JPAQueryFactory queryFactory;

    public ProductRepositoryImpl(EntityManager em) {
        this.queryFactory = new JPAQueryFactory(em);
    }

    @Override
    public Page<Product> search(ProductSearchCondition condition, Pageable pageable) {
        List<Product> content = queryFactory
                .selectFrom(product)
                .join(product.seller).fetchJoin() // N+1 방지
                .where(
                        keywordContains(condition.getKeyword()),
                        categoryEq(condition.getCategory()),
                        priceGoe(condition.getMinPrice()),
                        priceLoe(condition.getMaxPrice()),
                        statusIn(condition.getStatuses())
                )
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .orderBy(product.id.desc()) // 정렬 조건도 동적으로 변경 가능
                .fetch();

        // 전체 카운트 쿼리
        Long total = queryFactory
                .select(product.count())
                .from(product)
                // content 쿼리와 동일한 where 조건을 모두 적용
                .where(
                        keywordContains(condition.getKeyword()),
                        categoryEq(condition.getCategory()),
                        priceGoe(condition.getMinPrice()),
                        priceLoe(condition.getMaxPrice()),
                        statusIn(condition.getStatuses())
                )
                .fetchOne();

        // fetchOne()의 결과는 null일 수 있으므로, null 체크 추가
        long totalCount = total == null ? 0 : total;

        return new PageImpl<>(content, pageable, total);
    }

    // --- 동적 where절을 위한 private 메소드들 ---
    private BooleanExpression keywordContains(String keyword) {
        if (!hasText(keyword)) {
            return null;
        }
        // name은 VARCHAR이므로 containsIgnoreCase (lower() 사용)가 효율적
        // description은 CLOB/TEXT이므로 단순 like 검색을 사용
        return product.name.containsIgnoreCase(keyword)
                .or(product.description.like("%" + keyword + "%"));
    }

    private BooleanExpression categoryEq(Category category) {
        return category != null && category != Category.ALL ? product.category.eq(category) : null;
    }

    private BooleanExpression priceGoe(Long minPrice) { // goe = Greater Than or Equal
        return minPrice != null ? product.currentPrice.goe(minPrice) : null;
    }

    private BooleanExpression priceLoe(Long maxPrice) { // loe = Less Than or Equal
        return maxPrice != null ? product.currentPrice.loe(maxPrice) : null;
    }

    private BooleanExpression statusIn(List<ProductStatus> statuses) {
        return statuses != null && !statuses.isEmpty() ? product.status.in(statuses) : null;
    }
}