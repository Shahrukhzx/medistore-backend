import { paginationHelper } from "./paginationHelper";


type IOptions = {
    page?: number | string;
    limit?: number | string;
    sortOrder?: "asc" | "desc" | string;
    sortBy?: string;
}

type IOptionsResult = {
    page: number;
    limit: number;
    skip: number;
    sortBy: string;
    sortOrder: "asc" | "desc" | string;
}

const paginationSortingHelper = (options: IOptions): IOptionsResult => {
    // Reuse paginationHelper to get page, limit, skip
    const { page, limit, skip } = paginationHelper(options);

    // Default sorting values
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = (options.sortOrder as "asc" | "desc") || 'desc';

    return {
        page,
        limit,
        skip,
        sortBy,
        sortOrder,
    };
}

export default paginationSortingHelper;
