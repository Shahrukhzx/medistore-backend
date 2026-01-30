import { paginationHelper } from "../../helpers/paginationHelper";
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

const getAllCategories = async (query: any) => {
    const { page, limit, skip } = paginationHelper(query);

    const [data, total] = await Promise.all([
        prisma.category.findMany({
            skip,
            take: limit,
        }),
        prisma.category.count(),
    ]);

    return {
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
        data,
    };
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