import { NextFunction, Request, Response } from "express";
import { OrderService } from "./order.service";
import { OrderStatus } from "../../../generated/prisma/client";
import paginationSortingHelper from '../../helpers/paginationSortingHelper';
import { UserRole } from "../../middlewares/auth";

const createOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new Error("Unauthorized");
        }

        const { items, address } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: "Validation error",
                message: "Items array is required and must not be empty",
            });
        }

        if (!address || typeof address !== "string") {
            return res.status(400).json({
                error: "Validation error",
                message: "Valid address is required",
            });
        }

        // Validate items structure
        const validItems = items.every(
            (item) =>
                item.medicineId &&
                typeof item.medicineId === "string" &&
                item.quantity &&
                typeof item.quantity === "number" &&
                item.quantity > 0
        );

        if (!validItems) {
            return res.status(400).json({
                error: "Validation error",
                message: "Each item must have medicineId and quantity",
            });
        }

        const result = await OrderService.createOrder({
            customerId: req.user.id,
            items,
            address
        });

        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) throw new Error("Unauthorized");

        const { customerId: queryCustomerId, status } = req.query;
        const { page, limit, skip, sortBy, sortOrder } = paginationSortingHelper(req.query);

        const payload: any = {
            page,
            limit,
            skip,
            sortBy,
            sortOrder,
        };

        // Add status if valid
        if (typeof status === "string" && Object.values(OrderStatus).includes(status as OrderStatus)) {
            payload.status = status;
        }

        let result;

        switch (req.user.role) {
            case UserRole.CUSTOMER:
                payload.customerId = req.user.id; // customer sees only their orders
                result = await OrderService.getAllOrders(payload);
                break;

            case UserRole.SELLER:
                // Seller sees orders containing their medicines
                result = await OrderService.getOrdersForSeller(
                    req.user.id,
                    payload.page,
                    payload.limit,
                    payload.skip,
                    payload.sortBy,
                    payload.sortOrder
                );
                break;

            case UserRole.ADMIN:
                // Admin can filter by customerId if provided
                if (typeof queryCustomerId === "string") payload.customerId = queryCustomerId;
                result = await OrderService.getAllOrders(payload);
                break;

            default:
                throw new Error("Unauthorized role");
        }

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};


const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const result = await OrderService.getOrderById(id as string);

        //restrict customers to their own orders
        if (req.user?.role === UserRole.CUSTOMER && result.customerId !== req.user.id) {
            return res.status(403).json({ error: "Forbidden", message: "You can only view your own orders" });
        }
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const updateOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { status, address } = req.body;

        if (!req.user) throw new Error("Unauthorized");

        const updatedOrder = await OrderService.updateOrder(id as string, { status, address }, req.user.id, req.user.role);
        res.status(200).json(updatedOrder);
    } catch (error) {
        next(error);
    }
};

const deleteOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        if (!req.user) throw new Error("Unauthorized");

        const result = await OrderService.deleteOrder({ orderId: id, userId: req.user.id, role: req.user.role });
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const OrderController = {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrder,
    deleteOrder
};