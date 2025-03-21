const asyncHandler = (requestHandler) => {
    (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err) => next(err))
    }
}



    export {aysncHanlder}

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