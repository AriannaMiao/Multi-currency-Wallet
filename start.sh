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

echo "POST request Enroll on Org1  ..."
echo
ORG1_TOKEN=$(curl -s -X POST \
  http://localhost:4000/users \
  -H "content-type: application/x-www-form-urlencoded" \
  -d 'username=BOCHK&orgName=Org1')
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
  -d 'username=BOC&orgName=Org2')
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
  -d 'username=BOA&orgName=Org3')
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
sleep 10
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

echo "POST Install chaincode 1 on Org1"
echo
curl -s -X POST \
  http://localhost:4000/chaincodes \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
	\"peers\": [\"peer0.org1.example.com\",\"peer1.org1.example.com\"],
	\"chaincodeName\":\"mycc\",
	\"chaincodePath\":\"bank\",
	\"chaincodeType\": \"golang\",
	\"chaincodeVersion\":\"v0\"
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
	\"chaincodePath\":\"bank\",
	\"chaincodeType\": \"golang\",
	\"chaincodeVersion\":\"v0\"
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
	\"chaincodeType\": \"golang\",
	\"args\":[]
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
  \"fcn\":\"createBank\",
  \"args\":[\"BOCHK\",\"HK\",\"HKD\", \"100000\"]
}")
echo $VALUES
# Assign previous invoke transaction id  to TRX_ID
MESSAGE=$(echo $VALUES | jq -r ".message")
TRX_ID=${MESSAGE#*ID: }
echo

echo "POST invoke chaincode 1 on peers of Org1 and Org2"
echo
VALUES=$(curl -s -X POST \
  http://localhost:4000/channels/mychannel/chaincodes/mycc \
  -H "authorization: Bearer $ORG2_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"peers\": [\"peer0.org2.example.com\",\"peer0.org1.example.com\"],
  \"fcn\":\"createBank\",
  \"args\":[\"BOC\",\"CHN\",\"CNY\", \"100000\"]
}")
echo $VALUES
# Assign previous invoke transaction id  to TRX_ID
MESSAGE=$(echo $VALUES | jq -r ".message")
TRX_ID=${MESSAGE#*ID: }
echo

echo "POST invoke chaincode 1 on peers of Org1 and Org2"
echo
VALUES=$(curl -s -X POST \
  http://localhost:4000/channels/mychannel/chaincodes/mycc \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"peers\": [\"peer0.org1.example.com\",\"peer0.org2.example.com\"],
  \"fcn\":\"createAccount\",
  \"args\":[\"Arianna\", \"001\", \"HK\", \"HKD\", \"1000\", \"BOCHK\"]
}")
echo $VALUES
# Assign previous invoke transaction id  to TRX_ID
MESSAGE=$(echo $VALUES | jq -r ".message")
TRX_ID=${MESSAGE#*ID: }
echo

echo "POST invoke chaincode 1 on peers of Org1 and Org2"
echo
VALUES=$(curl -s -X POST \
  http://localhost:4000/channels/mychannel/chaincodes/mycc \
  -H "authorization: Bearer $ORG2_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"peers\": [\"peer0.org2.example.com\",\"peer0.org1.example.com\"],
  \"fcn\":\"createAccount\",
  \"args\":[\"Arianna\", \"001\", \"CHN\", \"CNY\", \"1000\", \"BOC\"]
}")
echo $VALUES
# Assign previous invoke transaction id  to TRX_ID
MESSAGE=$(echo $VALUES | jq -r ".message")
TRX_ID=${MESSAGE#*ID: }
echo