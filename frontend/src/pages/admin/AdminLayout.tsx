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
                <aside className="w-64 bg-white shadow-md p-4 hidden md:block"> {/* 모바일에서는 숨김 */}
                    <h2 className="text-xl font-bold mb-6 text-gray-700">관리 메뉴</h2>
                    <nav>
                        <ul>
                            <li>
                                <NavLink
                                    to="/admin/settlements"
                                    className={({ isActive }) =>
                                        `block py-2 px-4 rounded transition-colors ${
                                            isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                        }`
                                    }
                                >
                                    정산 관리
                                </NavLink>
                            </li>
                            {/* ... 다른 관리자 메뉴 추가 ... */}
                            <li>
                                <NavLink
                                    to="/admin/users"
                                    className={({ isActive }) =>
                                        `block py-2 px-4 rounded transition-colors ${
                                            isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                        }`
                                    }
                                >
                                    사용자 관리
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