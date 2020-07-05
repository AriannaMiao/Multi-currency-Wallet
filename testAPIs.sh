#!/bin/bash
#
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

jq --version > /dev/null 2>&1
if [ $? -ne 0 ]; then
	echo "Please Install 'jq' https://stedolan.github.io/jq/ to execute this script"
	echo
	exit 1
fi

starttime=$(date +%s)

# Print the usage message
function printHelp () {
  echo "Usage: "
  echo "  ./testAPIs.sh -l golang|node"
  echo "    -l <language> - chaincode language (defaults to \"golang\")"
}
# Language defaults to "node"
LANGUAGE="node"

# Parse commandline args
while getopts "h?l:" opt; do
  case "$opt" in
    h|\?)
      printHelp
      exit 0
    ;;
    l)  LANGUAGE=$OPTARG
    ;;
  esac
done

##set chaincode path
function setChaincodePath(){
	LANGUAGE=`echo "$LANGUAGE" | tr '[:upper:]' '[:lower:]'`
	case "$LANGUAGE" in
		"golang")
		CC_SRC_PATH="github.com/example_cc/go"
		;;
		"node")
		CC_SRC_PATH="$PWD/artifacts/src/github.com/example_cc/node"
		;;
		*) printf "\n ------ Language $LANGUAGE is not supported yet ------\n"$
		exit 1
	esac
}

setChaincodePath

CC_NEW_PATH="$PWD/artifacts/src/github.com/marbles02/node"

echo "POST request Enroll on Org1  ..."
echo
ORG1_TOKEN=$(curl -s -X POST \
  http://localhost:4000/users \
  -H "content-type: application/x-www-form-urlencoded" \
  -d 'username=Satvik&orgName=Org1')
echo $ORG1_TOKEN
ORG1_TOKEN=$(echo $ORG1_TOKEN | jq ".token" | sed "s/\"//g")
echo
echo "ORG1 token is $ORG1_TOKEN"
echo
echo "POST request Enroll on Org2 ..."
echo
ORG2_TOKEN=$(curl -s -X POST \
  http://localhost:4000/users \
  -H "content-type: application/x-www-form-urlencoded" \
  -d 'username=Vikram&orgName=Org2')
echo $ORG2_TOKEN
ORG2_TOKEN=$(echo $ORG2_TOKEN | jq ".token" | sed "s/\"//g")
echo
echo "ORG2 token is $ORG2_TOKEN"
echo

echo
echo "POST request Enroll on Org3 ..."
echo
ORG3_TOKEN=$(curl -s -X POST \
  http://localhost:4000/users \
  -H "content-type: application/x-www-form-urlencoded" \
  -d 'username=Suresh&orgName=Org3')
echo $ORG3_TOKEN
ORG3_TOKEN=$(echo $ORG3_TOKEN | jq ".token" | sed "s/\"//g")
echo
echo "ORG3 token is $ORG3_TOKEN"
echo
echo
echo "POST request Create channel  ..."
echo
curl -s -X POST \
  http://localhost:4000/channels \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"channelName":"mychannel",
	"channelConfigPath":"../artifacts/channel/mychannel.tx"
}'
echo


echo
echo "POST request Create channel 2 ..."
echo
curl -s -X POST \
  http://localhost:4000/channels \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"channelName":"mychannelnew",
	"channelConfigPath":"../artifacts/channel/mychannelnew.tx"
}'
echo

echo
sleep 5
echo "POST request Join channel on Org1"
echo
curl -s -X POST \
  http://localhost:4000/channels/mychannel/peers \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer0.org1.example.com","peer1.org1.example.com"]
}'
echo
echo

echo "POST request Join channel on Org2"
echo
curl -s -X POST \
  http://localhost:4000/channels/mychannel/peers \
  -H "authorization: Bearer $ORG2_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer0.org2.example.com","peer1.org2.example.com"]
}'
echo

echo "POST request Join channel: mychannelnew on Org1"
echo
curl -s -X POST \
  http://localhost:4000/channels/mychannelnew/peers \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer0.org1.example.com","peer1.org1.example.com"]
}'
echo
echo

echo "POST request Join channel: mychannelnew on Org2"
echo
curl -s -X POST \
  http://localhost:4000/channels/mychannelnew/peers \
  -H "authorization: Bearer $ORG2_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer0.org2.example.com","peer1.org2.example.com"]
}'
echo
echo

echo "POST request Join channel: mychannelnew on Org3"
echo
curl -s -X POST \
  http://localhost:4000/channels/mychannelnew/peers \
  -H "authorization: Bearer $ORG3_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer0.org3.example.com","peer1.org3.example.com"]
}'
echo
echo

