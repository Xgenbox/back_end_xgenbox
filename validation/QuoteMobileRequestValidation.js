const isEmpty = require("./isEmpty")

const validator = require('validator')




module.exports = function QuoteMobileInputValidator(data) {
    let errors = {}
    // console.log(data.name)
    // data.name = !isEmpty(data.name) ? data.name : ""

    data.firstName = !isEmpty(data.firstName) ? data.firstName : ""
    data.lastName = !isEmpty(data.lastName) ? data.lastName : ""

    data.phone =!isEmpty(data.phone) ? data.phone : ""
    data.comment =!isEmpty(data.comment) ? data.comment : ""
    data.email =!isEmpty(data.email) ? data.email : ""

    // if (!validator.isLength(data.name, { min: 2, max: 30 })) {
    //     errors.name = "Name must be between 2 and 30 characters"
    // }
    // if (validator.isEmpty(data.name)) {
    //     errors.name = "Name field is required"
    // }
    if (validator.isEmpty(data.firstName)) {
        errors.firstName = "firstName field is required"
    }
    if (validator.isEmpty(data.email)) {
        errors.email = "email field is required"
    }



    if (validator.isEmpty(data.lastName)) {
        errors.lastName = "lastName field is required"
    }


    if (validator.isEmpty(data.phone)) {
        errors.phone = "phone field is required"
    }
    if (validator.isEmpty(data.comment)) {
        errors.comment = "comment field is required"
    }


    return {
        errors,
        isValid: isEmpty(errors)
        }


}




