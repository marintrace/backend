# -*- encoding: utf-8 -*-
from fastapi import FastAPI
from os import environ as env_vars
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI(
    title="Admin Dashboard",
    debug=env_vars.get("DEBUG", False),
    description="Admin Dashboard for school analytics and tracing information"
)

# Serve up static CSS, Images, Fonts and JavaScript
app.mount("/static", StaticFiles(directory="static"), name="static")
# Serve up Jinja2 Templates
templates = Jinja2Templates(directory="templates")

@app.route('/dashboard')
@app.route('/home')
@app.route('/')
def index():

    people = [Person("Beck Lorsch", "blorsch@ma.org", date.today(), "success", "No symptoms"),
              Person("Amrit Baveja", "abaveja@ma.org", date.today(), "warning", "Waiting for symptoms")]

    return render_template('index.html', remaining_symptom_reports=1, last_report_date=date.today(), people=people)


@app.route('/user/<user_id>')
# @login_required
def user(user_id):
    person = Person("Beck Lorsch", "blorsch@ma.org", date.today(), "success", "No symptoms", "4", ["Amrit Baveja"],
                    [Alert("Symptoms - 0", "", date.today(), "success")])
    return render_template('user.html', user=person)


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
