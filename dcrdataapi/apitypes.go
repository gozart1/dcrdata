// Copyright (c) 2017, Jonathan Chappelow
// See LICENSE for details.

package dcrdataapi

import (
	"github.com/decred/dcrd/dcrjson"
)

// much of the time, dcrdata will be using the types in dcrjson, but others are
// defined here

type BlockTransactions struct {
	Tx  []string `json:"tx"`
	STx []string `json:"stx"`
}

// tx raw
// tx short (tx raw - extra context)
// txout
// scriptPubKey (hex -> decodescript -> result)
// vout
// vin

type Tx struct {
	TxShort
	Confirmations int64    `json:"confirmations"`
	Block         *BlockID `json:"block,omitempty"`
}

type TxShort struct {
	Size     int32         `json:"size"`
	TxID     string        `json:"txid"`
	Version  int32         `json:"version"`
	Locktime uint32        `json:"locktime"`
	Expiry   uint32        `json:"expiry"`
	Vin      []dcrjson.Vin `json:"vin"`
	Vout     []Vout        `json:"vout"`
}

type BlockID struct {
	BlockHash   string `json:"blockhash"`
	BlockHeight int64  `json:"blockheight"`
	BlockIndex  uint32 `json:"blockindex"`
	Time        int64  `json:"time"`
	BlockTime   int64  `json:"blocktime"`
}

type VoutMined struct {
	Vout
	BestBlock     string `json:"bestblock"`
	Confirmations int64  `json:"confirmations"`
	Coinbase      bool   `json:"coinbase"`
}

type Vout struct {
	Value               float64      `json:"value"`
	N                   uint32       `json:"n"`
	Version             uint16       `json:"version"`
	ScriptPubKeyDecoded ScriptPubKey `json:"scriptPubKey"`
}

type VoutHexScript struct {
	Value           float64 `json:"value"`
	N               uint32  `json:"n"`
	Version         uint16  `json:"version"`
	ScriptPubKeyHex string  `json:"scriptPubKey"`
}

// decodescript(ScriptPubKeyHex) -> ScriptPubKey
type ScriptPubKey struct {
	Asm       string   `json:"asm"`
	ReqSigs   int32    `json:"reqSigs,omitempty"`
	Type      string   `json:"type"`
	Addresses []string `json:"addresses,omitempty"`
	CommitAmt *float64 `json:"commitamt,omitempty"`
}

// TxOut defines a decred transaction output.
type TxOut struct {
	Value     float64  `json:"value"`
	Version   uint16   `json:"version"`
	PkScript  string   `json:"pkscript"`
	Addresses []string `json:"addresses,omitempty"`
}

// TxIn defines a decred transaction input.
type TxIn struct {
	// Non-witness
	PreviousOutPoint OutPoint `json:"prevout"`
	Sequence         uint32   `json:"sequence"`

	// Witness
	ValueIn         float64 `json:"value"`
	BlockHeight     uint32  `json:"blockheight"`
	BlockIndex      uint32  `json:"blockindex"`
	SignatureScript string  `json:"sigscript"`
}

// OutPoint is used to track previous transaction outputs.
type OutPoint struct {
	Hash  string `json:"hash"`
	Index uint32 `json:"index"`
	Tree  int8   `json:"tree"`
}

//Address models the address string with the transactions as AddressTx
type Address struct {
	Address      string            `json:"address"`
	Transactions []*AddressTxShort `json:"address transactions"`
}

//AddressTxRaw is modeled from SearchRawTransactionsResult but with size in place of hex
type AddressTxRaw struct {
	Size          int32                `json:"size"`
	TxID          string               `json:"txid"`
	Version       int32                `json:"version"`
	Locktime      uint32               `json:"locktime"`
	Vin           []dcrjson.VinPrevOut `json:"vin"`
	Vout          []Vout               `json:"vout"`
	Confirmations int64                `json:"confirmations"`
	BlockHash     string               `json:"blockhash"`
	Time          int64                `json:"time,omitempty"`
	Blocktime     int64                `json:"blocktime,omitempty"`
}

//AddressTxShort is a subset of AddressTx with just the basic tx details pertaining the
//particular address
type AddressTxShort struct {
	TxID   string           `json:"txid"`
	Time   int64            `json:"time"`
	Values []AddressTxValue `json:"values"`
}

//AddressTxValue contains the amount involved and type of value (in / out) for an
//address in a transaction
type AddressTxValue struct {
	ValueType string  `json:"value type"`
	Amount    float64 `json:"amount"`
}

// below are notes essentially copy-paste from dcrjson

