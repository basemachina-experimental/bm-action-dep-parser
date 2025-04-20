import {
    VStack,
    HStack,
    Box,
    Text,
    Button,
    Flex,
    FormControl,
    FormLabel,
    Input,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    useToast,
} from "@chakra-ui/react";
import { executeAction, useExecuteAction } from "@basemachina/view";
import { useCallback, useState } from "react";

// カテゴリ情報のモックデータ
const categoryData = {
    id: 1,
    name: "化粧品",
};

// 商品の型定義
type Product = {
    id: number;
    jinCode: string;
    name: string;
    order: number;
};

const SortableForm = () => {
    const { data, loading, error } = useExecuteAction("get-products", {
        categoryId: 1,
    });

    // 商品リストの状態
    const [products, setProducts] = useState<Product[]>(
        data.results[0].success || []
    );

    // 商品を上に移動する処理
    const moveUp = useCallback((index: number) => {
        if (index <= 0) return;

        const newProducts = [...products];
        const temp = newProducts[index];
        newProducts[index] = newProducts[index - 1];
        newProducts[index - 1] = temp;

        // orderの値を更新
        newProducts.forEach((product, i) => {
            product.order = i + 1;
        });

        setProducts(newProducts);
    }, [products]);

    // 商品を下に移動する処理
    const moveDown = useCallback((index: number) => {
        if (index >= products.length - 1) return;

        const newProducts = [...products];
        const temp = newProducts[index];
        newProducts[index] = newProducts[index + 1];
        newProducts[index + 1] = temp;

        // orderの値を更新
        newProducts.forEach((product, i) => {
            product.order = i + 1;
        });

        setProducts(newProducts);
    }, [products]);

    // フォームの状態
    const [categoryName, setCategoryName] = useState(categoryData.name);

    // 入力変更ハンドラー
    const handleCategoryNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCategoryName(e.target.value);
    };

    // フォーム送信処理
    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();

        const formData = {
            categoryId: categoryData.id,
            categoryName: categoryName,
            productOrders: products.map((product) => ({
                productId: product.id,
                order: product.order
            }))
        };

        // アクション実行（コメントアウト）
        executeAction("update-category", formData);

        // 成功トーストでリクエストの内容を表示
        toast({
            title: "成功",
            description: `リクエスト内容: ${JSON.stringify(formData, null, 2)}`,
            status: "success",
            duration: 5000,
            isClosable: true,
        });
    }, [categoryName, products]);

    const toast = useToast();

    return (
        <form onSubmit={handleSubmit}>
            <VStack spacing="1rem" align="start">
                <Box width="full">
                    <FormControl>
                        <FormLabel>カテゴリ名</FormLabel>
                        <Input
                            value={categoryName}
                            onChange={handleCategoryNameChange}
                            placeholder="カテゴリ名を入力"
                        />
                    </FormControl>
                </Box>

                <Box width="full">
                    <Text fontWeight="bold" mb={2}>商品の表示順</Text>
                    <Text fontSize="sm" mb={4}>上下ボタンで並び替えてください</Text>

                    <TableContainer>
                        <Table size="sm">
                            <Thead>
                                <Tr>
                                    <Th>表示順</Th>
                                    <Th>商品ID</Th>
                                    <Th>JINコード</Th>
                                    <Th>商品名</Th>
                                    <Th>並び替え</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {products.map((product, index) => (
                                    <Tr key={product.id}>
                                        <Td>{product.order}</Td>
                                        <Td>{product.id}</Td>
                                        <Td>{product.jinCode}</Td>
                                        <Td>{product.name}</Td>
                                        <Td>
                                            <HStack spacing={2}>
                                                <Button
                                                    size="xs"
                                                    colorScheme="gray"
                                                    isDisabled={index === 0}
                                                    onClick={() => moveUp(index)}
                                                >
                                                    ↑
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    colorScheme="gray"
                                                    isDisabled={index === products.length - 1}
                                                    onClick={() => moveDown(index)}
                                                >
                                                    ↓
                                                </Button>
                                            </HStack>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </TableContainer>
                </Box>

                <Flex justify="flex-end" width="full" mt={4}>
                    <Button type="submit" colorScheme="blue">
                        保存
                    </Button>
                </Flex>
            </VStack>
        </form>
    );
};

export {
    SortableForm
}
