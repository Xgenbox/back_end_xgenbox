const isEmpty = require("./isEmpty")

const validator = require('validator')




module.exports = function EntrepriseAddInputValidator(data) {
    let errors = {}
    // console.log(data.name)
    // data.name = !isEmpty(data.name) ? data.name : ""
    data.userId = !isEmpty(data.userId) ? data.userId : ""
    data.firstName = !isEmpty(data.firstName) ? data.firstName : ""
    data.lastName = !isEmpty(data.lastName) ? data.lastName : ""
    data.companyName =!isEmpty(data.companyName) ? data.companyName : ""
    data.phone =!isEmpty(data.phone) ? data.phone : ""
    data.typeCompany =!isEmpty(data.typeCompany) ? data.typeCompany : ""

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

    if (validator.isEmpty(data.companyName)) {
        errors.companyName = "companyName field is required"
    }
    if (validator.isEmpty(data.phone)) {
        errors.phone = "phone field is required"
    }
    if (validator.isEmpty(data.typeCompany)) {
        errors.typeCompany = "typeCompany field is required"
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




