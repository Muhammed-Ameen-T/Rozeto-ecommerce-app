export const successResponse = (res, data = {}, message = "Operation completed successfully.", statusCode = 200) => {
    res.status(statusCode).json({
        success: true, 
        status: "success",
        message: message,
        data: data,
        error: null
    });  
};

export const errorResponse = (res, error = {}, message = "An error occurred.", statusCode = 500) => {
    res.status(statusCode).json({
        success: false, 
        status: "error",
        message: message,
        data: null,
        error: error
    });
};

