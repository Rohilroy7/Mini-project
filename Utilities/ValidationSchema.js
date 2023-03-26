const joi=require('joi')
module.exports.campgroundSchema=joi.object({
    title:joi.string().required(),
    price:joi.number().required().min(0),
    location:joi.string().required(),
    image:joi.string().required(),
    description:joi.string().required()
});
module.exports.reviewSchema=joi.object({
    body:joi.string().required(),
    rating:joi.number().required()
})
