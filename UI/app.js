var token_CN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1OTU4NzI2MTYsInVzZXJuYW1lIjoiQk9DIiwib3JnTmFtZSI6Ik9yZzIiLCJpYXQiOjE1OTU4MzY2MTZ9.fh1yDg36zDUIw8p-FExHcm1njV5pMmv-lBmVhv3Yfqo";
const url_l = "http://localhost:4000/channels/mychannel/chaincodes/mycc";
var account_list = [];
var count_id = 0;

$('#submit').click(function() {
    var id = $('#uid').val();
    var amount = $('#amount').val();
    var name = $('#uname').val();
    //console.log(id,amount);

    if (id == "" || amount == "" || name == "" ) {
        alert("Please input value.")
    }

    var account = randomAccount();

    var httpRequest = new XMLHttpRequest();
    var auth_str = "Bearer " + token_CN;
    httpRequest.open('POST', url_l, true);
    httpRequest.setRequestHeader("Content-type", "application/json");
    httpRequest.setRequestHeader("authorization", auth_str);
    const obj = {
        peers : ["peer0.org2.example.com","peer0.org1.example.com"],
        fcn : "createAccount",
        args : [name, id, "CHN", "CNY", amount, "BOC"]
    };
    httpRequest.send(JSON.stringify(obj));
    httpRequest.onreadystatechange = function () {
        if ( httpRequest.readyState == 4 && httpRequest.status == 200 ) {
            var json = httpRequest.responseText;
            var res = JSON.parse(json);
            var res_succ = res["success"];
            if ( res_succ == true ) {
                document.getElementById("message").style.display = "";
                document.getElementById("message").innerHTML = "Successfully created!";
                setTimeout(function () {
                    document.getElementById("message").style.display = "none";
                }, 1000);
                account_list.push({id, name, account, amount});
                console.log(account_list[0].id);
                addRow(name, account);
            } else {
                document.getElementById("message").style.display = "";
                document.getElementById("message").innerHTML = "Fail to create.";
                setTimeout(function () {
                    document.getElementById("message").style.display = "none";
                }, 1000);
            }
        } else {
            document.getElementById("message").style.display = "";
            document.getElementById("message").innerHTML = "Fail to transfer.";
            setTimeout(function () {
                document.getElementById("message").style.display = "none";
            }, 1000);
        }
    };
});


function addRow(name, account){
    var tableObj = document.getElementById('mytable');
    var rowNums = tableObj.rows.length;
    var newRow = tableObj.insertRow(rowNums);
    var col1 = newRow.insertCell(0);
    var col2 = newRow.insertCell(1);
    var col3 = newRow.insertCell(2);
    var col4 = newRow.insertCell(3);

    count_id += 1;
    col1.innerText = count_id;
    var myDate = new Date();
    col2.innerText = myDate.toLocaleString();
    col3.innerText = name;
    col4.innerText = account;
}


function randomAccount() {
    return (100000 + Math.round(Math.random() * (999999 - 100000)));
}
