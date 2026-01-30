import { Medicine, Prisma } from "../../../generated/prisma/client";
import { MedicineWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";

type GetAllMedicinePayload = {
    search?: string;
    categoryId?: string;
    sellerId?: string;
    minPrice?: number;
    maxPrice?: number;
    page: number;
    limit: number;
    skip: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
};


const createMedicine = async (
    data: Omit<Medicine, "id" | "createdAt" | "sellerId">,
    sellerId: string
) => {
    const result = await prisma.medicine.create({
        data: {
            ...data,
            sellerId,
        },
    });

    return result;
};

const getAllMedicines = async (payload: GetAllMedicinePayload) => {
    const andConditions: MedicineWhereInput[] = [];

    if (payload.search) {
        andConditions.push({
            OR: [
                {
                    name: {
                        contains: payload.search,
                        mode: "insensitive",
                    },
                },
                {
                    manufacturer: {
                        contains: payload.search,
                        mode: "insensitive",
                    },
                },
            ],
        });
    }

    if (payload.categoryId) {
        andConditions.push({
            categoryId: payload.categoryId,
        });
    }

    if (payload.sellerId) {
        andConditions.push({
            sellerId: payload.sellerId,
        });
    }

    if (
        typeof payload.minPrice === "number" ||
        typeof payload.maxPrice === "number"
    ) {
        const priceFilter: Prisma.DecimalFilter<"Medicine"> = {};

        if (typeof payload.minPrice === "number") {
            priceFilter.gte = payload.minPrice;
        }

        if (typeof payload.maxPrice === "number") {
            priceFilter.lte = payload.maxPrice;
        }

        andConditions.push({ price: priceFilter });
    }

    const medicines = await prisma.medicine.findMany({
        take: payload.limit,
        skip: payload.skip,
        where: {
            AND: andConditions,
        },
        orderBy: {
            [payload.sortBy]: payload.sortOrder,
        },
        include: {
            category: true,
            seller: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            _count: {
                select: {
                    reviews: true,
                },
            },
        },
    });

    const total = await prisma.medicine.count({
        where: {
            AND: andConditions,
        },
    });

    return {
        data: medicines,
        pagination: {
            total,
            page: payload.page,
            limit: payload.limit,
            totalPages: Math.ceil(total / payload.limit),
        },
    };
};

const getMedicineById = async (medicineId: string) => {
    const result = await prisma.medicine.findUnique({
        where: { id: medicineId },
        include: {
            category: true,
            seller: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            reviews: true,
            _count: {
                select: {
                    reviews: true,
                },
            },
        },
    });

    if (!result) {
        throw new Error("Medicine not found");
    }

    return result;
};

const updateMedicine = async (
    medicineId: string,
    data: Partial<Medicine>,
    sellerId: string
) => {
    const medicine = await prisma.medicine.findUniqueOrThrow({
        where: { id: medicineId },
        select: {
            sellerId: true,
        },
    });

    if (medicine.sellerId !== sellerId) {
        throw new Error("You are not the owner of this medicine");
    }

    return await prisma.medicine.update({
        where: { id: medicineId },
        data,
    });
};

const deleteMedicine = async (medicineId: string, sellerId: string) => {
    const medicine = await prisma.medicine.findUniqueOrThrow({
        where: { id: medicineId },
        select: {
            sellerId: true,
        },
    });

    if (medicine.sellerId !== sellerId) {
        throw new Error("You are not the owner of this medicine");
    }

    return await prisma.medicine.delete({
        where: { id: medicineId },
    });
};

export const MedicineService = {
    createMedicine,
    getAllMedicines,
    getMedicineById,
    updateMedicine,
    deleteMedicine,
};
