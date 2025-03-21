import { aysncHanlder } from "../utils/asyncHandler.js";

const registerUser = aysncHanlder( async (req,res) => {
    res.status(200).json(
        {
            message: "Ok"
        }
    )
})