// type Vin struct {
// 	Coinbase    string     `json:"coinbase"`
// 	Txid        string     `json:"txid"`
// 	Vout        uint32     `json:"vout"`
// 	Tree        int8       `json:"tree"`
// 	Sequence    uint32     `json:"sequence"`
// 	AmountIn    float64    `json:"amountin"`
// 	BlockHeight uint32     `json:"blockheight"`
// 	BlockIndex  uint32     `json:"blockindex"`
// 	ScriptSig   *ScriptSig `json:"scriptSig"`
// }

type ScriptSig struct {
	Asm string `json:"asm"`
	Hex string `json:"hex"`
}

// PrevOut represents previous output for an input Vin.
type PrevOut struct {
	Addresses []string `json:"addresses,omitempty"`
	Value     float64  `json:"value"`
}

// VinPrevOut is like Vin except it includes PrevOut.  It is used by searchrawtransaction
type VinPrevOut struct {
	Coinbase    string     `json:"coinbase"`
	Txid        string     `json:"txid"`
	Vout        uint32     `json:"vout"`
	Tree        int8       `json:"tree"`
	AmountIn    *float64   `json:"amountin,omitempty"`
	BlockHeight *uint32    `json:"blockheight,omitempty"`
	BlockIndex  *uint32    `json:"blockindex,omitempty"`
	ScriptSig   *ScriptSig `json:"scriptSig"`
	PrevOut     *PrevOut   `json:"prevOut"`
	Sequence    uint32     `json:"sequence"`
}

// end copy-paste from dcrjson

// Status indicates the state of the server, including the API version and the
// software version.
type Status struct {
	Ready           bool   `json:"ready"`
	DBHeight        uint32 `json:"db_height"`
	Height          uint32 `json:"node_height"`
	NodeConnections int64  `json:"node_connections"`
	APIVersion      int    `json:"api_version"`
	DcrdataVersion  string `json:"dcrdata_version"`
}

// TicketPoolInfo models data about ticket pool
type TicketPoolInfo struct {
	Size   uint32  `json:"size"`
	Value  float64 `json:"value"`
	ValAvg float64 `json:"valavg"`
}

type TicketPoolValsAndSizes struct {
	StartHeight uint32    `json:"start_height"`
	EndHeight   uint32    `json:"end_height"`
	Value       []float64 `json:"value"`
	Size        []float64 `json:"size"`
}

type BlockDataBasic struct {
	Height     uint32  `json:"height"`
	Size       uint32  `json:"size"`
	Hash       string  `json:"hash"`
	Difficulty float64 `json:"diff"`
	StakeDiff  float64 `json:"sdiff"`
	Time       int64   `json:"time"`
	//TicketPoolInfo
	PoolInfo TicketPoolInfo `json:"ticket_pool"`
}

type StakeDiff struct {
	dcrjson.GetStakeDifficultyResult
	Estimates        dcrjson.EstimateStakeDiffResult `json:"estimates"`
	IdxBlockInWindow int                             `json:"window_block_index"`
	PriceWindowNum   int                             `json:"window_number"`
}

type StakeInfoExtended struct {
	Feeinfo          dcrjson.FeeInfoBlock `json:"feeinfo"`
	StakeDiff        float64              `json:"stakediff"`
	PriceWindowNum   int                  `json:"window_number"`
	IdxBlockInWindow int                  `json:"window_block_index"`
	PoolInfo         TicketPoolInfo       `json:"ticket_pool"`
}

type StakeInfoExtendedEstimates struct {
	Feeinfo          dcrjson.FeeInfoBlock `json:"feeinfo"`
	StakeDiff        StakeDiff            `json:"stakediff"`
	PriceWindowNum   int                  `json:"window_number"`
	IdxBlockInWindow int                  `json:"window_block_index"`
	PoolInfo         TicketPoolInfo       `json:"ticket_pool"`
}

type MempoolTicketFeeInfo struct {
	Height uint32 `json:"height"`
	Time   int64  `json:"time"`
	dcrjson.FeeInfoMempool
	LowestMineable float64 `json:"lowest_mineable"`
}

type MempoolTicketFees struct {
	Height   uint32    `json:"height"`
	Time     int64     `json:"time"`
	Length   uint32    `json:"length"`
	Total    uint32    `json:"total"`
	FeeRates []float64 `json:"top_fees"`
}

type TicketDetails struct {
	Hash    string  `json:"hash"`
	Fee     float64 `json:"abs_fee"`
	FeeRate float64 `json:"fee"`
	Size    int32   `json:"size"`
	Height  int64   `json:"height_received"`
}

type MempoolTicketDetails struct {
	Height  uint32         `json:"height"`
	Time    int64          `json:"time"`
	Length  uint32         `json:"length"`
	Total   uint32         `json:"total"`
	Tickets TicketsDetails `json:"tickets"`
}

type TicketsDetails []*TicketDetails
