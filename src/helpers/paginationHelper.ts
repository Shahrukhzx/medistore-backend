type IPaginationOptions = {
    page?: number | string;
    limit?: number | string;
};

type IPaginationResult = {
    page: number;
    limit: number;
    skip: number;
};

export const paginationHelper = (
    options: IPaginationOptions
): IPaginationResult => {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip,
    };
};
