function submitVerifyEmailForm() {
    LoadingAnim.start("loadingBarBox");
    if (document.getElementById("code").value.length == 8) {
        return true;
    }
    document.getElementById("codeErrorText").innerHTML = lex["The code is 8 characters long"];
    document.getElementById("codeErrorText").classList.add("active");
    LoadingAnim.stopAll();
    return false;
}
