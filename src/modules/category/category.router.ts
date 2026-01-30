import { Router } from "express";
import auth, { UserRole } from "../../middlewares/auth";
import { CategoryController } from "./category.controller";

const router = Router();

// Public route to get list of categories
router.get("/", CategoryController.getAllCategories);
// Public route to get category by id
router.get("/:id", CategoryController.getCategoryById);

// Admin routes for creating categories
router.post(
    "/",
    auth(UserRole.ADMIN),
    CategoryController.createCategory
);
// Admin routes for updating  categories
router.put(
    "/:id",
    auth(UserRole.ADMIN),
    CategoryController.updateCategory
);
// Admin routes for deleting categories
router.delete(
    "/:id",
    auth(UserRole.ADMIN),
    CategoryController.deleteCategory
);

export const CategoryRouter = router;
