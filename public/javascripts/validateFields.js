/*jslint sloppy: true*/
/*jslint nomen: true*/
/*jslint forin: true*/
var validator = require('validator');
function validateForm(formName) {

    var form = document.forms[formName],
        isValid = true,
        requiredFields = {
            'adForm': [{
                name: 'captcha',
                isValid: function (field) {
                    return validator.isNumeric(field);
                }
            }, {
                name: 'adprice',
                isValid: function (field) {
                    return validator.isNumeric(field);
                }
            }, {
                name: 'adtitle',
                isValid: function (field) {
                    return field != '';
                }
            }, {
                name: 'category',
                isValid: function (field) {
                    return field != '';
                }
            }],
            'login': [{
                name: 'password',
                isValid: function (field) {
                    return validator.isLength(field, 8);
                }
            }, {
                name: 'useremail',
                isValid: function (field) {
                    return validator.isEmail(field);
                }
            }]
        },
        arr = requiredFields[formName],
        i,
        element;
    for (i in arr) {
        element = form[arr[i].name];
        if (!element) {
            continue;
        }
        if (arr[i].isValid(element.value) === false) {
            element.style.border = 'solid LightSalmon';
            document.getElementById(arr[i].name).style.visibility = 'visible';
            element.focus();
            isValid = false;
        } else {
            document.getElementById(arr[i].name).style.visibility = 'hidden';
            element.style.border = '';
        }
    }
    return isValid ? form.submit() : false;
}