# Multi-currency-Wallet
The following figure shows the overall structure of Multi-currency Wallet.

![](https://s1.ax1x.com/2020/07/31/alXzb8.png)

The underlying architecture is the blockchain network. The blockchain network is configured based on the samples provided by Hyperledger Fabric. It is comprised of basic components like CA, peer and ordering service. Blockchain Network provides interfaces for applications to interact with. We build a lite server to utilize the SDKs provided by Fabric.

The wallet itself is connected to both the blockchain network and the bank we created. The bank is the abstract of a set of functions managing the accounts. The wallet will access to the bank to verify the accounts. Then it can provide cross-border transfer services for users and interact with the blockchain network through the edge services.

### Prerequisites

- [Docker](https://www.docker.com/products/overview) - v1.12 or higher
- [Docker Compose](https://docs.docker.com/compose/overview/) - v1.8 or higher
- [Go](https://golang.org/dl/) v1.12 or higher
- **Node.js** v8.4.0 or higher



### Environment

First check the prerequisites above. For golang, $GOROOT and $GOPATH should be set.

```bash
export GOROOT=/usr/local/go
export GOPATH=$HOME/go
export PATH=$PATH:$GOROOT/bin:$GOPATH/bin
```

You should also start the docker.

```bash
sudo systemctl enable docker
```

After checking all the prerequisites, pull the images of Hyperledger Fabric.

```bash
curl -sSL http://bit.ly/2ysbOFE | bash -s -- 1.4.8 1.4.7 0.4.21
```

This command will pull images needed in this project.

Next, make sure that $GOPATH/src/github.com exists.

```bash
mkdir -p $GOPATH/src/github.com
```



### Start Network

Move the hyperledger directory to $GOPATH/src/github.com.

```bash
cd Multi-currency-Wallet
mv hyperledger/ $GOPATH/src/github.com/
```

Start the network.

```bash
cd Multi-currency-Wallet
npm rebuild
./runApp.sh
```

The network will start running with 3 CAs, 5 orderer nodes and 6 peeers. And a server providing interaction methods is listening on port 4000.



### Interact with the Network

You can interact with the running network through port 4000.

Here, we will show how to interact with the running network using curl command.

Enroll Users

```bash
curl -s -X POST \
  http://localhost:4000/users \
  -H "content-type: application/x-www-form-urlencoded" \
  -d 'username=BOCHK&orgName=Org1'
```

Create Channel

```bash
curl -s -X POST \
  http://localhost:4000/channels \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"channelName":"mychannel",
	"channelConfigPath":"../artifacts/channel/mychannel.tx"
}'
```

Join Channel

```bash
curl -s -X POST \
  http://localhost:4000/channels/mychannel/peers \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer0.org1.example.com","peer1.org1.example.com"]
}'
```

Install Chaincode

```bash
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
```

Instantiate Chaincode

```bash
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
```

Invoke Chaincode

```bash
curl -s -X POST \
  http://localhost:4000/channels/mychannel/chaincodes/mycc \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"peers\": [\"peer0.org1.example.com\",\"peer0.org2.example.com\"],
  \"fcn\":\"createBank\",
  \"args\":[\"BOCHK\",\"HK\",\"HKD\", \"100000\"]
}"
```

You can also interact with the network by sending requests or using Postman.

### Run the Wallet



### Run a Test Script



### Claim

Part of the network configuration files refer to [Fabric-Node-SDK-Raft](https://github.com/sciondev96/Fabric-Node-SDK-Raft).

Methods in app directory are adapted from [Hyperledger Fabric SDK for Node.js](https://hyperledger.github.io/fabric-sdk-node/) provided by [IBM](https://github.com/IBM).