echo "POST request Update anchor peers on Org1"
echo
curl -s -X POST \
  http://localhost:4000/channels/mychannel/anchorpeers \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"configUpdatePath":"../artifacts/channel/Org1MSPanchors.tx"
}'
echo
echo

echo "POST request Update anchor peers on Org2"
echo
curl -s -X POST \
  http://localhost:4000/channels/mychannel/anchorpeers \
  -H "authorization: Bearer $ORG2_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"configUpdatePath":"../artifacts/channel/Org2MSPanchors.tx"
}'
echo
echo

echo "POST request Update anchor peers on Org1"
echo
curl -s -X POST \
  http://localhost:4000/channels/mychannelnew/anchorpeers \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"configUpdatePath":"../artifacts/channel/Org1MSPanchors2.tx"
}'
echo
echo

echo "POST request Update anchor peers on Org2"
echo
curl -s -X POST \
  http://localhost:4000/channels/mychannelnew/anchorpeers \
  -H "authorization: Bearer $ORG2_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"configUpdatePath":"../artifacts/channel/Org2MSPanchors2.tx"
}'
echo
echo

echo "POST request Update anchor peers on Org3"
echo
curl -s -X POST \
  http://localhost:4000/channels/mychannelnew/anchorpeers \
  -H "authorization: Bearer $ORG3_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"configUpdatePath":"../artifacts/channel/Org3MSPanchors2.tx"
}'
echo

echo "POST Install chaincode 1 on Org1"
echo
curl -s -X POST \
  http://localhost:4000/chaincodes \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
	\"peers\": [\"peer0.org1.example.com\",\"peer1.org1.example.com\"],
	\"chaincodeName\":\"mycc\",
	\"chaincodePath\":\"$CC_SRC_PATH\",
	\"chaincodeType\": \"$LANGUAGE\",
	\"chaincodeVersion\":\"v0\"
}"
echo
echo

echo "POST Install chaincode 2 on Org1"
echo
curl -s -X POST \
  http://localhost:4000/chaincodes \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
	\"peers\": [\"peer0.org1.example.com\",\"peer1.org1.example.com\"],
	\"chaincodeName\":\"mycc_new\",
	\"chaincodePath\":\"$CC_NEW_PATH\",
	\"chaincodeType\": \"$LANGUAGE\",
	\"chaincodeVersion\":\"v0\",
  \"channelName\":\"mychannelnew\"
}"
echo
echo

echo "POST Install chaincode 1 on Org2"
echo
curl -s -X POST \
  http://localhost:4000/chaincodes \
  -H "authorization: Bearer $ORG2_TOKEN" \
  -H "content-type: application/json" \
  -d "{
	\"peers\": [\"peer0.org2.example.com\",\"peer1.org2.example.com\"],
	\"chaincodeName\":\"mycc\",
	\"chaincodePath\":\"$CC_SRC_PATH\",
	\"chaincodeType\": \"$LANGUAGE\",
	\"chaincodeVersion\":\"v0\"
}"
echo
echo

echo "POST Install chaincode 2 on Org2"
echo
curl -s -X POST \
  http://localhost:4000/chaincodes \
  -H "authorization: Bearer $ORG2_TOKEN" \
  -H "content-type: application/json" \
  -d "{
	\"peers\": [\"peer0.org2.example.com\",\"peer1.org2.example.com\"],
	\"chaincodeName\":\"mycc_new\",
	\"chaincodePath\":\"$CC_NEW_PATH\",
	\"chaincodeType\": \"$LANGUAGE\",
	\"chaincodeVersion\":\"v0\",
  \"channelName\":\"mychannelnew\"
}"
echo
echo

echo "POST Install chaincode 2 on Org3"
echo
curl -s -X POST \
  http://localhost:4000/chaincodes \
  -H "authorization: Bearer $ORG3_TOKEN" \
  -H "content-type: application/json" \
  -d "{
	\"peers\": [\"peer0.org3.example.com\",\"peer1.org3.example.com\"],
	\"chaincodeName\":\"mycc_new\",
	\"chaincodePath\":\"$CC_NEW_PATH\",
	\"chaincodeType\": \"$LANGUAGE\",
	\"chaincodeVersion\":\"v0\",
  \"channelName\":\"mychannelnew\"
}"
echo
echo

echo "POST instantiate chaincode 1 on Org1"
echo
curl -s -X POST \
  http://localhost:4000/channels/mychannel/chaincodes \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
	\"chaincodeName\":\"mycc\",
	\"chaincodeVersion\":\"v0\",
	\"chaincodeType\": \"$LANGUAGE\",
	\"args\":[\"a\",\"100\",\"b\",\"200\"]
}"
echo
echo

echo "POST instantiate chaincode 2 on Org1"
echo
curl -s -X POST \
  http://localhost:4000/channels/mychannelnew/chaincodes \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
	\"chaincodeName\":\"mycc_new\",
	\"chaincodeVersion\":\"v0\",
	\"chaincodeType\": \"node\",
	\"args\":[\"init\"]
}"
echo
echo

