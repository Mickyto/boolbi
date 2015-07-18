
function validateForm() {
    var emailField = document.forms["login"]["useremail"].value;
    if (emailField == null || emailField == "") {
        alert("Email must be filled out");
        return false;
    }
    var passwordField = document.forms["login"]["password"].value;
    if (passwordField == null || passwordField == "") {
        alert("Password must be filled out");
        return false;
    }
}