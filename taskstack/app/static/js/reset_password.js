function submitResetPasswordForm() {
  LoadingAnim.start("loadingBarBox");

  document.getElementById("passwordErrorText").innerHTML = "";
  document.getElementById("codeErrorText").innerHTML = "";

  var error = false;

  // validate code
  if (document.getElementById("code").value.length != 8) {
    error = true;
    document.getElementById("codeErrorText").innerHTML = lex["The code is 8 characters long"];
  }

  // validate password
  const password = document.getElementById("passwordInput").value;

  const valid_password = validPassword(password);

  if(document.getElementById("passwordInput").value != document.getElementById("passwordConfirmInput").value) {
    error = true;
    document.getElementById("passwordErrorText").innerHTML = lex["Passwords do not match"];
  }
  if (valid_password == "too_short") {
    error = true;
    document.getElementById("passwordErrorText").innerHTML = lex["Enter a password with at least 8 characters"];
  }
  else if (valid_password == "too_long") {
    error = true;
    document.getElementById("passwordErrorText").innerHTML = lex["The password may only be 64 characters long"];
  }

  if (error) {
    LoadingAnim.stopAll();
    return false;
  }
  return true;
}