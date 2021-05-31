const communityUserPagLimit = 300;
let communityUserPagToken = 0;

let selectedCommunityUsers = new Set();

/**
 * Populate the community members table on the home screen, with the ability to change
 * certain options for them.
 * @param email email if searching, which isolates pagination to only users with emails that start the same
 * @param getall should we skip pagination (default true)
 */
function populateMembersTable(email = null, getall = true) {
    let data = {
        "pagination_token": communityUserPagToken,
        "limit": getall ? 10000 : communityUserPagLimit
    };

    if (email != null) {
        data['email'] = email.escapeQuotes();
    }

    $.post("/user/paginate-users", JSON.stringify(data), function () {
        console.log("Get community members request received...")
    }, "json").done(function (data) {
        if (data['users'].length === 0) {
            $("#home-footer").hide();
            return;
        }

        communityUserPagToken = data['pagination_token'];

        data['users'].forEach(function (e) {
            let escapedEmail = e.email.escapeQuotes();
            let rows = [
                `<input type='checkbox' onchange='userSelectionChange(this)' name="${escapedEmail}" 
                class="member-edit-checkbox big-select" ` + (selectedCommunityUsers.has(escapedEmail) ? "checked" : "") + "/>",
                e.name + (e.active ? "" : " (invited)"),
                `<a href='/detail/${escapedEmail}'>${escapedEmail}</a>`,
                "<span class='badge badge-dot mr-4'><i class='bg-" + (e.blocked ? "danger" : "success") + "'></i>" +
                "<span>" + (e.blocked ? "Disabled" : "Enabled") + "</span>"
            ];
            $("#users").append("<tr><td>" + rows.join("</td><td>") + "</td>");
        })
    }).fail(requestFailure)

}

/**
 * Update the buttons if users check or uncheck a checkbox
 * @param checkbox the checkbox element altered
 */
function userSelectionChange(checkbox) {
    if (checkbox.checked) {
        selectedCommunityUsers.add(checkbox.name.renderQuotes());
    } else {
        selectedCommunityUsers.delete(checkbox.name.renderQuotes());
    }

    if (selectedCommunityUsers.size === 0) {
        deselectAllUsers();
    } else {
        $("#user-button-1").html(`Deselect ${selectedCommunityUsers.size} users`).attr('onclick', 'deselectAllUsers()');
        $("#user-button-2").html(`Modify ${selectedCommunityUsers.size} users`).attr('onclick', 'showModifyModal()');
    }
}

/**
 * Show the user modification dialog
 */
function showModifyModal() {
    $("#modify-users").modal("show");
     $.get("/user/current-user-roles", function () {
        console.log("Got Current User Roles");
    }, "json").done(function (data) {
        if (data.roles.length > 1){
            $("#switch-report").show();
            $("#campus-history-warning").show();
            $("#delete-campus-history-btn").show();
        }
     }).fail(requestFailure)
}

/**
 * Reset the buttons back to their original state, and uncheck all users currently listed.
 */
function deselectAllUsers() {
    $(':checkbox').each(function () {
        this.checked = false;
    });
    $("#user-button-1").html("Import from CSV").attr('onclick', 'showUserImportModal()');
    $("#user-button-2").html("Invite User").attr('onclick', 'showUserInviteModal()');
    selectedCommunityUsers.clear();
}

/**
 * Get Invite Statistics and update top statistics widget on manage users page
 */
function updateInviteStatsWidget() {
    $.get("/user/get-invite-stats", function () {
        console.log("Received Invite Stats");
    }, "json").done(function (data) {
        $("#active-members").html(data.active);
        $("#inactive-members").html(data.inactive);
    }).fail(requestFailure);
}

/**
 * Submit the search for a member, re-paginating the table based on the new filter condition
 */
function submitMemberSearch() {
    communityUserPagToken = 0;
    const email = $('#email-input').val();
    $("#users").html("");
    populateMembersTable(email);
    $("#load-more-users").attr("onclick", `populateMembersTable("${email.escapeQuotes()}")`);
    $("#search-toggle").html("<br><button class='btn btn-secondary' onclick='clearMemberSearch()'>Clear Search</button>");
}

/**
 * Remove the search query, re-pagining the table without a filter condition
 */
function clearMemberSearch() {
    communityUserPagToken = 0;
    $("#email-input").val("");
    $("#users").html("");
    populateMembersTable();
    $("#search-toggle").html("");
    $("#load-more-home").attr("onclick", "populateMembersTable()");
}

/**
 Show the bulk import modal
 **/
function showUserImportModal() {

    $("#user-import").modal("show");
}

/**
 * Show the single user invite modal
 */
function showUserInviteModal(){
    $("#invite-user").modal("show");
}

/**
 * Initiate bulk import of an uploaded CSV by submitting the form containing the CSV file
 */
async function initiateBulkImport() {
    $("#import-submit").html("Processing...").prop('disabled', true);
    let formData = new FormData(document.getElementById("bulk-import"));
    formData.append('users', $('input[type=file]')[0].files[0]);

    $.ajax({
        url: '/user/bulk-import-users',
        type: 'POST',
        data: formData,
        contentType: false,
        processData: false,
        success: async function () {
            await sleep(3000);
            $("#import-submit").html("Success");
            await sleep(500);
            $("#user-import").modal("hide");
            $("#import-submit").html("Submit");
            window.location.reload();
        }
    })
}

