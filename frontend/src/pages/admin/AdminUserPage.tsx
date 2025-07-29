// src/pages/admin/AdminUserPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {fetchAllUsers, grantAdminRole, revokeAdminRole, UserSummary} from '../../api/adminApi';
import { Page } from '../../api/userApi';
import useAuthStore from "../../hooks/useAuthStore";

const AdminUserPage = () => {
    const { userInfo } = useAuthStore(); // 본인 여부 확인용
    const [usersPage, setUsersPage] = useState<Page<UserSummary> | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);

    const loadUsers = useCallback(async (page = 0) => {
        setLoading(true);
        try {
            const data = await fetchAllUsers(page);
            setUsersPage(data);
            setCurrentPage(data.number);
        } catch (error) {
            alert("사용자 목록 로딩에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsers(currentPage);
    }, [currentPage, loadUsers]);

    const handleRoleChange = async (targetUser: UserSummary) => {
        const action = targetUser.role === 'ADMIN' ? '해제' : '부여';
        if (window.confirm(`'${targetUser.name}' 사용자의 관리자 권한을 ${action}하시겠습니까?`)) {
            try {
                if (action === '부여') {
                    await grantAdminRole(targetUser.userId);
                } else {
                    // 자기 자신의 권한을 해제하는 것을 방지
                    if (userInfo?.id === targetUser.userId) {
                        alert("자기 자신의 관리자 권한은 해제할 수 없습니다.");
                        return;
                    }
                    await revokeAdminRole(targetUser.userId);
                }
                alert("권한이 변경되었습니다.");
                loadUsers(currentPage); // 목록 새로고침
            } catch (error) {
                alert("권한 변경에 실패했습니다.");
            }
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">사용자 관리</h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full ...">
                    <thead className="bg-gray-50">
                    <tr>
                        <th>ID</th><th>이메일</th><th>이름</th><th>역할</th><th>판매 횟수</th><th className="text-right">작업</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white ...">
                    {usersPage?.content.map(user => (
                        <tr key={user.userId}>
                            <td>{user.userId}</td>
                            <td>{user.email}</td>
                            <td>{user.name}</td>
                            <td>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-purple-200 text-purple-800' : 'bg-gray-200 text-gray-800'}`}>
                                        {user.role}
                                    </span>
                            </td>
                            <td>{user.salesCount}</td>
                            <td className="text-right">
                                <button
                                    onClick={() => handleRoleChange(user)}
                                    className={`text-sm font-semibold px-3 py-1 rounded-md ${
                                        user.role === 'ADMIN' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                                    }`}
                                >
                                    {user.role === 'ADMIN' ? '권한 해제' : '관리자 지정'}
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* 페이징 UI */}
            {usersPage && (
                <div className="flex justify-center items-center mt-6 space-x-2">
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={usersPage.first}>이전</button>
                    <span>{currentPage + 1} / {usersPage.totalPages}</span>
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={usersPage.last}>다음</button>
                </div>
            )}
        </div>
    );
};

export default AdminUserPage;