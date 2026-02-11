import { NextFunction, Request, Response } from "express";
import { ReviewService } from "./review.service";
import paginationSortingHelper from "../../helpers/paginationSortingHelper";
import { UserRole } from "../../middlewares/auth";

const createReview = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: "Unauthorized",
                message: "User not authenticated",
            });
        }

        const { medicineId } = req.params;
        const { rating, comment } = req.body;

        // Validate medicineId
        if (!medicineId || typeof medicineId !== "string") {
            return res.status(400).json({
                error: "Validation error",
                message: "Valid medicine ID is required",
            });
        }

        if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
            return res.status(400).json({
                error: "Validation error",
                message: "Rating must be between 1 and 5",
            });
        }

        if (!comment || typeof comment !== "string" || comment.trim().length === 0) {
            return res.status(400).json({
                error: "Validation error",
                message: "Comment is required and cannot be empty",
            });
        }

        const result = await ReviewService.createReview({
            medicineId,
            customerId: req.user.id,
            rating,
            comment,
        });

        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({
            error: "Failed to create review",
            details: error instanceof Error ? error.message : String(error),
        });
    }
};

const getReviewsByMedicineId = async (req: Request, res: Response) => {
    try {
        const { medicineId } = req.params;

        if (!medicineId || typeof medicineId !== "string") {
            return res.status(400).json({
                error: "Validation error",
                message: "Valid medicine ID is required",
            });
        }

        const { page, limit, skip, sortBy, sortOrder } =
            paginationSortingHelper(req.query);

        const payload = {
            medicineId,
            page,
            limit,
            skip,
            sortBy,
            sortOrder: sortOrder as "asc" | "desc",
        };

        const result = await ReviewService.getReviewsByMedicineId(payload);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({
            error: "Failed to fetch reviews",
            details: error instanceof Error ? error.message : String(error),
        });
    }
};

const getReviewStats = async (req: Request, res: Response) => {
    try {
        const { medicineId } = req.params;

        // Validate medicineId
        if (!medicineId || typeof medicineId !== "string") {
            return res.status(400).json({
                error: "Validation error",
                message: "Valid medicine ID is required",
            });
        }

        const result = await ReviewService.getReviewStats(medicineId);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({
            error: "Failed to fetch review stats",
            details: error instanceof Error ? error.message : String(error),
        });
    }
};

const deleteReview = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: "Unauthorized",
                message: "User not authenticated",
            });
        }

        const { reviewId } = req.params;

        if (!reviewId || typeof reviewId !== "string") {
            return res.status(400).json({
                error: "Validation error",
                message: "Valid review ID is required",
            });
        }

        // Verify customer owns this review (or admin)
        const review = await ReviewService.getReviewById(reviewId);
        if (req.user.role === UserRole.CUSTOMER && review.customerId !== req.user.id) {
            return res.status(403).json({
                error: "Forbidden",
                message: "You can only delete your own reviews",
            });
        }

        const result = await ReviewService.deleteReview(reviewId);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({
            error: "Failed to delete review",
            details: error instanceof Error ? error.message : String(error),
        });
    }
};

export const ReviewController = {
    createReview,
    getReviewsByMedicineId,
    getReviewStats,
    deleteReview
};