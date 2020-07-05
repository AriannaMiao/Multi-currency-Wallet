package main

import (
	//"bytes"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	sc "github.com/hyperledger/fabric/protos/peer"
)

var logger = shim.NewLogger("transfer_cc")

type SmartContract struct {
}

//Define the bank structure
type Bank struct {
	Name string `json:"name"`
	BankID string `json:"bankID`
	Region string `json:"region"`
	Currency string `json:"currency"` //Currency type
	Reserves float64 `json:"reserves"`
}

//Define the account structure
type Account struct {
	Name string `json:"name"`
	CustID string `json:"custID"` //Same for different accounts of one person
	Region string `json:"region"`
	Currency string `json:"currency"` //Currency type
	Balance float64 `json:"balance"`
	BankID string `json:"bankID"` 
}

type Forex struct {
	Pair string `json:"pair"`
	Rate float64 `json:"rate"`
}

//The initial method
func (t *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
	logger.Info("########### transfer Init ###########")
	return shim.Success(nil)
}

//The invoke method to run an application
func (t *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) sc.Response {
	// Retrieve the requested function and arguments
	function, args := APIstub.GetFunctionAndParameters()

	if function == "initLedger" {
		return t.initLedger(APIstub)
	} else if function == "createBank" {
		return t.createBank(APIstub, args)
	} else if function == "createAccount" {
		return t.createAccount(APIstub, args)
	} else if function == "createForex" {
		return t.createForex(APIstub, args)
	} else if function == "query" {
		return t.query(APIstub, args)
	} else if function == "pay" {
		return t.pay(APIstub, args)
	} else if function == "delete" {
		return t.delete(APIstub, args)
	}

	return shim.Error("Invalid function name or usage.")
}

//Realize the functions
func (t *SmartContract) initLedger(APIstub shim.ChaincodeStubInterface) sc.Response {
	banks := []Bank{
		{Name: "BOA", BankID: "US_001", Region: "US", Currency: "USD", Reserves: 1000000.0},
		{Name: "BOUK", BankID: "UK_001", Region: "UK", Currency: "GBP", Reserves: 1000000.0},
		{Name: "BOJ", BankID: "Japan_001", Region: "JAPAN", Currency: "JPY", Reserves: 10000000.0},
	}

	accounts := []Account{
		{Name: "US_John", CustID: "001", Region: "US", Currency: "USD", Balance: 10000.0, BankID: "US_Bank01"},
		{Name: "US_Alice", CustID: "002", Region: "US", Currency: "USD", Balance: 10000.0, BankID: "US_Bank01"},
		{Name: "UK_John", CustID: "001", Region: "UK", Currency: "GBP", Balance: 10000.0, BankID: "UK_Bank01"},
		{Name: "UK_Alice", CustID: "002", Region: "UK", Currency: "GBP", Balance: 10000.0, BankID: "UK_Bank01"},
		{Name: "JPY_John", CustID: "001", Region: "Japan", Currency: "JPY", Balance: 1000000.0, BankID: "Japan_Bank01"},
		{Name: "JPY_Alice", CustID: "002", Region: "Japan", Currency: "JPY", Balance: 1000000.0, BankID: "Japan_Bank01"},
	}

	forex := []Forex{
		{Pair: "RMB:HKD", Rate: 1.0925},
		{Pair: "HKD:RMB", Rate: 0.9153},
		{Pair: "HKD:USD", Rate: 0.1290},
		{Pair: "USD:HKD", Rate: 7.7501},
	}

	writeForexToLedger(APIstub, forex)
	writeBankToLedger(APIstub, banks)
	writeAccountToLedger(APIstub, accounts)

	return shim.Success(nil)
}

func (t *SmartContract) createForex(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments for creating a forex (Expecting 2).")
	}

	rate, _ := strconv.ParseFloat(args[1], 64)
	forex := []Forex{{Pair: args[0], Rate: rate}}

	writeForexToLedger(APIstub, forex)
	return shim.Success(nil)
}

