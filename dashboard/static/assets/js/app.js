const userInteractionPagLimit = 10;
let userInteractionPagToken = 0;
const homeUserStatusPagLimit = 10;
let homeUserStatusPagToken = 0;
const userReportPagLimit = 10;
let userReportPagToken = 0;

function requestFailure(data) {
    alert("Failed to obtain user information");
    console.log("Error while issuing POST request");
    console.log(data);
}

function updateUserStatus(user_email) {
    $.post("/get-user-summary-status", {"email": user_email}, function () {
        console.log("User Status Request Response Received");
    }, "json").done(function (data) {
            $("#today-status-color").addClass("bg-" + data.color);
            $("#today-status-description").html(data.message);
        }
    ).fail(requestFailure)
}

function updateUserInteractions(user_email) {
    $.post("/paginate-user-interactions",
        {
            "email": user_email,
            "pagination_token": userInteractionPagToken,
            "limit": userInteractionPagLimit
        }, function () {
            console.log("Paginate User Interactions Request Response Received");
        }, "json").done(function (data) {
        userInteractionPagToken = data['pagination_token'];

        data['users'].forEach(function (e) {
            let rows = [
                "<a href='/user/" + e.email + "'>" + e.email + "</a>",
                e.timestamp
            ];
            $("#interactions").append("<tr><td>" + rows.join("</td><td>") + "</td>")
        })
    }).fail(requestFailure)
}

function updateUserReports(user_email) {
    $.post("/paginate-user-reports", {
        "email": user_email,
        "pagination_token": userReportPagToken,
        "limit": userReportPagLimit
    }, function () {
        console.log("Paginating user reports request response received");
    }, "json").done(function (data) {
        userReportPagToken = data['pagination_token'];

        data['records'].forEach(function (e) {
            let rows = [
                "<span class=\"badge badge-dot mr-4\"> <i class= \"bg-secondary\"></i></span>",
                e.timestamp
            ];
            $("#reports").append("<th scope='row'>" + e.message + "</th>")
                .append("<tr><td>" + rows.join("</td><td>") + "</td>");
        })
    }).fail(requestFailure)
}

function updateHomeStatusSummaries() {
    $.post("/paginate-user-summary-items", {
        "pagination_token": homeUserStatusPagToken,
        "limit": homeUserStatusPagLimit
    }, function () {
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
    $.post("/submitted-symptom-reports", {}, function () {
        console.log("Update submitted symptom reports received");
    }, "json").done(function (data) {
        $("#submitted-symptom-reports").html(data.value);
    }).fail(requestFailure);
}