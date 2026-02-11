import express from 'express';
import auth, { UserRole } from '../../middlewares/auth';
import { ReviewController } from './review.controller';


const router = express.Router();

// Public routes
router.get("/:medicineId", ReviewController.getReviewsByMedicineId);
router.get("/:medicineId/stats", ReviewController.getReviewStats);

router.post('/:medicineId', auth(UserRole.CUSTOMER, UserRole.ADMIN), ReviewController.createReview);
router.delete("/:reviewId", auth(UserRole.CUSTOMER, UserRole.ADMIN), ReviewController.deleteReview);


export const ReviewRouter = router;