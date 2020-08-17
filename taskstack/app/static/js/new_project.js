function submitNewProjectForm() {
  var valid = true;

  const name_validation = validProjectName(document.getElementById("name").value);
  if (name_validation != "valid") {
    valid = false;
    if (name_validation == "invalid") {
      document.getElementById("nameErrorText").innerHTML = lex["Invalid project name"];
    }
    else if (name_validation == "too_long") {
      document.getElementById("nameErrorText").innerHTML = lex["The project name may only be 32 characters long"];
    }
    else if (name_validation == "too_short") {
      document.getElementById("nameErrorText").innerHTML = lex["Enter project name (at least 3 characters long)"];
    }
    document.getElementById("nameErrorText").classList.add("active");
  
  }else {
    document.getElementById("nameErrorText").classList.remove("active");
  }

  const desc_validation = validProjectDesc(document.getElementById("desc").value);
  if (desc_validation != "valid") {
    valid = false;
    if (desc_validation == "too_long") {
      document.getElementById("descErrorText").innerHTML = lex["The project description may only be 128 characters long"];
    }
    document.getElementById("descErrorText").classList.add("active");
  }
  else {
    document.getElementById("descErrorText").classList.remove("active");
  }

  return valid;
}