func (t *SmartContract) createBank(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	if len(args) != 5 {
		return shim.Error("Incorrect number of arguments for creating a bank (Expecting 5).")
	}

	reserves, _ := strconv.ParseFloat(args[4], 64)
	banks := []Bank{Bank{Name: args[0], BankID: args[1], Region: args[2], Currency: args[3], Reserves: reserves}}

	writeBankToLedger(APIstub, banks)
	return shim.Success(nil)
}

func (t *SmartContract) createAccount(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	if len(args) != 6 {
		return shim.Error("Incorrect number of arguments for creating an account (Expecting 6).")
	}

	balance, _ := strconv.ParseFloat(args[4], 64)
	accounts := []Account{{Name: args[0], CustID: args[1], Region: args[2], Currency: args[3], Balance: balance, BankID: args[5]}}

	writeAccountToLedger(APIstub, accounts)
	return shim.Success(nil)
}

func (t *SmartContract) query(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments (Expecting 1).")
	}

	asBytes, _ := APIstub.GetState(args[0])
	return shim.Success(asBytes)
}

func (t *SmartContract) delete(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments (Expecting 1).")
	}

	err := APIstub.DelState(args[0])
	if err != nil {
		return shim.Error("Failed to delete state")
	}

	return shim.Success(nil)
}

func (t *SmartContract) pay(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments (Expecting 3).")
	}

	payAmount, _ := strconv.ParseFloat(args[2], 64)

	//get FROM customer from ledger
	fromCustAsBytes, _ := APIstub.GetState(args[0])
	fromCustomer := Account{}
	if fromCustAsBytes == nil {
		return shim.Error("Invalid from account.")
	}

	json.Unmarshal(fromCustAsBytes, &fromCustomer)
	fromCustomerName := fromCustomer.Name
	fromCustomerCustID := fromCustomer.CustID
	fromCurrency := fromCustomer.Currency
	fromBalance := float64(fromCustomer.Balance)
	fromBank := fromCustomer.BankID

	//check if customer has enough balance to cover the payment
	if fromBalance < payAmount {
		errMsg := "Insufficent funds in customer: " + fromCustomerName + " Customer ID: " + fromCustomerCustID
		return shim.Error(errMsg)
	}

	//get TO customer from ledger
	toCustAsBytes, _ := APIstub.GetState(args[1])
	toCustomer := Account{}
	if toCustAsBytes == nil {
		return shim.Error("Invalid to account.")
	}

	json.Unmarshal(toCustAsBytes, &toCustomer)
	toCustomerName := toCustomer.Name
	toCurrency := toCustomer.Currency
	toBalance := float64(toCustomer.Balance)
	toBank := toCustomer.BankID

	//get exchange rate from the ledger
	toForexPairAsBytes, _ := APIstub.GetState(fromCurrency + ":" + toCurrency)
	forexPair := Forex{}
	json.Unmarshal(toForexPairAsBytes, &forexPair)
	exchangeRate := forexPair.Rate

	//get bank  FROM ledger
	fromCustBankAsBytes, _ := APIstub.GetState(fromBank)

	fromCustomerBank := Bank{}
	json.Unmarshal(fromCustBankAsBytes, &fromCustomerBank)
	fromBankReserves := fromCustomerBank.Reserves

	//check if bank has reserves to cover the transfer
	if fromBankReserves < payAmount {
		errMsg := "Insufficent funds in bank reserves: " + fromCustomerBank.Name + " Bank ID: " + fromCustomerBank.BankID
		return shim.Error(errMsg)
	}

	//reduce FROM customer balance by payment amount
	fromCustomer.Balance = fromBalance - payAmount
	//reduce FROM bank reservers by payment amount
	fromCustomerBank.Reserves = fromBankReserves - payAmount

	//increase TO customer balance by payment amount
	toCustomer.Balance = toBalance + (payAmount * exchangeRate)
	//get bank  TO ledger
	toCustBankAsBytes, _ := APIstub.GetState(toBank)
	toCustomerBank := Bank{}
	json.Unmarshal(toCustBankAsBytes, &toCustomerBank)
	//increase TO bank reservers by payment amount
	toCustomerBank.Reserves = toCustomerBank.Reserves + (payAmount * exchangeRate)

	//write all changed assets to the ledger
	fromCustAsBytes, _ = json.Marshal(fromCustomer)
	err := APIstub.PutState(args[0], fromCustAsBytes)
	if err != nil {
		return shim.Error("Error writing updates to FROM customer account " + fromCustomer.Name)
	}

	toCustAsBytes, _ = json.Marshal(toCustomer)
	err = APIstub.PutState(args[1], toCustAsBytes)
	if err != nil {
		return shim.Error("Error writing updates to TO customer account " + toCustomer.Name)
	}
	fromCustBankAsBytes, _ = json.Marshal(fromCustomerBank)
	err = APIstub.PutState(fromBank, fromCustBankAsBytes)
	if err != nil {
		return shim.Error("Error writing updates to FROM Bank account " + fromCustomerBank.Name)
	}
	toCustBankAsBytes, _ = json.Marshal(toCustomerBank)
	err = APIstub.PutState(toBank, toCustBankAsBytes)
	if err != nil {
		return shim.Error("Error writing updates to TO Bank account " + toCustomerBank.Name)
	}

	if err == nil {
		fmt.Println("~~~~~~~~~~~~~~~~~ Success fully transferred: ", payAmount, " From: ", fromCustomerName, " TO: ", toCustomerName, "~~~~~~~~~~~~~~~~~")
	} else {
		return shim.Error("Fail at last.")
	}

	return shim.Success(nil)
}

