import { Router } from "express";
import auth, { UserRole } from "../../middlewares/auth";
import { OrderController } from "./order.controller";

const router = Router();
router.get("/", auth(UserRole.ADMIN, UserRole.CUSTOMER), OrderController.getAllOrders);
router.get("/:id", auth(UserRole.ADMIN, UserRole.CUSTOMER), OrderController.getOrderById);
// Customer routes - view and manage their own orders
router.post("/", auth(UserRole.CUSTOMER), OrderController.createOrder);


export const OrderRouter = router;
