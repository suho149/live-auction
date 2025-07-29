import React from 'react';
import {Link, NavLink, Outlet} from 'react-router-dom';
import Header from "../../components/Header";

const AdminLayout = () => {
    return (
        <div className="min-h-screen bg-gray-100">
            {/* 1. 헤더 추가 */}
            <Header />

            {/* 2. 메인 컨텐츠 영역을 flex로 감싸기 */}
            <div className="flex">
                {/* 사이드바 */}
                <aside className="w-64 bg-gray-800 text-white p-4 hidden md:block">
                    <h2 className="text-xl font-bold mb-6 text-gray-300">관리 메뉴</h2>
                    <nav>
                        <ul className="space-y-2">
                            <li>
                                <NavLink
                                    to="/admin/settlements"
                                    className={({ isActive }) =>
                                        `block py-2 px-4 rounded transition-colors ${
                                            isActive
                                                ? 'bg-blue-600 text-white font-semibold' // 활성화 상태
                                                : 'text-gray-400 hover:bg-gray-700 hover:text-white' // 비활성화 상태
                                        }`
                                    }
                                >
                                    정산 관리
                                </NavLink>
                            </li>
                            <li>
                                <NavLink
                                    to="/admin/users"
                                    className={({ isActive }) =>
                                        `block py-2 px-4 rounded transition-colors ${
                                            isActive
                                                ? 'bg-blue-600 text-white font-semibold'
                                                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                        }`
                                    }
                                >
                                    사용자 관리
                                </NavLink>
                            </li>
                            {/* '상품 관리' NavLink */}
                            <li>
                                <NavLink
                                    to="/admin/products"
                                    className={({ isActive }) =>
                                        `block py-2 px-4 rounded transition-colors ${
                                            isActive
                                                ? 'bg-blue-600 text-white font-semibold' // 활성 탭: 파란 배경, 흰 글씨
                                                : 'text-gray-400 hover:bg-gray-700 hover:text-white' // 비활성 탭: 연한 회색 글씨, 호버 시 배경/글씨 변경
                                        }`
                                    }
                                >
                                    상품 관리
                                </NavLink>
                            </li>
                        </ul>
                    </nav>
                </aside>

                {/* 메인 컨텐츠 */}
                <main className="flex-1 p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;