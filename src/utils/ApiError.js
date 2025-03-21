class ApiError extends Error {
    constructor(
        statuscode, 
        message= "Something went wrong on our side",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statuscode = statuscode,
        this.data = null 
        this.message = message
        this.success = false
        this.error = errors

        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError}