function submitForgotPasswordForm() {
    LoadingAnim.start("loadingBarBox");

    document.getElementById("nameErrorText").innerHTML = "";

    var error = false;

    // validate name / email adress
    if(document.getElementById("nameInput").value.length < 1) {
        error = true;
        document.getElementById("nameErrorText").innerHTML = lex["Enter your username or email address"];
    }
    
    if (error) {
        LoadingAnim.stopAll();
        return false;
    }
    return true;
}