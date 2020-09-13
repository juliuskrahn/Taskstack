window.addEventListener("load", () => {
  // post on switch change
  for (let input of document.getElementsByClassName("switch")) {
    input.addEventListener('input', (e) => {
      fetch(window.location.href, {
          method: 'POST',
          headers: new Headers({ "content-type": "application/json" }),
          credentials: "include",
          body: JSON.stringify({
            token:token,
            setting:e.target.id,
            value:e.target.checked
          })
      })
        .then(response => {
          if (response.status != 200) {
            if (response.status == 419) {
              Modal.openSafelyById("invalidTokenMsg");
            }
            else {
              window.alert("Error");
            }
          }
        })
    });
  }
});

function submitChangeUsername() {
  var error = false;

  // validate username
  const username = document.getElementById("changeUsernameNewusernameInput").value;

  const valid_username = validUsername(username);

  document.getElementById("changeUsernameUsernameErrorText").innerHTML = "";

  if (valid_username == "empty") {
    error = true;
    document.getElementById("changeUsernameUsernameErrorText").innerHTML = lex["Enter your new username"];
  }
  else if (valid_username == "too_short") {
    error = true;
    document.getElementById("changeUsernameUsernameErrorText").innerHTML = lex["The username has to be at least 3 characters long"];
  }
  else if (valid_username == "too_long") {
    error = true;
    document.getElementById("changeUsernameUsernameErrorText").innerHTML = lex["The username may only be 16 characters long"];
  }
  else if (valid_username == "invalid") {
    error = true;
    document.getElementById("changeUsernameUsernameErrorText").innerHTML = lex["Invalid username"];
  }

  // validate password
  document.getElementById("changeUsernamePasswordErrorText").innerHTML = "";
  if(document.getElementById("changeUsernamePasswordInput").value.length < 1) {
    error = true;
    document.getElementById("changeUsernamePasswordErrorText").innerHTML = lex["Enter your password"];
  }

  if (! error) {
    LoadingAnim.start("changeUsernameLoadingBarBox");
  }

  // submit
  return ! error;
}

function submitChangeEmail() {
  var error = false;

  // validate new email adress
  const email = document.getElementById("changeEmailNewUserEmailInput").value;

  const valid_email = validEmail(email);

  document.getElementById("changeEmailEmailErrorText").innerHTML = "";

  if (valid_email == "empty") {
    error = true;
    document.getElementById("changeEmailEmailErrorText").innerHTML = lex["Enter your new email address"];
  }
  else if (valid_email == "too_long") {
    error = true;
    document.getElementById("changeEmailEmailErrorText").innerHTML = lex["The email address may only be 32 characters long"];
  }
  else if (valid_email == "invalid") {
    error = true;
    document.getElementById("changeEmailEmailErrorText").innerHTML = lex["Invalid email address"];
  }

  // validate password
  document.getElementById("changeEmailPasswordErrorText").innerHTML = "";
  if(document.getElementById("changeEmailPasswordInput").value.length < 1) {
    error = true;
    document.getElementById("changeEmailPasswordErrorText").innerHTML = lex["Enter your password"];
  }

  if (! error) {
    LoadingAnim.start("changeEmailLoadingBarBox");
  }

  // submit
  return ! error;
}

function submitChangePassword() {
  var error = false;

  // validate old password
  document.getElementById("changePasswordPasswordErrorText").innerHTML = "";
  if(document.getElementById("changePasswordOldPasswordInput").value.length < 1) {
    error = true;
    document.getElementById("changePasswordPasswordErrorText").innerHTML = lex["Enter your old password"];
  }

  // validate new password
  const password = document.getElementById("changePasswordNewPasswordInput").value;

  const valid_password = validPassword(password);

  document.getElementById("changePasswordNewPasswordErrorText").innerHTML = "";
  
  if(document.getElementById("changePasswordNewPasswordInput").value != document.getElementById("changePassword_newPasswordConfirmInput").value) {
    error = true;
    document.getElementById("changePasswordNewPasswordErrorText").innerHTML = lex["Passwords do not match"];
  }
  if (valid_password == "too_short") {
    error = true;
    document.getElementById("changePasswordNewPasswordErrorText").innerHTML = lex["Enter a password with at least 8 characters"];
  }
  else if (valid_password == "too_long") {
    error = true;
    document.getElementById("changePasswordNewPasswordErrorText").innerHTML = lex["The password may only be 64 characters long"];
  }

  if (! error) {
    LoadingAnim.start("changePasswordLoadingBarBox");
  }

  // submit
  return ! error;
}

function submitDeleteAccount() {
  var error = false;

  // validate password
  document.getElementById("deleteAccountPasswordErrorText").innerHTML = "";
  if(document.getElementById("deleteAccountPasswordInput").value.length < 1) {
    document.getElementById("deleteAccountPasswordErrorText").innerHTML = lex["Enter your password"];
    return false;
  }

  if (! error) {
    LoadingAnim.start("deleteAccountLoadingBarBox");
  }

  return true;
}