/**
 Send the request to create a new user from the invite form.
 Takes data from the form and sends an AJAX request to the backend.
 **/
function submitInviteUser() {
    const email = $("#user_email").val();
    const first_name = $("#user_first_name").val();
    const last_name = $("#user_last_name").val();
    const vaccinated = $("input[name='vaccinated']:checked").val();
    const location = $("input[name='location']:checked").val();

    if (email == null || first_name == null || last_name == null || vaccinated == null || location == null) {
        alert("You must fill in all fields in the form to submit!");
        return;
    }
    let payload = {
        "email": email, "first_name": first_name, "last_name": last_name,
        "vaccinated": JSON.parse(vaccinated.toLowerCase()) ? "vaccinated" : "not_vaccinated",
        "location": location
    };
    $("#submitInviteUser").prop('disabled', true).html("Processing...")
    $.post('/user/create-user', JSON.stringify(payload), function () {
        console.log("Submit Invite User Completed!");
    }, "json").done(async function (data) {
        let submitBtn = $("#submitInviteUser");
        submitBtn.html("Success.");
        await sleep(1500);
        $("#invite-user").modal("hide");
        submitBtn.prop('disabled', false);
        window.location.reload();
    }).fail(requestFailure)
}

/**
 * Prompt user for confirmation before an operation
 */
function confirmUserConsent(operation, callback) {
    let userItems = '';
    selectedCommunityUsers.forEach(function (email) {
        userItems += '<li>' + email.escapeQuotes() + '</li>'
    })
    let body = `<p>Are you sure you want to ${operation} ${selectedCommunityUsers.size} users? 
                The following users will be affected:</p><br><ul>${userItems}</ul>`;
    $("#confirm-title").html("Are you sure?");
    $("#confirm-body").html(body);

    $("#confirm-modal").modal("show");
    $("#confirm-agree").on("click", function () {
        $("#confirm-modal").modal('hide');
        callback();
    })

    $("#confirm-reject").on("click", function () {
        $("#confirm-modal").modal('hide');
        $("#modify-users").modal('hide');
    })
}

/**
 * Submit a request to the backend to toggle the access of the currently
 * selected users. This changes their ability to auth into the backend by revoking their JWT
 * @param disable whether or not to disable the user (true = disable, false = enable)
 */
function submitCheckedToggleAccess(disable = true) {
    confirmUserConsent(disable ? "disable" : "enable", function () {
        $(".btn-reduced").prop('disabled', true);
        let selectedButton = $(disable ? "#disable-access-btn" : "#enable-access-btn");
        selectedButton.html("Processing...");
        let users = [];
        selectedCommunityUsers.forEach(function (email) {
            users.push({"email": email, "block": disable});
        })
        $.post('/user/toggle-access', JSON.stringify({"users": users}), function () {
            console.log("Toggle Access User Complete")
        }, "json").done(async function (data) {
            selectedButton.html("Success.");
            await sleep(1000);
            $("#modify-users").modal("hide");
            $(".btn-reduced").prop('disabled', false);
            window.location.reload();
        }).fail(requestFailure);
    })
}

/**
 * Submit a request to the backend to reset the passwords (re-invite)
 * the selected users
 */
function submitCheckedPasswordReset() {
    confirmUserConsent("re-invite", function () {
        $(".btn-reduced").prop('disabled', true);
        let selectedButton = $("#password-reset-btn");
        selectedButton.html("Processing...");
        let identifiers = [];
        selectedCommunityUsers.forEach(function (email) {
            identifiers.push({"email": email});
        });
        $.post("/user/password-reset", JSON.stringify({"identifiers": identifiers}), function () {
            console.log("Password Reset Complete.")
        }, "json").done(async function (data) {
            selectedButton.html("Success.");
            await sleep(1000);
            $("#modify-users").modal("hide");
            $(".btn-reduced").prop('disabled', false);
            window.location.reload();
        })
    })
}

/**
 * Show the campus selection modal for trigger options that require those
 */
function showActionModalSwitchCampus(){
    $("#switch-report-btn")
}
/**
 * Submit a request to the backend to permanently delete the selected users
 */
function submitCheckedDeleteUsers() {
    confirmUserConsent("delete", function () {
        $(".btn-reduced").prop('disabled', true);
        let selectedButton = $("#delete-users-btn");
        selectedButton.html("Processing...");
        let identifiers = [];
        selectedCommunityUsers.forEach(function (email) {
            identifiers.push({"email": email});
        });
        $.delete("/user/delete-users", JSON.stringify({"identifiers": identifiers}), function (){
            console.log("Delete Users Complete.");
        }, "json").done(async function (data){
            selectedButton.html("Success.");
            await sleep(1500);
            $("#modify-users").modal("hide");
            $(".btn-reduced").prop('disabled', false);
            window.location.reload();
        }).fail(requestFailure)
    })
}