echo "POST invoke chaincode 1 on peers of Org1 and Org2"
echo
VALUES=$(curl -s -X POST \
  http://localhost:4000/channels/mychannel/chaincodes/mycc \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"peers\": [\"peer0.org1.example.com\",\"peer0.org2.example.com\"],
  \"fcn\":\"move\",
  \"args\":[\"a\",\"b\",\"10\"]
}")
echo $VALUES
# Assign previous invoke transaction id  to TRX_ID
MESSAGE=$(echo $VALUES | jq -r ".message")
TRX_ID=${MESSAGE#*ID: }
echo

echo "POST invoke chaincode 2 on peers of Org1 and Org2"
echo
VALUES1=$(curl -s -X POST \
  http://localhost:4000/channels/mychannelnew/chaincodes/mycc_new \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"peers\": [\"peer0.org1.example.com\",\"peer0.org2.example.com\",\"peer0.org3.example.com\"],
  \"fcn\":\"initMarble\",
  \"args\":[\"marble1\",\"blue\",\"35\",\"tim\"]
}")
echo $VALUES1
MESSAGE1=$(echo $VALUES1 | jq -r ".message")
TRX_ID1=${MESSAGE1#*ID: }
echo

echo "POST invoke chaincode 2 on peers of Org1 and Org2"
echo
VALUES2=$(curl -s -X POST \
  http://localhost:4000/channels/mychannelnew/chaincodes/mycc_new \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"peers\": [\"peer0.org1.example.com\",\"peer0.org2.example.com\",\"peer0.org3.example.com\"],
  \"fcn\":\"initMarble\",
  \"args\":[\"marble2\",\"red\",\"135\",\"tim sr\"]
}")
echo $VALUES2
MESSAGE2=$(echo $VALUES2 | jq -r ".message")
TRX_ID2=${MESSAGE2#*ID: }
echo

echo "GET query chaincode 1 on peer1 of Org1"
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannel/chaincodes/mycc?peer=peer0.org1.example.com&fcn=query&args=%5B%22a%22%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo

echo "GET query chaincode 2 on peer1 of Org1"
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannelnew/chaincodes/mycc_new?peer=peer0.org1.example.com&fcn=readMarble&args=%5B%22marble1%22%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo

echo "GET query chaincode 2 on peer1 of Org1"
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannelnew/chaincodes/mycc_new?peer=peer0.org1.example.com&fcn=readMarble&args=%5B%22marble2%22%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo

echo "GET query Block by blockNumber of chaincode 1"
echo
BLOCK_INFO=$(curl -s -X GET \
  "http://localhost:4000/channels/mychannel/blocks/1?peer=peer0.org1.example.com" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json")
echo $BLOCK_INFO
# Assign previous block hash to HASH
HASH=$(echo $BLOCK_INFO | jq -r ".header.previous_hash")
echo

echo "GET query Block by blockNumber of chaincode 2"
echo
BLOCK_INFO=$(curl -s -X GET \
  "http://localhost:4000/channels/mychannel/blocks/5?peer=peer0.org1.example.com" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json")
echo $BLOCK_INFO
# Assign previous block hash to HASH
HASH=$(echo $BLOCK_INFO | jq -r ".header.previous_hash")
echo

echo "GET query Transaction by TransactionID 1"
echo
curl -s -X GET http://localhost:4000/channels/mychannel/transactions/$TRX_ID?peer=peer0.org1.example.com \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo

echo "GET query Transaction by TransactionID 2"
echo
curl -s -X GET http://localhost:4000/channels/mychannel/transactions/$TRX_ID1?peer=peer0.org1.example.com \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo


echo "GET query Block by Hash - Hash is $HASH"
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannel/blocks?hash=$HASH&peer=peer0.org1.example.com" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "cache-control: no-cache" \
  -H "content-type: application/json" \
  -H "x-access-token: $ORG1_TOKEN"
echo
echo

echo "GET query ChainInfo"
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannel?peer=peer0.org1.example.com" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo

echo "GET query Installed chaincodes"
echo
curl -s -X GET \
  "http://localhost:4000/chaincodes?peer=peer0.org1.example.com" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo

echo "GET query Instantiated chaincodes"
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannel/chaincodes?peer=peer0.org1.example.com" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo

echo
echo "GET query Instantiated chaincodes"
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannelnew/chaincodes?peer=peer0.org1.example.com" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo

echo "GET query Channels"
echo
curl -s -X GET \
  "http://localhost:4000/channels?peer=peer0.org1.example.com" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo


echo "Total execution time : $(($(date +%s)-starttime)) secs ..."
