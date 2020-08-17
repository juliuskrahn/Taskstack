from app import app, render_template


@app.route("/privacy")
@app.route("/datenschutz")
def privacy():
    return render_template("privacy.html.j2")


@app.route("/imprint")
@app.route("/impressum")
def imprint():
    return render_template("imprint.html.j2")


@app.route("/help")
@app.route("/hilfe")
def help():
    return render_template("help.html.j2")


@app.route("/contact")
@app.route("/kontakt")
def contact():
    return render_template("contact.html.j2")


@app.route("/guide")
@app.route("/anleitung")
def guide():
    return render_template("guide.html.j2")
