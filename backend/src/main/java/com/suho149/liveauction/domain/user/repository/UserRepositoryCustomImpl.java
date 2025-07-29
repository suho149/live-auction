package com.suho149.liveauction.domain.user.repository;

import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.suho149.liveauction.domain.user.entity.QUser;
import com.suho149.liveauction.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.support.PageableExecutionUtils;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.util.List;

@Slf4j
@Repository
@RequiredArgsConstructor
public class UserRepositoryCustomImpl implements UserRepositoryCustom {
    private final JPAQueryFactory queryFactory;

    @Override
    public Page<User> searchUsers(String name, String email, Pageable pageable) {
        QUser user = QUser.user;

        // 1. 데이터 조회를 위한 메인 쿼리
        List<User> content = queryFactory
                .selectFrom(user)
                .where(
                        nameEq(name),
                        emailEq(email)
                )
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .orderBy(user.id.desc())
                .fetch();

        // 2. 전체 카운트 조회를 위한 쿼리 (페이징을 위해 필요)
        JPAQuery<Long> countQuery = queryFactory
                .select(user.count())
                .from(user)
                .where(
                        nameEq(name),
                        emailEq(email)
                );

        return PageableExecutionUtils.getPage(content, pageable, countQuery::fetchOne);
    }

    // --- BooleanExpression을 사용한 동적 조건절 ---
    private BooleanExpression nameEq(String name) {
        log.info("nameEq called with name: '{}'", name);
        return StringUtils.hasText(name) ? QUser.user.name.contains(name) : null;
    }

    private BooleanExpression emailEq(String email) {
        return StringUtils.hasText(email) ? QUser.user.email.contains(email) : null;
    }
}

