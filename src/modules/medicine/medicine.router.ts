import { Router } from "express";
import auth, { UserRole } from "../../middlewares/auth";
import { MedicineController } from "./medicine.controller";

const router = Router();

// Public routes
router.get("/", MedicineController.getAllMedicines);
router.get("/:id", MedicineController.getMedicineById);

// Seller routes
router.post("/", auth(UserRole.SELLER), MedicineController.createMedicine);
router.put("/:id", auth(UserRole.SELLER), MedicineController.updateMedicine);
router.delete("/:id", auth(UserRole.SELLER), MedicineController.deleteMedicine);

export const MedicineRouter = router;
