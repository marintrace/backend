const userInteractionPagLimit = 10;
let userInteractionPagToken = 0;
const homeUserStatusPagLimit = 10;
let homeUserStatusPagToken = 0;
const userReportPagLimit = 10;
let userReportPagToken = 0;

$.ajaxSetup({
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

function requestFailure(data) {
    alert("Failed to obtain user information");
    console.log("Error while issuing POST request");
    console.log(data);
}

function updateUserStatus(user_email) {
    $.post("/api/get-user-summary-status", JSON.stringify({"email": user_email}), function () {
        console.log("User Status Request Response Received");
    }, "json").done(function (data) {
            $("#today-status-color").addClass("bg-" + data.color);
            $("#today-status-description").html(data.message);
        }
    ).fail(requestFailure)
}

function updateUserInteractions(user_email) {
    $.post("/api/paginate-user-interactions",
        JSON.stringify({
            "email": user_email,
            "pagination_token": userInteractionPagToken,
            "limit": userInteractionPagLimit
        }), function () {
            console.log("Paginate User Interactions Request Response Received");
        }, "json").done(function (data) {
        userInteractionPagToken = data['pagination_token'];

        data['users'].forEach(function (e) {
            let rows = [
                e.timestamp,
                "<a href='/user/" + e.email + "'>" + e.email + "</a>",
            ];
            $("#interactions").append("<tr><td>" + rows.join("</td><td>") + "</td>")
        })
    }).fail(requestFailure)
}

function updateUserReports(user_email) {
    $.post("/api/paginate-user-reports", JSON.stringify({
        "email": user_email,
        "pagination_token": userReportPagToken,
        "limit": userReportPagLimit
    }), function () {
        console.log("Paginating user reports request response received");
    }, "json").done(function (data) {
        userReportPagToken = data['pagination_token'];

        data['records'].forEach(function (e) {
            let rows = [
                e.timestamp,
                "<span class=\"badge badge-dot mr-4\"><i class='bg-" + e.color + "'></i><span class='status'>" + e.message + "</span></span>",
            ];
            $("#reports").append("<tr><td>" + rows.join("</td><td>") + "</td>");
        })
    }).fail(requestFailure)
}

function updateHomeStatusSummaries() {
    $.post("/api/paginate-user-summary-items", JSON.stringify({
        "pagination_token": homeUserStatusPagToken,
        "limit": homeUserStatusPagLimit
    }), function () {
        console.log("Update home status summaries request response received");
    }, "json").done(function (data) {
        homeUserStatusPagToken = data['pagination_token'];

        data['records'].forEach(function (e) {
            let rows = [
                "<a href='/user/" + e.email + "'>" + e.email + "</a>",
                "<span class='badge badge-dot mr-4'><i class='bg-" + e.color + "'></i><span class='status'>" + e.message + "</span></span>"
            ];
            $("#summaries").append("<tr><td>" + rows.join("</td><td>") + "</td>");
        })
    }).fail(requestFailure)
}

function updateSubmittedWidget() {
    $.post("/api/submitted-symptom-reports", JSON.stringify({}), function () {
        console.log("Update submitted symptom reports received");
    }, "json").done(function (data) {
        $("#submitted-symptom-reports").html(data.value);
    }).fail(requestFailure);
}