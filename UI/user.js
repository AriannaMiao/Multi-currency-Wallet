var count_HKD = 0;
var count_CNY = 0;
var count_USD = 0;
var cust_id = "";
var cust_name = "";
//const url_l = "http://ec2-34-210-103-18.us-west-2.compute.amazonaws.com:4000/channels/mychannel/chaincodes/mycc";
//const url_t = "http://ec2-34-210-103-18.us-west-2.compute.amazonaws.com:4000/channels/mychannel/transactions/";
const url_l = "http://localhost:4000/channels/mychannel/chaincodes/mycc";
const url_t = "http://localhost:4000/channels/mychannel/transactions/";
var token_HK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1OTYyOTgyOTAsInVzZXJuYW1lIjoiQk9DSEsiLCJvcmdOYW1lIjoiT3JnMSIsImlhdCI6MTU5NjI2MjI5MH0.FgHRWt0HNi7qWKYctb8scL8gET-gYv-RvhT-arGvhFM";
var token_OT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1OTYyOTgyOTEsInVzZXJuYW1lIjoiQk9DIiwib3JnTmFtZSI6Ik9yZzIiLCJpYXQiOjE1OTYyNjIyOTF9.oSjh5nw0w8e3HzswFAj7RnvOsC57t0ZsRIw69Zgw6SI";

function change_rate(scurt, tcurt, scode, tcode, am, callback) {
    var url_r = 'http://api.k780.com/?app=finance.rate&scur=' + scurt + '&tcur=' + tcurt + '&appkey=53048&sign=ee6a1a4df5ec5f7b212e9c5d78abf781&format=json&jsoncallback=data';
    $.ajax({
        type          : 'get',
        async         : false,
        url           : url_r,
        dataType      : 'jsonp',
        jsonp         : 'callback',
        jsonpCallback : 'data',
        success       : function(data){
            var amo = parseInt(am);
            if( data.success != '1' ) {
                console.log(data.msgid + ' ' + data.msg);
                exit;
            }
            var ret_rate = data["result"]["rate"];
            console.log(scurt, tcurt, ret_rate);
            alert("Amount: " + am + scurt + " = " + amo*ret_rate + tcurt);
            var f_pair = scurt + ":" + tcurt;
            var httpRequest = new XMLHttpRequest();
            var auth_str = "Bearer ";
            if ( scode == 1 ) {
                auth_str = auth_str + token_HK;
            } else if ( scode == 2 ) {
                auth_str = auth_str + token_OT;
            }
            httpRequest.open('POST', url_l, true);
            httpRequest.setRequestHeader("Content-type", "application/json");
            httpRequest.setRequestHeader("authorization", auth_str);
            var peers = "peer0.org" + String(scode) + ".example.com";
            var peert = "peer0.org" + String(tcode) + ".example.com";
            console.log(peers, peert);
            const obj = {
                peers : [peers, peert],
                fcn : "createForex",
                args : [f_pair, String(ret_rate)]
            };
            httpRequest.send(JSON.stringify(obj));
            httpRequest.onreadystatechange = function () {
                if (httpRequest.readyState == 4 && httpRequest.status == 200) {
                    var json = httpRequest.responseText;
                    var res = JSON.parse(json);
                    console.log(res);
                    var res_succ = res["success"];
                    if ( res_succ != true ) {
                        document.getElementById("create_message").style.display = "";
                        document.getElementById("create_message").innerHTML = "Fail to check exchange rate.";
                    }
                    callback();
                }
            };
        },
        error:function(){
            alert('fail');
        }
    });
}

$('#login_b').click(function() {
    cust_name = $('#login').val();
    var xhr = new XMLHttpRequest();
    xhr.open('get','../org1token.txt', true);
    xhr.send();
    xhr.onreadystatechange = function () {
        if ( xhr.status == 200 || xhr.status == 0 ) {
            token_HK = xhr.responseText;
        }
    };
    xhr.open('get','../org2token.txt', true);
    xhr.send();
    xhr.onreadystatechange = function () {
        if ( xhr.status == 200 || xhr.status == 0 ) {
            token_OT = xhr.responseText;
        }
    };
    document.getElementById("login_win").style.display = "none";
    document.getElementById("money").style.display = "";
    document.getElementById("create_div").style.display = "";
});

