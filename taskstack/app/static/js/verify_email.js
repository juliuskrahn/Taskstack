function submitVerifyEmailForm() {
    document.getElementById("loadingBarBox").classList.add("active");
    document.getElementsByClassName("loadingOverlay")[0].classList.add("active");
    if (document.getElementById("code").value.length == 8) {
        return true;
    }
    document.getElementById("codeErrorText").innerHTML = lex["The code is 8 characters long"];
    document.getElementById("codeErrorText").classList.add("active");
    document.getElementById("loadingBarBox").classList.remove("active");
    document.getElementsByClassName("loadingOverlay")[0].classList.remove("active");
    return false;
}
