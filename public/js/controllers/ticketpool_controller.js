/* global Dygraph */
/* global Chart */

/* global $ */
import { Controller } from 'stimulus'
import ws from '../services/messagesocket_service'
import { barChartPlotter } from '../helpers/chart_helper'

// Common code for ploting dygraphs
function legendFormatter (data) {
  if (data.x == null) return ''
  var html = this.getLabels()[0] + ': ' + data.xHTML
  data.series.map(function (series) {
    var labeledData = ' <span style="color: ' + series.color + ';">' + series.labelHTML + ': ' + series.yHTML
    html += '<br>' + series.dashHTML + labeledData + '</span>'
  })
  return html
}

// Plotting the actual ticketpool graphs
var ms = 0
var origDate = 0

function Comparator (a, b) {
  if (a[0] < b[0]) return -1
  if (a[0] > b[0]) return 1
  return 0
}

function purchasesGraphData (items, memP) {
  var s = []
  var finalDate = ''

  items.time.map(function (n, i) {
    finalDate = new Date(n * 1000)
    s.push([finalDate, 0, items.immature[i], items.live[i], items.price[i]])
  })

  if (!isNaN(memP.time)) {
    s.push([new Date((memP.time[0] + 60) * 1000), memP.mempool[0], 0, 0, memP.price[0]]) // add mempool
  }

  origDate = s[0][0] - new Date(0)
  ms = (finalDate - new Date(0)) + 1000

  return s
}

function priceGraphData (items, memP) {
  var mempl = 0
  var mPrice = 0
  var mCount = 0
  var p = []

  if (!isNaN(memP.price)) {
    mPrice = memP.price[0]
    mCount = memP.mempool[0]
  }

  items.price.map((n, i) => {
    if (n === mPrice) {
      mempl = mCount
      p.push([n, mempl, items.immature[i], items.live[i]])
    } else {
      p.push([n, 0, items.immature[i], items.live[i]])
    }
  })

  if (mempl === 0) {
    p.push([mPrice, mCount, 0, 0]) // add mempool
    p = p.sort(Comparator)
  }

  return p
}

function getVal (val) { return isNaN(val) ? 0 : val }

function outputsGraphData (items) {
  return [
    getVal(items.solo),
    getVal(items.pooled),
    getVal(items.txsplit)
  ]
}

function getWindow (val) {
  switch (val) {
    case 'day': return [(ms - 8.64E+07) - 1000, ms]
    case 'wk': return [(ms - 6.048e+8) - 1000, ms]
    case 'mo': return [(ms - 2.628e+9) - 1000, ms]
    default: return [origDate, ms]
  }
}

var commonOptions = {
  retainDateWindow: false,
  showRangeSelector: true,
  digitsAfterDecimal: 8,
  fillGraph: true,
  stackedGraph: true,
  plotter: barChartPlotter,
  legendFormatter: legendFormatter,
  labelsSeparateLines: true,
  ylabel: 'Number of Tickets',
  legend: 'follow'
}

function purchasesGraph () {
  var d = purchasesGraphData(window.graph[0], window.mpl)
  var p = {

    labels: ['Date', 'Mempool Tickets', 'Immature Tickets', 'Live Tickets', 'Ticket Value'],
    colors: ['#FF8C00', '#006600', '#2971FF', '#ff0090'],
    title: 'Tickets Purchase Distribution',
    y2label: 'A.v.g. Tickets Value (DCR)',
    dateWindow: getWindow('day'),
    series: {
      'Ticket Value': {
        axis: 'y2',
        plotter: Dygraph.Plotters.linePlotter
      }
    },
    axes: { y2: { axisLabelFormatter: function (d) { return d.toFixed(1) } } }
  }
  return new Dygraph(
    document.getElementById('tickets_by_purchase_date'),
    d, { ...commonOptions, ...p }
  )
}

