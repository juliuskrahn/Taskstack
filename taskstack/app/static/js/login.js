function submitLogInForm() {
  LoadingAnim.start("loadingBarBox");

  document.getElementById("nameErrorText").innerHTML = "";
  document.getElementById("passwordErrorText").innerHTML = "";

  var error = false;

  // validate name / email adress
  if(document.getElementById("nameInput").value.length < 1) {
    error = true;
    document.getElementById("nameErrorText").innerHTML = lex["Enter your username or email address"];
  }

  // validate password
  if(document.getElementById("passwordInput").value.length < 1) {
    error = true;
    document.getElementById("passwordErrorText").innerHTML = lex["Enter your password"];
  }
  
  if (error) {
    LoadingAnim.stopAll();
    return false;
  }
  return true;
}
