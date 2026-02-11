import { Router } from "express";
import auth, { UserRole } from "../../middlewares/auth";
import { MedicineController } from "./medicine.controller";

const router = Router();

// Public routes
router.get("/all-medicines", MedicineController.getAllMedicines);
router.get("/all-medicines/:id", MedicineController.getMedicineById);


// Seller routes
router.get("/", auth(UserRole.SELLER), MedicineController.getAllMedicines);
router.get("/:id", auth(UserRole.SELLER), MedicineController.getMedicineById);
router.post("/", auth(UserRole.SELLER), MedicineController.createMedicine);
router.put("/:id", auth(UserRole.SELLER), MedicineController.updateMedicine);
router.delete("/:id", auth(UserRole.SELLER), MedicineController.deleteMedicine);

export const MedicineRouter = router;
