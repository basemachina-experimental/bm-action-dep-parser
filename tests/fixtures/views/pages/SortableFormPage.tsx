import {
    Heading, Card, Flex
} from "@chakra-ui/react";
import { SortableForm } from "../components/SortableForm";

const App = () => {
    return (
        <Flex direction="column" gap={2} w="full" h="full">
            <Heading size="sm">商品カテゴリ編集</Heading>
            <Card p={4}>
                <SortableForm />
            </Card>
        </Flex>
    );
};

export default App;
