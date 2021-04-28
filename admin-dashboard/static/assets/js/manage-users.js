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
    showPolicyModal();
    let data = {
        "pagination_token": communityUserPagToken,
        "limit": getall ? 10000 : communityUserPagLimit
    }

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
                class="member-edit-checkbox" ` + (selectedCommunityUsers.has(e.email) ? "checked" : "") + "/>",
                e.name + (e.active ? "" : " (invited)"),
                `<a href='/detail/${escapedEmail}'>${escapedEmail}</a>`,
                "<span class='badge badge-dot mr-4'><i class='bg-" + (e.blocked ? "danger" : "success") + "'></i>" +
                "<span>" + (e.blocked ? "Disabled" : "Active") + "</span>"
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
    if (checkbox.checked === true) {
        selectedCommunityUsers.add(checkbox.name);
    } else {
        selectedCommunityUsers.delete(checkbox.name);
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
    alert("This is the modification modal :)");
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
    }).fail(requestFailure)
}

/**
 * Submit the search for a member, re-paginating the table based on the new filter condition
 */
function submitMemberSearch() {
    communityUserPagToken = 0;
    const email = $('#email-input').val();
    $("#users").html("");
    populateMembersTable(email);
    $("#load-more-users").attr("onclick", `populateMembersTable("${email.escapeQuotes()}")`)
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

action = "/user/bulk-import-users"
method = "post"
enctype = "multipart/form-data"

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

