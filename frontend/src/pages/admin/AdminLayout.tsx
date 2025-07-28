import React from 'react';
import { Link, Outlet } from 'react-router-dom';
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
                                <Link to="/admin/settlements" className="block py-2 px-4 rounded hover:bg-gray-100 text-gray-600 font-medium">
                                    정산 관리
                                </Link>
                            </li>
                            {/* ... 다른 관리자 메뉴 추가 ... */}
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