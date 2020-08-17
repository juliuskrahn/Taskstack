from app import app, render_template


@app.errorhandler(400)
def error_404(e):
    return render_template('error/400.html.j2'), 400


@app.errorhandler(404)
def error_404(e):
    return render_template('error/404.html.j2'), 404


@app.errorhandler(500)
def error_500(e):
    return render_template('error/500.html.j2'), 500
