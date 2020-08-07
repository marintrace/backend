# -*- encoding: utf-8 -*-
"""
License: MIT
Copyright (c) 2019 - present AppSeed.us
"""
from flask import render_template, Flask
from datetime import date
from datetime import datetime
from dataclasses import dataclass

app = Flask(__name__)


@dataclass
class Alert:
    title: str
    body: str
    date: datetime
    color: str  # success, warning, danger

    def __init__(self, title: str, body: str, date: datetime, color: str):
        self.title = title
        self.body = body
        self.date = date
        self.color = color


@dataclass
class Person:
    name: str
    email: str
    last_report_date: datetime
    status_color: str  # success, warning, danger
    status_description: str
    cohort: str
    contacts: [str]
    reports: [Alert]

    def __init__(self, name: str, email: str, last_report_date: datetime, status_color: str, status_description: str,
                 cohort: str = "4", contacts: [str] = [], reports: [Alert] = []):
        self.name = name
        self.last_report_date = last_report_date
        self.status_color = status_color
        self.status_description = status_description
        self.cohort = cohort
        self.contacts = contacts
        self.reports = reports
        self.email = email


@app.route('/index')
@app.route('/')
# @login_required
def index():
    """if not current_user.is_authenticated:
        return redirect(url_for('base_blueprint.login'))"""

    people = [Person("Beck Lorsch", "blorsch@ma.org", date.today(), "success", "No symptoms"),
              Person("Amrit Baveja", "abaveja@ma.org", date.today(), "warning", "Waiting for symptoms")]

    return render_template('index.html', remaining_symptom_reports=1, last_report_date=date.today(), people=people)


@app.route('/alerts')
# @login_required
def alerts():
    alerts = [
        Alert("1 MISSING SYMPTOM REPORT", "Amrit Baveja has not reported their symptoms yet.", date.today(), "warning"),
        Alert("ROHAN VASISHTH REPORTED 2 SYMPTOMS", "They reported shortness of breath and diarrhea.", date.today(),
              "danger")]

    return render_template('alerts.html', last_alert_date=date.today(), alerts=alerts)


@app.route('/user/<user_id>')
# @login_required
def user(user_id):
    person = Person("Beck Lorsch", "blorsch@ma.org", date.today(), "success", "No symptoms", "4", ["Amrit Baveja"],
                    [Alert("Symptoms - 0", "", date.today(), "success")])
    return render_template('user.html', user=person)


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