function priceGraph () {
  var d = priceGraphData(window.graph[1], window.mpl)
  var p = {
    labels: ['Price', 'Mempool Tickets', 'Immature Tickets', 'Live Tickets'],
    colors: ['#FF8C00', '#006600', '#2971FF'],
    title: 'Ticket Price Distribution',
    labelsKMB: true,
    xlabel: 'Ticket Price (DCR)'
  }
  return new Dygraph(
    document.getElementById('tickets_by_purchase_price'),
    d, { ...commonOptions, ...p }
  )
}

function outputsGraph () {
  var d = outputsGraphData(window.chart)
  return new Chart(
    document.getElementById('doughnutGraph'), {
      options: {
        width: 200,
        height: 200,
        responsive: false,
        animation: { animateScale: true },
        legend: { position: 'bottom' },
        title: {
          display: true,
          text: 'Number of Ticket Outputs'
        },
        tooltips: {
          callbacks: {
            label: function (tooltipItem, data) {
              var sum = 0
              var currentValue = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]
              d.map((u) => { sum += u })
              return currentValue + ' Tickets ( ' + ((currentValue / sum) * 100).toFixed(2) + '% )'
            }
          }
        }
      },
      type: 'doughnut',
      data: {
        labels: ['Solo', 'VSP Tickets', 'TixSplit'],
        datasets: [{
          data: d,
          label: 'Solo Tickets',
          backgroundColor: ['#2971FF', '#FF8C00', '#41BF53'],
          borderColor: ['white', 'white', 'white'],
          borderWidth: 0.5
        }]
      }
    })
}

export default class extends Controller {
  static get targets () {
    return [ 'zoom', 'bars', 'age' ]
  }

  initialize () {
    this.zoom = 'day'
    this.bars = 'all'
    $.getScript('/js/vendor/dygraphs.min.js', () => {
      this.purchasesGraph = purchasesGraph()
      this.priceGraph = priceGraph()
    })
    $.getScript('/js/vendor/charts.min.js', () => {
      this.outputsGraph = outputsGraph()
    })
  }

  connect () {
    ws.registerEvtHandler('newblock', () => {
      ws.send('getticketpooldata', this.bars)
    })

    ws.registerEvtHandler('getticketpooldataResp', (evt) => {
      if (evt === '') {
        return
      }
      var v = JSON.parse(evt).ticket_pool_data
      window.mpl = v.Mempool
      this.purchasesGraph.updateOptions({ 'file': purchasesGraphData(v.BarGraphs[0], window.mpl),
        dateWindow: getWindow(this.zoom) })
      this.priceGraph.updateOptions({ 'file': priceGraphData(v.BarGraphs[1], window.mpl) })

      this.outputsGraph.data.datasets[0].data = outputsGraphData(v.DonutChart)
      this.outputsGraph.update()
    })
  }

  disconnect () {
    this.purchasesGraph.destroy()
    this.priceGraph.destroy()

    ws.deregisterEvtHandlers('ticketpool')
    ws.deregisterEvtHandlers('getticketpooldataResp')
  }

  onZoom (e) {
    $(this.zoomTargets).each((i, zoomTarget) => {
      $(zoomTarget).removeClass('btn-active')
    })
    $(e.target).addClass('btn-active')
    this.zoom = e.target.name
    this.purchasesGraph.updateOptions({ dateWindow: getWindow(this.zoom) })
  }

  onBarsChange (e) {
    $(this.barsTargets).each((i, barsTarget) => {
      $(barsTarget).removeClass('btn-active')
    })
    this.bars = e.target.name
    $(e.target).addClass('btn-active')
    $('body').addClass('loading')
    var _this = this

    $.ajax({
      type: 'GET',
      url: '/api/ticketpool/bydate/' + this.bars,
      beforeSend: function () {},
      error: function () {
        $('body').removeClass('loading')
      },
      success: function (data) {
        _this.purchasesGraph.updateOptions({ 'file': purchasesGraphData(data.ticket_pool_data, window.mpl) })
        $('body').removeClass('loading')
      }
    })
  }
}
