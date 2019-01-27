// Utitlities for keeping a shallow local copy of the mempool.

const mpKeys = {
  Regular: 'regular',
  Vote: 'vote',
  Ticket: 'ticket',
  Revocation: 'rev'
}

function txLists (mempool) {
  return [mempool.tx, mempool.tickets, mempool.votes, mempool.revs]
}

function txList (mempool) {
  var l = []
  txLists(mempool).forEach(txs => {
    if (!txs) return
    txs.forEach(tx => {
      l.push(tx)
    })
  })
  return l
}

function makeTx (txid, txType, total, voteInfo) {
  return {
    txid: txid,
    type: txType,
    total: total,
    voteInfo: voteInfo // null for all but votes
  }
}

function ticketSpent (vote) {
  var vi = vote.voteInfo || vote.vote_info
  return vi.ticket_spent
}

function reduceTx (tx) {
  return makeTx(tx.txid, tx.Type, tx.total, tx.vote_info)
}

export default class Mempool {
  constructor (d, tallyTargets) {
    this.mempool = []
    // Create dummy transactions. Since we're only looking at totals, this is
    // okay for now and prevents an initial websocket call for the entire mempool.
    this.initType('Regular', parseFloat(d.regTotal), parseInt(d.regCount))
    this.initType('Ticket', parseFloat(d.ticketTotal), parseInt(d.ticketCount))
    this.initType('Revocation', parseFloat(d.revTotal), parseInt(d.revCount))
    this.initVotes(tallyTargets, parseFloat(d.voteTotal), parseInt(d.voteCount))
  }

  initType (txType, total, count) {
    var fauxVal = total / count
    for (var i = 0; i < count; i++) {
      this.mempool.push(makeTx('', txType, fauxVal, null))
    }
  }

  initVotes (tallyTargets, total, count) {
    var fauxVal = total / count
    tallyTargets.forEach((span) => {
      let affirmed = parseInt(span.dataset.affirmed)
      for (var i = 0; i < parseInt(span.dataset.count); i++) {
        this.mempool.push(makeTx('', 'Vote', fauxVal, {
          block_validation: {
            hash: span.dataset.hash,
            validity: i < affirmed
          },
          ticket_spent: i
        }))
      }
    })
  }

  // Replace the entire contents of mempool. m is a JSON representation of the
  // explorertypes.MempoolInfo
  replace (m) {
    this.mempool = []
    txList(m).forEach(tx => {
      if (this.isQuestionableVote(tx)) return
      this.mempool.push(reduceTx(tx))
    })
  }

  // Merges the given explorertypes.MempoolInfo into the current mempool.
  mergeMempool (m) {
    this.mergeTxs(txList(m))
  }

  // Merges the []explorertypes.MempoolTx into the current mempool.
  mergeTxs (txs) {
    txs.forEach(tx => {
      if (this.wantsTx(tx)) {
        this.mempool.push(reduceTx(tx))
      }
    })
  }

  // Checks whether the transaction is new and likely to be included in a block.
  wantsTx (newTx) {
    if (this.isQuestionableVote(newTx)) return false
    for (var i = 0; i < this.mempool.length; i++) {
      if (this.mempool[i].txid === newTx.txid) return false
    }
    return true
  }

  // Some votes are for older blocks, or duplicates but with different agendas.
  isQuestionableVote (tx) {
    if (tx.Type !== 'Vote') return false
    if (!tx.vote_info.last_block) return true
    for (var i = 0; i < this.mempool.length; i++) {
      let v = this.mempool[i]
      if (v.type === 'Vote' && ticketSpent(v) === ticketSpent(tx)) return true
    }
  }

  votes (hash) {
    return this.mempool.reduce((votes, tx) => {
      if (tx.type !== 'Vote') return votes
      let validation = tx.voteInfo.block_validation
      if (validation.hash !== hash) return votes
      if (validation.validity) {
        votes.affirm++
      } else {
        votes.reject++
      }
      return votes
    }, {
      affirm: 0,
      reject: 0
    })
  }

  counts () {
    return this.mempool.reduce((d, tx) => {
      d.total += 1
      if (tx.type === 'Vote') {
        let validation = tx.voteInfo.block_validation
        if (!d.vote[validation.hash]) {
          d.vote[validation.hash] = this.votes(validation.hash)
        }
      } else {
        d[mpKeys[tx.type]] += 1
      }
      return d
    }, { regular: 0, ticket: 0, vote: {}, rev: 0, total: 0 })
  }

  totals () {
    return this.mempool.reduce((d, tx) => {
      d.total += tx.total
      d[mpKeys[tx.type]] += tx.total
      return d
    }, { regular: 0, ticket: 0, vote: 0, rev: 0, total: 0 })
  }
}
