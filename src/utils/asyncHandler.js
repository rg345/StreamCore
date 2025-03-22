const asyncHandler = (requestHandler) => {
    return (req,res,next) => {
        return Promise.resolve(requestHandler(req,res,next)).catch((err) => next(err))
    }
}



    export {asyncHandler}

// the below code is implementation using try catch block, another way to do this using promise method is which is upper one , 
    // const asyncHandler = (fn) => async (req,res,next) => {
    //     try {
    //         await fn(req,res,next)
    //     } catch (error) {
    //         res.status(error.code || 500).json({
    //             success: false,
    //             message: error.message
    //         })
    //     }
    // }