$('#HKD_A').click(function() {
    console.log(token_HK);
    count_HKD = 1 - count_HKD;
    if ( count_HKD == 1 ) {
        document.getElementById("HKD_1").innerHTML = '??';
        document.getElementById("HKD_0").innerHTML = '??';
        if ( cust_id == "" ) {
            document.getElementById("create_message").style.display = "";
            document.getElementById("create_message").innerHTML = "Please input Cust ID first.";
        }
        var httpRequest = new XMLHttpRequest();
        var auth_str = "Bearer " + token_HK;
        var que_str = cust_name + "_BOCHK_" + cust_id;
        httpRequest.open('POST', url_l, true);
        httpRequest.setRequestHeader("Content-type", "application/json");
        httpRequest.setRequestHeader("authorization", auth_str);
        const obj = {
            peers : ["peer0.org1.example.com","peer0.org2.example.com"],
            fcn : "query",
            args : [que_str]
        };
        httpRequest.send(JSON.stringify(obj));
        httpRequest.onreadystatechange = function () {
            if ( httpRequest.readyState == 4 && httpRequest.status == 200 ) {
                var json = httpRequest.responseText;
                var res = JSON.parse(json);
                var res_succ = res["success"];
                if ( res_succ == false ) {
                    document.getElementById("create_message").style.display = "";
                    document.getElementById("create_message").innerHTML = "No result, please check.";
                    setTimeout(function () {
                        document.getElementById("create_message").style.display = "none";
                    }, 1000);
                    exit;
                }
                var trans_id = res["message"].split(":")[1].split(" ")[1];
                var url_tran = url_t + trans_id + "?peer=peer0.org1.example.com";
                var transhttpRequest = new XMLHttpRequest();
                transhttpRequest.open('GET', url_tran, true);
                transhttpRequest.setRequestHeader("content-type", "application/json");
                transhttpRequest.setRequestHeader("authorization", auth_str);
                transhttpRequest.send();
                transhttpRequest.onreadystatechange = function () {
                    if ( transhttpRequest.readyState == 4 && transhttpRequest.status == 200 ) {
                        var trans_json = transhttpRequest.responseText;
                        var res_trans = JSON.parse(trans_json)["transactionEnvelope"]["payload"]["data"]["actions"][0]["payload"]["action"]["proposal_response_payload"]["extension"]["response"]["payload"];
                        var num = JSON.parse(res_trans)["balance"];
                        var num1 = Math.trunc(num);
                        var num0 = Math.trunc(num * 100) % 100;
                        document.getElementById("HKD_1").innerHTML = "" + num1;
                        if ( num0 < 10 ) {
                            document.getElementById("HKD_0").innerHTML = "0" + num0;
                        } else {
                            document.getElementById("HKD_0").innerHTML = num0;
                        }
                    }
                };
            }
        };
    } else {
        document.getElementById("HKD_1").innerHTML = '**';
        document.getElementById("HKD_0").innerHTML = '**';
    }
});

$('#HKD_T').click(function() {
    if( document.getElementById("HKD_Trans").style.display == "none" ) {
        document.getElementById("HKD_Trans").style.display = "";
    } else {
        document.getElementById("HKD_Trans").style.display = "none";
    }
    if( document.getElementById("HKD_CNY").style.display == "none" ) {
        document.getElementById("HKD_CNY").style.display = "inline-block";
    } else {
        document.getElementById("HKD_CNY").style.display = "none";
    }
    if( document.getElementById("HKD_USD").style.display == "none" ) {
        document.getElementById("HKD_USD").style.display = "inline-block";
    } else {
        document.getElementById("HKD_USD").style.display = "none";
    }
});

