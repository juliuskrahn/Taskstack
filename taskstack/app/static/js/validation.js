function validUsername(string) {
  if (invalidNames.includes(string)) { return "invalid"; }
  if(string.length >= 3) {
    if(string.length <= 16) {
      const regexexp = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
      if (regexexp.test(string)) {
        return "valid";
      }
      return "invalid";
    }else {
      return "too_long";
    }
  }else {
    return "too_short";
  }
}

function validEmail(string) {
  if(string.length >= 1) {
    if(string.length <= 32) {
      if(string.includes("@")) {
        if(string.includes(".")) {
          if(string.lastIndexOf("@") < string.lastIndexOf(".")) {
            if(string.lastIndexOf(".") < string.length - 1) {
              return "valid";
            }
          }
        }
      }
      return "invalid";
    }else {
      return "too_long";
    }
  }
  return "empty";
}

function validPassword(string) {
  if(string.length >= 8) {
    if(string.length <= 64) {
      return "valid";
    }else {
      return "too_long";
    }
  }else {
    return "too_short";
  }
}

function validProjectName(string) {
  if (invalidNames.includes(string)) { return "invalid"; }
  if(string.length >= 3) {
    if(string.length <= 32) {
      const regexexp = /^[a-zA-Z0-9_-]*$/;
      if (regexexp.test(string)) {
        return "valid";
      }
      return "invalid";
    }else {
      return "too_long";
    }
  }else {
    return "too_short";
  }
}

function validProjectDesc(string) {
  if(string.length > 128) {
    return "too_long";
  }
  return "valid";
}
