document.addEventListener('DOMContentLoaded', function () {

L.mapbox.accessToken = 'pk.eyJ1IjoiZm9ycmVzdG8iLCJhIjoiY2lwOGtmN2s0MDE4dXRqbm91eWIzbzhqZiJ9.ythDls7OnKQKEPL6iq5p8Q'

var geocoderControl = L.mapbox.geocoderControl('mapbox.places'
  , { autocomplete: true
    , keepOpen: true
    }
  )
  .on('select', function (event) {
    var lat = event.feature.center[1] // wat
    var lng = event.feature.center[0]
    marker.setLatLng(new L.latLng(lat, lng))

    setAddressText(event.feature.place_name)
    toggleAddress()

    locationToEd(event.feature.place_name)
  })

var EdAddress = L.Control.extend(
  { options:
    { position: 'topleft' }
  , onAdd:
    function (map) {
      var container = L.DomUtil.create('div', 'ed-address-control')
      var icon = L.DomUtil.create('div', 'mapbox-icon mapbox-icon-geocoder', container)
      var text = L.DomUtil.create('span', 'ed-address-control-text', container)
      text.textContent = ' '
      container.style.cursor = 'pointer'
      container.addEventListener('click', function (event) {
        focus()
      })
      return container
    }
  }
)
var addressControl = new EdAddress()

function setAddressText (address) {
  var addressEl = addressControl.getContainer()
  if (!addressEl) return
  addressEl.querySelector('.ed-address-control-text').textContent = address
}

var addressVisible = true
function toggleAddress () {
  addressVisible = !addressVisible
  var addressEl = addressControl.getContainer()
  var geocoderEl = geocoderControl.getContainer()
  addressEl.style.display = (addressVisible ? 'block' : 'none')
  geocoderEl.style.display = (addressVisible ? 'none' : 'block')
}

function focus () {
  if (addressVisible) {
    toggleAddress()
  }
  var geocoderEl = geocoderControl.getContainer()  
  var inputEl = geocoderEl.querySelector('input')
  inputEl.focus()
  inputEl.select()
}

var map = L.mapbox
  .map('map'
  , 'mapbox.streets'
  , { center: [20, -35]
    , zoom: 2
    }
  )
  .addControl(addressControl)
  .addControl(geocoderControl)
  .addEventListener('zoomend', function (event) {
    locationToEd()
  })
  
map.scrollWheelZoom.disable()

var marker = L.marker([20, -35]
  , { icon: L.mapbox.marker.icon({'marker-color': 'ff8888'})
    , draggable: true
    }
  )
  .addEventListener('dragend', function (event) {
    locationToEd()
  })
  .addTo(map)

function locationToEd (place_name) {
  if (!block) return
  if (!block.metadata) {
    block.metadata = {}
  }
  if (!block.metadata.geo) {
    block.metadata.geo = {}
  }
  var loc = marker.getLatLng()
  var zoom = map.getZoom()
  block.metadata.geo.latitude = loc.lat
  block.metadata.geo.longitude = loc.lng
  block.metadata.geo.zoom = zoom
  if (place_name) {
    block.metadata.address = place_name
  }
  send('changed', block)
}

function edToLocation () {
  if (!block || !block.metadata || !block.metadata.geo) return
  var geo = block.metadata.geo
  var loc =
    { lat: geo.latitude
    , lng: geo.longitude
    }
  map.setView(loc, geo.zoom)
  marker.setLatLng(loc)
  if (block.metadata.address) {
    setAddressText(block.metadata.address)
  }
}

function send (topic, payload) {
  if (!block || !block.id) return
  window.parent.postMessage(
    { topic: topic
    , id: block.id
    , payload: payload
    }
  , '*'
  )
}

var block = null

window.addEventListener('message', function (message) {
  switch (message.data.topic) {
    case 'setblock':
      block = message.data.payload
      edToLocation()
      break
    case 'focus':
      focus()
      break
  }
})

window.EdLocation = {map: map, block: block}

})