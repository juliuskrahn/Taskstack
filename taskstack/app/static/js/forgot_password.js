function submitForgotPasswordForm() {
    document.getElementById("loadingBarBox").classList.add("active");
    document.getElementsByClassName("loadingOverlay")[0].classList.add("active");

    document.getElementById("nameErrorText").innerHTML = "";

    var error = false;

    // validate name / email adress
    if(document.getElementById("nameInput").value.length < 1) {
        error = true;
        document.getElementById("nameErrorText").innerHTML = lex["Enter your username or email address"];
    }
    
    if (error) {
        document.getElementById("loadingBarBox").classList.remove("active");
        document.getElementsByClassName("loadingOverlay")[0].classList.remove("active");
        return false;
    }
    return true;
}