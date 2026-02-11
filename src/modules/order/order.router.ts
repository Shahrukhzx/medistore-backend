import { Router } from "express";
import auth, { UserRole } from "../../middlewares/auth";
import { OrderController } from "./order.controller";

const router = Router();
router.get("/", auth(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.SELLER), OrderController.getAllOrders);
router.get("/:id", auth(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.SELLER), OrderController.getOrderById);
router.post("/", auth(UserRole.CUSTOMER), OrderController.createOrder);

// Admin and Seller can update orders
router.put("/:id", auth(UserRole.ADMIN, UserRole.SELLER), OrderController.updateOrder);
router.delete("/:id", auth(UserRole.ADMIN, UserRole.SELLER), OrderController.deleteOrder);


export const OrderRouter = router;
