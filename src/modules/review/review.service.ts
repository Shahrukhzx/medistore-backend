import { prisma } from "../../lib/prisma";
import { ReviewWhereInput } from "../../../generated/prisma/models";

type CreateReviewPayload = {
    medicineId: string;
    customerId: string;
    rating: number;
    comment: string;
};
type GetReviewsByMedicinePayload = {
    medicineId: string;
    page: number;
    limit: number;
    skip: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
};



const createReview = async (payload: CreateReviewPayload) => {
    const { medicineId, customerId, rating, comment } = payload;

    // Verify medicine exists
    const medicine = await prisma.medicine.findUnique({
        where: { id: medicineId },
    });

    if (!medicine) {
        throw new Error("Medicine not found");
    }

    const review = await prisma.review.create({
        data: {
            medicineId,
            customerId,
            rating,
            comment,
        },
        include: {
            customer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    return review;
}

const getReviewsByMedicineId = async (payload: GetReviewsByMedicinePayload) => {
    const { medicineId, page, limit, skip, sortBy, sortOrder } = payload;

    // Verify medicine exists
    const medicine = await prisma.medicine.findUnique({
        where: { id: medicineId },
    });

    if (!medicine) {
        throw new Error("Medicine not found");
    }

    const reviews = await prisma.review.findMany({
        where: { medicineId },
        take: limit,
        skip,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            customer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    const total = await prisma.review.count({
        where: { medicineId },
    });

    return {
        data: reviews,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};
const getReviewStats = async (medicineId: string) => {
    // Verify medicine exists
    const medicine = await prisma.medicine.findUnique({
        where: { id: medicineId },
    });

    if (!medicine) {
        throw new Error("Medicine not found");
    }

    const reviews = await prisma.review.findMany({
        where: { medicineId },
        select: { rating: true },
    });

    if (reviews.length === 0) {
        return {
            medicineId,
            totalReviews: 0,
            averageRating: 0,
            ratingDistribution: {
                "1": 0,
                "2": 0,
                "3": 0,
                "4": 0,
                "5": 0,
            },
        };
    }

    const ratingDistribution: Record<string, number> = {
        "1": 0,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
    };

    reviews.forEach((review) => {
        const key = String(review.rating);
        ratingDistribution[key] = (ratingDistribution[key] ?? 0) + 1;
    });

    const averageRating =
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    return {
        medicineId,
        totalReviews: reviews.length,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
    };
};

const getReviewById = async (reviewId: string) => {
    const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: {
            customer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    if (!review) {
        throw new Error("Review not found");
    }

    return review;
};
const deleteReview = async (reviewId: string) => {
    const review = await prisma.review.findUnique({
        where: { id: reviewId },
    });

    if (!review) {
        throw new Error("Review not found");
    }

    await prisma.review.delete({
        where: { id: reviewId },
    });

    return { message: "Review deleted successfully" };
};

export const ReviewService = {
    createReview,
    getReviewsByMedicineId,
    getReviewStats,
    getReviewById,
    deleteReview
};