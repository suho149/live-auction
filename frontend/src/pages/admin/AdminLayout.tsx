import React from 'react';
import {Link, NavLink, Outlet} from 'react-router-dom';
import Header from "../../components/Header";

const AdminLayout = () => {
    // NavLink의 활성/비활성 상태에 따른 스타일 클래스를 변수로 추출하여 재사용
    const linkClasses = ({ isActive }: { isActive: boolean }) =>
        `block py-2 px-4 rounded transition-colors ${
            isActive
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
        }`;

    return (
        <div className="min-h-screen bg-gray-100">
            <Header />
            <div className="flex" style={{ height: 'calc(100vh - 73px)' }}> {/* 헤더 높이를 제외한 전체 높이 */}
                {/* 사이드바 */}
                <aside className="w-64 bg-gray-800 text-white p-4 hidden md:block">
                    <h2 className="text-xl font-bold mb-6 text-gray-300">관리 메뉴</h2>
                    <nav>
                        <ul className="space-y-2">
                            {/* ★★★ 대시보드 NavLink 추가 ★★★ */}
                            <li>
                                <NavLink to="/admin/dashboard" className={linkClasses}>
                                    대시보드
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/admin/settlements" className={linkClasses}>
                                    정산 관리
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/admin/users" className={linkClasses}>
                                    사용자 관리
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/admin/products" className={linkClasses}>
                                    상품 관리
                                </NavLink>
                            </li>
                        </ul>
                    </nav>
                </aside>

                {/* 메인 컨텐츠 */}
                <main className="flex-1 p-8 overflow-y-auto"> {/* 컨텐츠가 길어질 경우 스크롤되도록 */}
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;