$('#HKD_CNY').click(function () {
    var trans_am = $('#HKD_Trans').val();
    if ( cust_id == "" ) {
        document.getElementById("create_message").style.display = "";
        document.getElementById("create_message").innerHTML = "Please input Cust ID first.";
        exit;
    }
    change_rate('HKD', 'CNY', 1, 2, trans_am, function() {
        var httpRequest = new XMLHttpRequest();
        var auth_str = "Bearer " + token_HK;
        var from_str = cust_name + "_BOCHK_" + cust_id;
        var to_str = cust_name + "_BOC_" + cust_id;
        httpRequest.open('POST', url_l, true);
        httpRequest.setRequestHeader("Content-type", "application/json");
        httpRequest.setRequestHeader("authorization", auth_str);
        const obj = {
            peers : ["peer0.org1.example.com","peer0.org2.example.com"],
            fcn : "pay",
            args : [from_str, to_str, trans_am]
        };
        httpRequest.send(JSON.stringify(obj));
        httpRequest.onreadystatechange = function () {
            if ( httpRequest.readyState == 4 && httpRequest.status == 200 ) {
                var json = httpRequest.responseText;
                var res = JSON.parse(json);
                console.log(res, trans_am);
                var res_succ = res["success"];
                if ( res_succ == true ) {
                    document.getElementById("create_message").style.display = "";
                    document.getElementById("create_message").innerHTML = "Successfully transferred!";
                    setTimeout(function () {
                        document.getElementById("create_message").style.display = "none";
                    }, 1000);
                    document.getElementById("HKD_A").click();
                    document.getElementById("HKD_A").click();
                    document.getElementById("CNY_A").click();
                    document.getElementById("CNY_A").click();
                } else {
                    document.getElementById("create_message").style.display = "";
                    document.getElementById("create_message").innerHTML = "Fail to transfer.";
                    setTimeout(function () {
                        document.getElementById("create_message").style.display = "none";
                    }, 1000);
                }
            } else {
                document.getElementById("create_message").style.display = "";
                document.getElementById("create_message").innerHTML = "Fail to transfer.";
                setTimeout(function () {
                    document.getElementById("create_message").style.display = "none";
                }, 1000);
            }
        };
    });
});

$('#HKD_USD').click(function () {
    var trans_am = $('#HKD_Trans').val();
    if ( cust_id == "" ) {
        document.getElementById("create_message").style.display = "";
        document.getElementById("create_message").innerHTML = "Please input Cust ID first.";
        exit;
    }
    change_rate('HKD', 'USD', 1, 2, trans_am, function() {
        var httpRequest = new XMLHttpRequest();
        var auth_str = "Bearer " + token_HK;
        var from_str = cust_name + "_BOCHK_" + cust_id;
        var to_str = cust_name + "_BOA_" + cust_id;
        httpRequest.open('POST', url_l, true);
        httpRequest.setRequestHeader("Content-type", "application/json");
        httpRequest.setRequestHeader("authorization", auth_str);
        const obj = {
            peers : ["peer0.org1.example.com","peer0.org2.example.com"],
            fcn : "pay",
            args : [from_str, to_str, trans_am]
        };
        httpRequest.send(JSON.stringify(obj));
        httpRequest.onreadystatechange = function () {
            if ( httpRequest.readyState == 4 && httpRequest.status == 200 ) {
                var json = httpRequest.responseText;
                var res = JSON.parse(json);
                console.log(res, trans_am);
                var res_succ = res["success"];
                if ( res_succ == true ) {
                    document.getElementById("create_message").style.display = "";
                    document.getElementById("create_message").innerHTML = "Successfully transferred!";
                    setTimeout(function () {
                        document.getElementById("create_message").style.display = "none";
                    }, 1000);
                    document.getElementById("HKD_A").click();
                    document.getElementById("HKD_A").click();
                    document.getElementById("USD_A").click();
                    document.getElementById("USD_A").click();
                } else {
                    document.getElementById("create_message").style.display = "";
                    document.getElementById("create_message").innerHTML = "Fail to transfer.";
                    setTimeout(function () {
                        document.getElementById("create_message").style.display = "none";
                    }, 1000);
                }
            } else {
                document.getElementById("create_message").style.display = "";
                document.getElementById("create_message").innerHTML = "Fail to transfer.";
                setTimeout(function () {
                    document.getElementById("create_message").style.display = "none";
                }, 1000);
            }
        };
    });
});

