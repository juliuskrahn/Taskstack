function submitSignUpForm() {
  LoadingAnim.start("loadingBarBox");

  document.getElementById("nameErrorText").innerHTML = "";
  document.getElementById("mailErrorText").innerHTML = "";
  document.getElementById("passwordErrorText").innerHTML = "";

  var error = false;

  // validate username
  const username = document.getElementById("nameInput").value;

  const valid_username = validUsername(username);

  if (valid_username == "forbidden") {
    error = true;
    document.getElementById("nameErrorText").innerHTML = lex["This username is not available"];
  }
  else if (valid_username == "too_short") {
    error = true;
    document.getElementById("nameErrorText").innerHTML = lex["Enter username (at least 3 characters long)"];
  }
  else if (valid_username == "too_long") {
    error = true;
    document.getElementById("nameErrorText").innerHTML = lex["The username may only be 16 characters long"];
  }
  else if (valid_username == "invalid") {
    error = true;
    document.getElementById("nameErrorText").innerHTML = lex["Invalid username"];
  }

  // validate email adress
  const email = document.getElementById("emailInput").value;

  const valid_email = validEmail(email);

  if (valid_email == "empty") {
    error = true;
    document.getElementById("mailErrorText").innerHTML = lex["Enter email address"];
  }
  else if (valid_email == "too_long") {
    error = true;
    document.getElementById("mailErrorText").innerHTML = lex["The email address may only be 32 characters long"];
  }
  else if (valid_email == "invalid") {
    error = true;
    document.getElementById("mailErrorText").innerHTML = lex["Invalid email address"];
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
