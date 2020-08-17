from app import app, socketio


if __name__ == '__main__':

    socketio.run(app,
                 host="0.0.0.0",
                 debug=app.config["ENV"] == "development",
                 use_reloader=False,
                 log_output=True)