$('#CNY_A').click(function() {
    count_CNY = 1 - count_CNY;
    if ( count_CNY == 1 ) {
        document.getElementById("CNY_1").innerHTML = '??';
        document.getElementById("CNY_0").innerHTML = '??';
        if ( cust_id == "" ) {
            document.getElementById("create_message").style.display = "";
            document.getElementById("create_message").innerHTML = "Please input Cust ID first.";
            exit;
        }
        var httpRequest = new XMLHttpRequest();
        var auth_str = "Bearer " + token_OT;
        var que_str = cust_name + "_BOC_" + cust_id;
        httpRequest.open('POST', url_l, true);
        httpRequest.setRequestHeader("Content-type", "application/json");
        httpRequest.setRequestHeader("authorization", auth_str);
        const obj = {
            peers : ["peer0.org2.example.com","peer0.org1.example.com"],
            fcn : "query",
            args : [que_str]
        };
        httpRequest.send(JSON.stringify(obj));
        httpRequest.onreadystatechange = function () {
            if ( httpRequest.readyState == 4 && httpRequest.status == 200 ) {
                var json = httpRequest.responseText;
                var res = JSON.parse(json);
                var res_succ = res["success"];
                if ( res_succ == false ) {
                    document.getElementById("create_message").style.display = "";
                    document.getElementById("create_message").innerHTML = "No result, please check.";
                    setTimeout(function () {
                        document.getElementById("create_message").style.display = "none";
                    }, 1000);
                    exit;
                }
                var trans_id = res["message"].split(":")[1].split(" ")[1];
                var url_tran = url_t + trans_id + "?peer=peer0.org1.example.com";
                var transhttpRequest = new XMLHttpRequest();
                transhttpRequest.open('GET', url_tran, true);
                transhttpRequest.setRequestHeader("content-type", "application/json");
                transhttpRequest.setRequestHeader("authorization", auth_str);
                transhttpRequest.send();
                transhttpRequest.onreadystatechange = function () {
                    if ( transhttpRequest.readyState == 4 && transhttpRequest.status == 200 ) {
                        var trans_json = transhttpRequest.responseText;
                        var res_trans = JSON.parse(trans_json)["transactionEnvelope"]["payload"]["data"]["actions"][0]["payload"]["action"]["proposal_response_payload"]["extension"]["response"]["payload"];
                        var num = JSON.parse(res_trans)["balance"];
                        var num1 = Math.trunc(num);
                        var num0 = Math.trunc(num * 100) % 100;
                        document.getElementById("CNY_1").innerHTML = "" + num1;
                        if ( num0 < 10 ) {
                            document.getElementById("CNY_0").innerHTML = "0" + num0;
                        } else {
                            document.getElementById("CNY_0").innerHTML = "" + num0;
                        }
                    }
                };
            }
        };
    } else {
        document.getElementById("CNY_1").innerHTML = '**';
        document.getElementById("CNY_0").innerHTML = '**';
    }

});

$('#CNY_T').click(function() {
    if( document.getElementById("CNY_Trans").style.display == "none" ) {
        document.getElementById("CNY_Trans").style.display = "";
    } else {
        document.getElementById("CNY_Trans").style.display = "none";
    }
    if( document.getElementById("CNY_HKD").style.display == "none" ) {
        document.getElementById("CNY_HKD").style.display = "inline-block";
    } else {
        document.getElementById("CNY_HKD").style.display = "none";
    }
});

