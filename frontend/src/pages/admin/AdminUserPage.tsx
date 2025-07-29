// src/pages/admin/AdminUserPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {fetchAllUsers, grantAdminRole, revokeAdminRole, UserSummary} from '../../api/adminApi';
import { Page } from '../../api/userApi';
import useAuthStore from "../../hooks/useAuthStore";
import { useSearchParams } from 'react-router-dom';

const AdminUserPage = () => {
    const { userInfo } = useAuthStore(); // 본인 여부 확인용
    const [usersPage, setUsersPage] = useState<Page<UserSummary> | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);

    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState({
        name: searchParams.get('name') || '',
        email: searchParams.get('email') || ''
    });

    const loadUsers = useCallback(async (page?: number, name?: string, email?: string) => {
        setLoading(true);
        try {
            const data = await fetchAllUsers(page || 0, name, email);
            setUsersPage(data);
        } catch (error) {
            alert("사용자 목록 로딩에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    }, []); // 의존성 배열은 비워두거나 [fetchAllUsers]로 변경

    useEffect(() => {
        const name = searchParams.get('name'); // || undefined 제거
        const email = searchParams.get('email');
        const page = Number(searchParams.get('page') || '0');

        loadUsers(page, name ?? undefined, email ?? undefined);
    }, [searchParams, loadUsers]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm({ ...searchTerm, [e.target.name]: e.target.value });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // ★ 3. 검색 시 URL 쿼리 파라미터 업데이트 (페이지는 0으로 초기화)
        setSearchParams({ page: '0', ...searchTerm });
    };

    const handlePageChange = (page: number) => {
        // ★ 4. 페이징 시 기존 검색어 유지
        const currentParams = Object.fromEntries(searchParams.entries());
        setSearchParams({ ...currentParams, page: String(page) });
    };

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

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">사용자 관리</h2>

            <form onSubmit={handleSearch} className="mb-6 p-4 bg-gray-50 rounded-lg flex items-center space-x-4">
                <input
                    type="text"
                    name="name"
                    value={searchTerm.name}
                    onChange={handleInputChange}
                    placeholder="이름으로 검색"
                    className="border px-3 py-2 rounded-md flex-1"
                />
                <input
                    type="text"
                    name="email"
                    value={searchTerm.email}
                    onChange={handleInputChange}
                    placeholder="이메일로 검색"
                    className="border px-3 py-2 rounded-md flex-1"
                />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md">검색</button>
            </form>

            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        {/* 각 th에 너비와 정렬 클래스 추가 */}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/4">이메일</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/4">이름</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">역할</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">판매 횟수</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase w-40">작업</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {/* 로딩 상태 추가 */}
                    {loading ? (
                        <tr><td colSpan={6} className="text-center py-4">사용자 목록을 불러오는 중...</td></tr>
                    ) : usersPage?.content.map(user => (
                        <tr key={user.userId} className="hover:bg-gray-50">
                            {/* 각 td에 클래스 추가 */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.userId}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-xs" title={user.email}>{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                {user.role}
                            </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.salesCount}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                    onClick={() => handleRoleChange(user)}
                                    className={`text-sm font-semibold px-3 py-1 rounded-md transition-colors ${
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