import mongoose, {Schema} from "mongoose"
import mongooseAggregatePaginater from "mongoose-aggregate-paginate-v2"
const videoSchema = new Schema(
    {
        videoFile: {
            type: String,// cloudinary url
            required: true
        },
        thumbnail: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        duration: {
            type: Number,//duration apko cloudinary se hi milega
            // file upload hone k baad vo hi manage krte hai ye
            required: true
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true 
        },
        owner:{
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
)

videoScehma.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)