$('#CNY_HKD').click(function () {
    var trans_am = $('#CNY_Trans').val();
    if ( cust_id == "" ) {
        document.getElementById("create_message").style.display = "";
        document.getElementById("create_message").innerHTML = "Please input Cust ID first.";
        exit;
    }
    change_rate('CNY', 'HKD', 2, 1, trans_am, function() {
        var httpRequest = new XMLHttpRequest();
        var auth_str = "Bearer " + token_OT;
        var from_str = cust_name + "_BOC_" + cust_id;
        var to_str = cust_name + "_BOCHK_" + cust_id;
        httpRequest.open('POST', url_l, true);
        httpRequest.setRequestHeader("Content-type", "application/json");
        httpRequest.setRequestHeader("authorization", auth_str);
        const obj = {
            peers : ["peer0.org2.example.com","peer0.org1.example.com"],
            fcn : "pay",
            args : [from_str, to_str, trans_am]
        };
        httpRequest.send(JSON.stringify(obj));
        httpRequest.onreadystatechange = function () {
            if ( httpRequest.readyState == 4 && httpRequest.status == 200 ) {
                var json = httpRequest.responseText;
                var res = JSON.parse(json);
                console.log(res, trans_am);
                var res_succ = res["success"];
                if ( res_succ == true ) {
                    document.getElementById("create_message").style.display = "";
                    document.getElementById("create_message").innerHTML = "Successfully transferred!";
                    setTimeout(function () {
                        document.getElementById("create_message").style.display = "none";
                    }, 1000);
                    document.getElementById("HKD_A").click();
                    document.getElementById("HKD_A").click();
                    document.getElementById("CNY_A").click();
                    document.getElementById("CNY_A").click();
                } else {
                    document.getElementById("create_message").style.display = "";
                    document.getElementById("create_message").innerHTML = "Fail to transfer.";
                    setTimeout(function () {
                        document.getElementById("create_message").style.display = "none";
                    }, 1000);
                }
            } else {
                document.getElementById("create_message").style.display = "";
                document.getElementById("create_message").innerHTML = "Fail to transfer.";
                setTimeout(function () {
                    document.getElementById("create_message").style.display = "none";
                }, 1000);
            }
        };
    });
});

$('#USD_A').click(function() {
    count_USD = 1 - count_USD;
    if ( count_USD == 1 ) {
        document.getElementById("USD_1").innerHTML = '??';
        document.getElementById("USD_0").innerHTML = '??';
        if ( cust_id == "" ) {
            document.getElementById("create_message").style.display = "";
            document.getElementById("create_message").innerHTML = "Please input Cust ID first.";
        }
        var httpRequest = new XMLHttpRequest();
        var auth_str = "Bearer " + token_OT;
        var que_str = cust_name + "_BOA_" + cust_id;
        httpRequest.open('POST', url_l, true);
        httpRequest.setRequestHeader("Content-type", "application/json");
        httpRequest.setRequestHeader("authorization", auth_str);
        const obj = {
            peers : ["peer0.org2.example.com","peer0.org1.example.com"],
            fcn : "query",
            args : [que_str]
        };
        httpRequest.send(JSON.stringify(obj));
        httpRequest.onreadystatechange = function () {
            if ( httpRequest.readyState == 4 && httpRequest.status == 200 ) {
                var json = httpRequest.responseText;
                var res = JSON.parse(json);
                var res_succ = res["success"];
                if ( res_succ == false ) {
                    document.getElementById("create_message").style.display = "";
                    document.getElementById("create_message").innerHTML = "No result, please check.";
                    setTimeout(function () {
                        document.getElementById("create_message").style.display = "none";
                    }, 1000);
                    exit;
                }
                var trans_id = res["message"].split(":")[1].split(" ")[1];
                var url_tran = url_t + trans_id + "?peer=peer0.org2.example.com";
                var transhttpRequest = new XMLHttpRequest();
                transhttpRequest.open('GET', url_tran, true);
                transhttpRequest.setRequestHeader("content-type", "application/json");
                transhttpRequest.setRequestHeader("authorization", auth_str);
                transhttpRequest.send();
                transhttpRequest.onreadystatechange = function () {
                    if ( transhttpRequest.readyState == 4 && transhttpRequest.status == 200 ) {
                        var trans_json = transhttpRequest.responseText;
                        var res_trans = JSON.parse(trans_json)["transactionEnvelope"]["payload"]["data"]["actions"][0]["payload"]["action"]["proposal_response_payload"]["extension"]["response"]["payload"];
                        var num = JSON.parse(res_trans)["balance"];
                        var num1 = Math.trunc(num);
                        var num0 = Math.trunc(num * 100) % 100;
                        document.getElementById("USD_1").innerHTML = "" + num1;
                        if ( num0 < 10 ) {
                            document.getElementById("USD_0").innerHTML = "0" + num0;
                        } else {
                            document.getElementById("USD_0").innerHTML = num0;
                        }
                    }
                };
            }
        };
    } else {
        document.getElementById("USD_1").innerHTML = '**';
        document.getElementById("USD_0").innerHTML = '**';
    }
});

