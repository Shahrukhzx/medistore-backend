import { Order, OrderStatus, Prisma } from "../../../generated/prisma/client";
import { OrderWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";

type CreateOrderPayload = {
    customerId: string;
    items: Array<{
        medicineId: string;
        quantity: number;
    }>;
    address: string;

};

type GetAllOrdersPayload = {
    page: number;
    limit: number;
    skip: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
    status?: OrderStatus;
    customerId?: string;
};
type UpdateOrderPayload = {
    orderId: string;
    status?: OrderStatus;
    address?: string;
};

type DeleteOrderPayload = {
    orderId: string;
    userId: string;
    role: "ADMIN" | "SELLER";
};


const createOrder = async (payload: CreateOrderPayload) => {
    const { customerId, items, address } = payload;

    // fetch medicines
    const medicines = await prisma.medicine.findMany({
        where: {
            id: {
                in: items.map((item) => item.medicineId),
            },
        },
    });

    if (medicines.length !== items.length) {
        throw new Error("Medicine not found");
    }

    const sellerIds = new Set(medicines.map(m => m.sellerId))
    if (sellerIds.size !== 1) {
        throw new Error("Order must contain medicines from a single seller.")
    }

    const sellerId = medicines[0]?.sellerId
    // Check stock availability
    const medicineMap = new Map(medicines.map((m) => [m.id, m]));
    items.forEach((item) => {
        const medicine = medicineMap.get(item.medicineId);
        if (!medicine) {
            throw new Error(`Medicine with ID ${item.medicineId} not found`);
        }
        if (medicine.stock < item.quantity) {
            throw new Error(`Insufficient stock for ${medicine.name}.`);
        }
    });

    // Calculate total amount

    const subTotal = items.reduce((sum, item) => {
        const med = medicineMap.get(item.medicineId)!;
        return sum + med.price.toNumber() * item.quantity;
    }, 0);

    const taxAmount = +(subTotal * 0.05).toFixed(2); // 5% tax
    const shippingFee = 80; //  shipping fee
    const discountAmount = 0;
    const totalAmount = subTotal + taxAmount + shippingFee - discountAmount;

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
            data: {
                customerId,
                sellerId,
                address,
                subTotal: new Prisma.Decimal(subTotal),
                taxAmount: new Prisma.Decimal(taxAmount),
                shippingFee: new Prisma.Decimal(shippingFee),
                discountAmount: new Prisma.Decimal(discountAmount),
                totalAmount: new Prisma.Decimal(totalAmount),
                items: {
                    create: items.map((item) => ({
                        medicineId: item.medicineId,
                        quantity: item.quantity,
                        price: medicineMap.get(item.medicineId)!.price,
                    })),
                },
            },
            include: {
                items: { include: { medicine: true } },
                customer: { select: { id: true, name: true, email: true } },
            },
        });

        // update stock
        for (const item of items) {
            await tx.medicine.update({
                where: { id: item.medicineId },
                data: { stock: { decrement: item.quantity } },
            });
        }

        return newOrder;
    });

    return order;
};

const getAllOrders = async (payload: GetAllOrdersPayload) => {
    const andConditions: OrderWhereInput[] = [];

    if (payload.status) {
        andConditions.push({
            status: payload.status,
        });
    }

    if (payload.customerId) {
        andConditions.push({
            customerId: payload.customerId,
        });
    }

    const orders = await prisma.order.findMany({
        take: payload.limit,
        skip: payload.skip,
        where: {
            AND: andConditions,
        },
        orderBy: {
            [payload.sortBy]: payload.sortOrder,
        },
        include: {
            items: {
                include: {
                    medicine: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            manufacturer: true,
                        },
                    },
                },
            },
            customer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    const total = await prisma.order.count({
        where: {
            AND: andConditions,
        },
    });

    return {
        data: orders,
        pagination: {
            total,
            page: payload.page,
            limit: payload.limit,
            totalPages: Math.ceil(total / payload.limit),
        },
    };
};


const getOrderById = async (orderId: string) => {
    const result = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: {
                include: {
                    medicine: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            manufacturer: true,
                            category: true,
                        },
                    },
                },
            },
            customer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
        },
    });

    if (!result) {
        throw new Error("Order not found");
    }

    return result;
};

const getOrdersForSeller = async (
    sellerId: string,
    page: number,
    limit: number,
    skip: number,
    sortBy: string,
    sortOrder: "asc" | "desc"
) => {
    // Fetch orders with only seller items
    const orders = await prisma.order.findMany({
        take: limit,
        skip,
        orderBy: { [sortBy]: sortOrder },
        where: { items: { some: { medicine: { sellerId } } } },
        include: {
            items: {
                where: { medicine: { sellerId } }, // fetch only seller items
                include: { medicine: { select: { id: true, name: true, price: true, sellerId: true } } },
            },
            customer: { select: { id: true, name: true, email: true } },
        },
    });

    // Recalculate totals only for seller items
    const virtualOrders = orders.map(order => {
        const subTotal = order.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
        const taxAmount = +(subTotal * 0.05).toFixed(2);
        const shippingFee = 0; // since its otc
        const discountAmount = 0;
        const totalAmount = subTotal + taxAmount + shippingFee - discountAmount;

        return { ...order, subTotal, taxAmount, shippingFee, discountAmount, totalAmount };
    });

    // Count total orders (reuse same where clause)
    const total = await prisma.order.count({
        where: { items: { some: { medicine: { sellerId } } } },
    });

    return {
        data: virtualOrders,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

const updateOrder = async (orderId: string, payload: UpdateOrderPayload, userId: string, role: string) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { medicine: true } } },
    });

    if (!order) throw new Error("Order not found");

    // Seller restriction: can only update orders containing their medicines
    if (role === "SELLER") {
        const hasSellerMedicine = order.items.some(item => item.medicine.sellerId === userId);
        if (!hasSellerMedicine) {
            throw new Error("Forbidden: You can only update orders that contain your medicines");
        }
    }

    const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
            status: payload.status ?? order.status,
            address: payload.address ?? order.address,
        },
        include: {
            items: { include: { medicine: true } },
            customer: { select: { id: true, name: true, email: true } },
        },
    });

    return updatedOrder;
};

const deleteOrder = async ({ orderId, userId, role }: DeleteOrderPayload) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { medicine: true } } },
    });

    if (!order) throw new Error("Order not found");

    // Seller restriction
    if (role === "SELLER") {
        const hasSellerMedicine = order.items.some(item => item.medicine.sellerId === userId);
        if (!hasSellerMedicine) {
            throw new Error("Forbidden: You can only delete orders that contain your medicines");
        }
    }

    // Restore stock before deletion
    await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
            await tx.medicine.update({
                where: { id: item.medicineId },
                data: { stock: { increment: item.quantity } },
            });
        }

        await tx.orderItem.deleteMany({ where: { orderId } });
        await tx.order.delete({ where: { id: orderId } });
    });

    return { message: "Order deleted successfully" };
};




export const OrderService = {
    createOrder,
    getAllOrders,
    getOrderById,
    getOrdersForSeller,
    updateOrder,
    deleteOrder
};






