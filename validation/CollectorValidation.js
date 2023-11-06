const isEmpty = require("./isEmpty")

const validator = require('validator')




module.exports = function CollectorAddInputValidator(data) {
    let errors = {}
    // console.log(data.name)
    // data.name = !isEmpty(data.name) ? data.name : ""
    data.userId = !isEmpty(data.userId) ? data.userId : ""
    data.firstName = !isEmpty(data.firstName) ? data.firstName : ""
    data.lastName = !isEmpty(data.lastName) ? data.lastName : ""
    data.entityType =!isEmpty(data.entityType) ? data.entityType : ""

    // if (!validator.isLength(data.name, { min: 2, max: 30 })) {
    //     errors.name = "Name must be between 2 and 30 characters"
    // }
    // if (validator.isEmpty(data.name)) {
    //     errors.name = "Name field is required"
    // }
    if (validator.isEmpty(data.firstName)) {
        errors.firstName = "firstName field is required"
    }
    if (validator.isEmpty(data.userId)) {
        errors.userId = "userId field is required"
    }

    if (validator.isEmpty(data.lastName)) {
        errors.lastName = "lastName field is required"
    }

    if (validator.isEmpty(data.entityType)) {
        errors.entityType = "entityType field is required"
    }

    // if (errors.length > 0) {
    //     return {
    //         errors,
    //         isValid: isEmpty(errors)
    //     }
    // }
    return {
        errors,
        isValid: isEmpty(errors)
        }


}