func writeForexToLedger(APIstub shim.ChaincodeStubInterface, forex []Forex) sc.Response {
	for i := 0; i < len(forex); i ++ {
		key := forex[i].Pair
		chkBytes, _ := APIstub.GetState(key)
		if chkBytes == nil {
			asBytes, _ := json.Marshal(forex[i])
			err := APIstub.PutState(forex[i].Pair, asBytes)
			if err != nil {
				return shim.Error(err.Error())
			}
		} else {
			asBytes, _ := json.Marshal(forex[i])
			err := APIstub.PutState(forex[i].Pair, asBytes)
			if err != nil {
				return shim.Error(err.Error())
			}
		}
	}
	return shim.Success(nil)
}

func writeBankToLedger(APIstub shim.ChaincodeStubInterface, banks []Bank) sc.Response {
	for i := 0; i < len(banks); i ++ {
		key := banks[i].BankID
		check, _ := APIstub.GetState(key)

		if check == nil { //it is not already present
			json_line, _ := json.Marshal(banks[i])
			err := APIstub.PutState(key, json_line)
			if err != nil {
				return shim.Error(err.Error())
			}
		} else {
			msg := "Bank with key " + key + " already exists, skipping ......."
			return shim.Error(msg)
		}
	}
	return shim.Success(nil)
}

func writeAccountToLedger(APIstub shim.ChaincodeStubInterface, accounts []Account) sc.Response {
	for i := 0; i < len(accounts); i ++ {
		key := accounts[i].Name + "_" + accounts[i].CustID
		check, _ := APIstub.GetState(key)

		if check == nil { //it is not already present
			json_line, _ := json.Marshal(accounts[i])
			err := APIstub.PutState(key, json_line)
			if err != nil {
				return shim.Error(err.Error())
			}
		} else {
			msg := "Account with key " + key + " already exists, skipping ......."
			return shim.Error(msg)
		}
	}
	return shim.Success(nil)
}

//Main function
func main() {
	// Create a new Smart Contract
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error creating new SmartContract: %s", err)
	}
	fmt.Println("Successfully initialized SmartContract.")
}