$('#USD_T').click(function() {
    if( document.getElementById("USD_Trans").style.display == "none" ) {
        document.getElementById("USD_Trans").style.display = "";
    } else {
        document.getElementById("USD_Trans").style.display = "none";
    }
    if( document.getElementById("USD_HKD").style.display == "none" ) {
        document.getElementById("USD_HKD").style.display = "inline-block";
    } else {
        document.getElementById("USD_HKD").style.display = "none";
    }
});

$('#USD_HKD').click(function() {
    var trans_am = $('#USD_Trans').val();
    if ( cust_id == "" ) {
        document.getElementById("create_message").style.display = "";
        document.getElementById("create_message").innerHTML = "Please input Cust ID first.";
        exit;
    }
    change_rate('USD', 'HKD', 2, 1, trans_am, function() {
        var httpRequest = new XMLHttpRequest();
        var auth_str = "Bearer " + token_OT;
        var from_str = cust_name + "_BOA_" + cust_id;
        var to_str = cust_name + "_BOCHK_" + cust_id;
        httpRequest.open('POST', url_l, true);
        httpRequest.setRequestHeader("Content-type", "application/json");
        httpRequest.setRequestHeader("authorization", auth_str);
        const obj = {
            peers : ["peer0.org2.example.com","peer0.org1.example.com"],
            fcn : "pay",
            args : [from_str, to_str, trans_am]
        };
        httpRequest.send(JSON.stringify(obj));
        httpRequest.onreadystatechange = function () {
            if ( httpRequest.readyState == 4 && httpRequest.status == 200 ) {
                var json = httpRequest.responseText;
                var res = JSON.parse(json);
                console.log(res, trans_am);
                var res_succ = res["success"];
                if ( res_succ == true ) {
                    document.getElementById("create_message").style.display = "";
                    document.getElementById("create_message").innerHTML = "Successfully transferred!";
                    setTimeout(function () {
                        document.getElementById("create_message").style.display = "none";
                    }, 1000);
                    document.getElementById("HKD_A").click();
                    document.getElementById("HKD_A").click();
                    document.getElementById("USD_A").click();
                    document.getElementById("USD_A").click();
                } else {
                    document.getElementById("create_message").style.display = "";
                    document.getElementById("create_message").innerHTML = "Fail to transfer.";
                    setTimeout(function () {
                        document.getElementById("create_message").style.display = "none";
                    }, 1000);
                }
            } else {
                document.getElementById("create_message").style.display = "";
                document.getElementById("create_message").innerHTML = "Fail to transfer.";
                setTimeout(function () {
                    document.getElementById("create_message").style.display = "none";
                }, 1000);
            }
        };
    });
})

$('#create_b').click(function() {
    cust_id = $('#search').val();
    document.getElementById("create_message").style.display = "";
    document.getElementById("create_message").innerHTML = "Creating with " + cust_id + " ......";
    //get Message
    setTimeout(function () {
        document.getElementById("create_message").style.display = "none";
    }, 1000);
});