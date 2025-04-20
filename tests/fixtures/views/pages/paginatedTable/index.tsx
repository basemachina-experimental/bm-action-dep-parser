import { useExecuteActionLazy } from "@basemachina/view";
import React, { useState, useEffect, useCallback } from "react";
import { Box, Heading, Flex, Card } from "@chakra-ui/react";
import PaginatedTable from "./table";
import { formatDate } from "../utils/format";
import { Column } from "./types";

// モックデータ型定義
type User = {
    id: number;
    name: string;
    email: string;
    role: string;
    status: "active" | "inactive";
    lastLogin: string;
};

// モックデータ（20件）
const mockUsers: User[] = [
    { id: 1, name: "山田 太郎", email: "yamada@example.com", role: "管理者", status: "active", lastLogin: "2025-03-01T10:00:00" },
    { id: 2, name: "佐藤 花子", email: "sato@example.com", role: "一般ユーザー", status: "active", lastLogin: "2025-03-02T11:30:00" },
    { id: 3, name: "鈴木 一郎", email: "suzuki@example.com", role: "一般ユーザー", status: "inactive", lastLogin: "2025-02-25T09:15:00" },
    { id: 4, name: "田中 みどり", email: "tanaka@example.com", role: "管理者", status: "active", lastLogin: "2025-03-03T08:45:00" },
    { id: 5, name: "渡辺 健太", email: "watanabe@example.com", role: "一般ユーザー", status: "active", lastLogin: "2025-03-01T14:20:00" },
    { id: 6, name: "伊藤 麻衣", email: "ito@example.com", role: "一般ユーザー", status: "inactive", lastLogin: "2025-02-20T16:30:00" },
    { id: 7, name: "中村 大輔", email: "nakamura@example.com", role: "一般ユーザー", status: "active", lastLogin: "2025-03-04T09:10:00" },
    { id: 8, name: "小林 優子", email: "kobayashi@example.com", role: "管理者", status: "active", lastLogin: "2025-03-02T10:45:00" },
    { id: 9, name: "加藤 浩二", email: "kato@example.com", role: "一般ユーザー", status: "inactive", lastLogin: "2025-02-28T11:20:00" },
    { id: 10, name: "松本 真一", email: "matsumoto@example.com", role: "一般ユーザー", status: "active", lastLogin: "2025-03-03T13:15:00" },
    { id: 11, name: "井上 真理子", email: "inoue@example.com", role: "一般ユーザー", status: "active", lastLogin: "2025-03-01T08:50:00" },
    { id: 12, name: "木村 健一", email: "kimura@example.com", role: "管理者", status: "active", lastLogin: "2025-03-04T15:30:00" },
    { id: 13, name: "林 隆太", email: "hayashi@example.com", role: "一般ユーザー", status: "inactive", lastLogin: "2025-02-26T10:15:00" },
    { id: 14, name: "清水 恵子", email: "shimizu@example.com", role: "一般ユーザー", status: "active", lastLogin: "2025-03-02T14:20:00" },
    { id: 15, name: "山本 裕子", email: "yamamoto@example.com", role: "一般ユーザー", status: "active", lastLogin: "2025-03-03T09:45:00" },
    { id: 16, name: "阿部 直樹", email: "abe@example.com", role: "管理者", status: "active", lastLogin: "2025-03-01T11:30:00" },
    { id: 17, name: "森 康弘", email: "mori@example.com", role: "一般ユーザー", status: "inactive", lastLogin: "2025-02-27T16:45:00" },
    { id: 18, name: "高橋 美咲", email: "takahashi@example.com", role: "一般ユーザー", status: "active", lastLogin: "2025-03-04T10:20:00" },
    { id: 19, name: "斎藤 健太郎", email: "saito@example.com", role: "一般ユーザー", status: "active", lastLogin: "2025-03-02T08:30:00" },
    { id: 20, name: "石井 真由美", email: "ishii@example.com", role: "管理者", status: "active", lastLogin: "2025-03-03T14:15:00" }
];

// カラム定義
const columns: Column<User>[] = [
    { key: "id", header: "ID", width: "60px" },
    { key: "name", header: "氏名" },
    { key: "email", header: "メールアドレス" },
    { key: "role", header: "役割" },
    {
        key: "status",
        header: "ステータス",
        formatter: (value: "active" | "inactive") =>
            value === "active" ? "有効" : "無効"
    },
    {
        key: "lastLogin",
        header: "最終ログイン",
        formatter: (value: string) => formatDate(value)
    },
];

// デモコンポーネント
const PaginatedTableDemo = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5; // 1ページあたり5件表示

    const [getUsersAction, { data, loading: actionLoading, error }] =
        useExecuteActionLazy("get-users");

    // ユーザーデータの状態
    const [users, setUsers] = useState<User[]>([]);
    const [totalCount, setTotalCount] = useState(0);

    // ページ変更時のアクション実行
    const handlePageChangeWithAction = useCallback((page: number) => {
        setCurrentPage(page);

        // アクションを実行してユーザーデータを取得
        getUsersAction({
            page,
            pageSize,
            // 必要に応じて検索条件などのパラメータを追加
        });
    }, [getUsersAction, pageSize]);

    // データが変更されたときの処理
    useEffect(() => {
        if (data && data.results && data.results[0]?.success) {
            const result = data.results[0].success;
            setUsers(result.users);
            setTotalCount(result.totalCount);
        }
    }, [data]);

    // 初回レンダリング時にデータを取得
    useEffect(() => {
        handlePageChangeWithAction(1);
    }, [handlePageChangeWithAction]);

    // アクションを使用する場合のページネーションの総ページ数
    const totalPagesFromAction = Math.ceil(totalCount / pageSize);

    return (
        <Flex direction="column" gap={4} w="100%" h="100%">
            <Heading size="md">ユーザー一覧</Heading>

            <Card p={4}>
                <PaginatedTable
                    data={users}
                    columns={columns}
                    pagination={{
                        currentPage,
                        totalPages: totalPagesFromAction,
                        pageSize,
                        totalItems: totalCount
                    }}
                    onPageChange={handlePageChangeWithAction}
                    loading={actionLoading}
                    emptyMessage="ユーザーが見つかりません"
                />

            </Card>
        </Flex>
    );
};

export default PaginatedTableDemo;