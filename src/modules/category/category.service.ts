import { prisma } from "../../lib/prisma";

const createCategory = async (name: string) => {
    try {
        return await prisma.category.create({
            data: {
                name: name
            }
        })
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new Error('Category with this name already exists');
        }
    }

}

const getAllCategories = async () => {
    return await prisma.category.findMany({
        orderBy: { name: "asc" },
    });
};

const updateCategory = async (id: string, name: string) => {
    return await prisma.category.update({
        where: { id },
        data: { name },
    });
};

const deleteCategory = async (id: string) => {
    return await prisma.category.delete({
        where: { id },
    });
};

export const CategoryService = {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory
}