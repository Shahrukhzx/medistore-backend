import { NextFunction, Request, Response } from "express";
import { CategoryService } from "./category.service";

const createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name } = req.body;
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ message: "Category name is required and must be a string" });
        }
        const result = await CategoryService.createCategory(name);
        res.status(201).json(result);
    } catch (error) {
        next(error)
    }
}

const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await CategoryService.getAllCategories(req.query);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const getCategoryById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "Category id is required" });
        }

        const result = await CategoryService.getCategoryById(id as string);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};


const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ message: "Category name is required and must be a string" });
        }
        const result = await CategoryService.updateCategory(id as string, name);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const result = await CategoryService.deleteCategory(id as string);

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const CategoryController = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
};