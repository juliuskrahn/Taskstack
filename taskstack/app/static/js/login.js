function submitLogInForm() {
  document.getElementById("loadingBarBox").classList.add("active");
  document.getElementsByClassName("loadingOverlay")[0].classList.add("active");

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
    document.getElementById("loadingBarBox").classList.remove("active");
    document.getElementsByClassName("loadingOverlay")[0].classList.remove("active");
    return false;
  }
  return true;
}
