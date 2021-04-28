$.ajaxSetup({
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

function requestFailure(data) {
    alert("[Error] Failed to communicate with backend services");
    console.log("Error while issuing POST request");
    console.log(data);
}
