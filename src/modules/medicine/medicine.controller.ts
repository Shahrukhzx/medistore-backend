import { NextFunction, Request, Response } from "express";
import { MedicineService } from "./medicine.service";
import paginationSortingHelper from '../../helpers/paginationSortingHelper';
import { UserRole } from "../../middlewares/auth";


const createMedicine = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new Error("Unauthorized");
        }

        const result = await MedicineService.createMedicine(req.body, req.user.id);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

const getAllMedicines = async (req: Request, res: Response) => {
    try {
        const { search, categoryId, sellerId, minPrice, maxPrice } = req.query;

        const { page, limit, skip, sortBy, sortOrder } =
            paginationSortingHelper(req.query);

        const payload: any = {
            page,
            limit,
            skip,
            sortBy,
            sortOrder,
        };

        if (typeof search === "string") {
            payload.search = search;
        }

        if (typeof categoryId === "string") {
            payload.categoryId = categoryId;
        }

        // seller can only view their own medicines
        if (req.user?.role === UserRole.SELLER) {
            payload.sellerId = req.user.id;
        } else if (typeof sellerId === "string") {
            payload.sellerId = sellerId;
        }

        if (minPrice !== undefined) {
            payload.minPrice = Number(minPrice);
        }

        if (maxPrice !== undefined) {
            payload.maxPrice = Number(maxPrice);
        }

        const result = await MedicineService.getAllMedicines(payload);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({
            error: "Failed to fetch medicines",
            details: error,
        });
    }
};


const getMedicineById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await MedicineService.getMedicineById(id as string);
        // Seller can only view their own medicines
        if (req.user?.role === UserRole.SELLER && result.sellerId !== req.user.id) {
            return res.status(403).json({
                error: "Forbidden",
                message: "You can only view your own medicines",
            });
        }
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({
            error: "Failed to fetch medicine",
            details: error,
        });
    }
};

const updateMedicine = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            throw new Error("Unauthorized");
        }

        const { id } = req.params;
        const result = await MedicineService.updateMedicine(
            id as string,
            req.body,
            req.user.id
        );
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({
            error: "Failed to update medicine",
            details: error,
        });
    }
};

const deleteMedicine = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            throw new Error("Unauthorized");
        }

        const { id } = req.params;
        const result = await MedicineService.deleteMedicine(id as string, req.user.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({
            error: "Failed to delete medicine",
            details: error,
        });
    }
};

export const MedicineController = {
    createMedicine,
    getAllMedicines,
    getMedicineById,
    updateMedicine,
    deleteMedicine,
};
