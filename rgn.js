/*     Rede Geodésica Nacional

Aluno 1: 57728 Pedro Silva <-- mandatory to fill
Aluno 2: 58315 Goncalo Carvalho <-- mandatory to fill

Comentario:

O ficheiro "rng.js" tem de incluir, logo nas primeiras linhas,
um comentário inicial contendo: o nome e número dos dois alunos que
realizaram o projeto; indicação de quais as partes do trabalho que
foram feitas e das que não foram feitas (para facilitar uma correção
sem enganos); ainda possivelmente alertando para alguns aspetos da
implementação que possam ser menos óbvios para o avaliador.

0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789

HTML DOM documentation: https://www.w3schools.com/js/js_htmldom.asp
Leaflet documentation: https://leafletjs.com/reference-1.7.1.html
*/



/* GLOBAL CONSTANTS */

const MAP_CENTRE =
	[38.661,-9.2044];  // FCT coordinates
const MAP_ID =
	"mapid";
const MAP_ATTRIBUTION =
	'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> '
	+ 'contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';
const MAP_URL =
	'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token='
	+ 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'
const MAP_ERROR =
	"https://upload.wikimedia.org/wikipedia/commons/e/e0/SNice.svg";
const MAP_LAYERS =
	["streets-v11", "outdoors-v11", "light-v10", "dark-v10", "satellite-v9",
		"satellite-streets-v11", "navigation-day-v1", "navigation-night-v1"]
const RESOURCES_DIR =
	"resources/";
const VG_ORDERS =
	["order1", "order2", "order3", "order4"];
const RGN_FILE_NAME =
	"rgn.xml";


/* GLOBAL VARIABLES */

let map = null;



/* USEFUL FUNCTIONS */

// Capitalize the first letter of a string.
function capitalize(str)
{
	return str.length > 0
			? str[0].toUpperCase() + str.slice(1)
			: str;
}

// Distance in km between to pairs of coordinates over the earth's surface.
// https://en.wikipedia.org/wiki/Haversine_formula
function haversine(lat1, lon1, lat2, lon2)
{
    function toRad(deg) { return deg * 3.1415926535898 / 180.0; }
    let dLat = toRad(lat2 - lat1), dLon = toRad (lon2 - lon1);
    let sa = Math.sin(dLat / 2.0), so = Math.sin(dLon / 2.0);
    let a = sa * sa + so * so * Math.cos(toRad(lat1)) * Math.cos(toRad(lat2));
    return 6372.8 * 2.0 * Math.asin (Math.sqrt(a))
}

function loadXMLDoc(filename)
{
	let xhttp = new XMLHttpRequest();
	xhttp.open("GET", filename, false);
	try {
		xhttp.send();
	}
	catch(err) {
		alert("Could not access the local geocaching database via AJAX.\n"
			+ "Therefore, no POIs will be visible.\n");
	}
	return xhttp.responseXML;	
}

function getAllValuesByTagName(xml, name)  {
	return xml.getElementsByTagName(name);
}

function getFirstValueByTagName(xml, name)  {
	return getAllValuesByTagName(xml, name)[0].childNodes[0].nodeValue;
}


/* POI */
class POI {
	constructor(xml) {
		this.name = getFirstValueByTagName(xml, "name");
		this.latitude = getFirstValueByTagName(xml, "latitude");
		this.longitude = getFirstValueByTagName(xml, "longitude");
	}
}


class VG extends POI {
	constructor(xml) {
		super(xml);
		this.altitude = getFirstValueByTagName(xml, "altitude");
		this.type = getFirstValueByTagName(xml, "type");
	}
}

class VG1 extends VG {
	constructor(xml) {
		super(xml);
		this.order = 1;
		this.marker
	}

	restrictions(vg2){
		return haversine(this.latitude, this.longitude, vg2.latitude, vg2.longitude) >=30 && 
			   haversine(this.latitude, this.longitude, vg2.latitude, vg2.longitude) <= 60
	}

	getPopup(vgs , marker){
		this.marker = marker
		let number = 0;
		for(let i = 0 ; i <vgs.length ; i++){
			if(haversine(this.latitude, this.longitude, vgs[i].latitude, vgs[i].longitude) <= 60 
			&& vgs[i]!==this)
				number++
		}

		return "<hr/>" + "<b>Número de Vgs num raio de 60Kms:</b> " + number

	}
}

class VG2 extends VG {
	constructor(xml) {
		super(xml);
		this.order = 2;
		this.marker
	}

	restrictions(vg2){
		return haversine(this.latitude, this.longitude, vg2.latitude, vg2.longitude) >=20 && 
			   haversine(this.latitude, this.longitude, vg2.latitude, vg2.longitude ) <= 30
	}

	getPopup(vgs, marker){
		this.marker = marker

		return " <hr/>" + "<input type = 'button' value = 'VGs a menos de 30 km' onClick = 'makeCircles(" + this.latitude + "," + this.longitude + "," + this.order + ")'>" ;  
	}
}

class VG3 extends VG {
	constructor(xml) {
		super(xml);
		this.order = 3;
		this.marker
	}

	restrictions(vg2){
		return haversine(this.latitude, this.longitude, vg2.latitude, vg2.longitude) >=5 && 
		       haversine(this.latitude, this.longitude, vg2.latitude, vg2.longitude ) <= 10
	}

	getPopup(vgs,marker){
		this.marker= marker
		return ""
	}
}

class VG4 extends VG {
	constructor(xml) {
		super(xml);
		this.order = 4;
		this.marker
	}

	restrictions(vg2){
		return true
	}

	getPopup(vgs,marker){
		this.marker= marker
		return ""
	}
}






/* MAP */

class Map {


	constructor(center, zoom) {
		this.lmap = L.map(MAP_ID).setView(center, zoom)

		this.addBaseLayers(MAP_LAYERS)

		let icons = this.loadIcons(RESOURCES_DIR)

		this.vgs = this.loadRGN(RESOURCES_DIR + RGN_FILE_NAME)
		
		this.markerCluster = L.markerClusterGroup()

		this.heightsCluster = L.markerClusterGroup({
			iconCreateFunction: function (cluster) {
				return new L.DivIcon({ html: "", iconSize: new L.Point(0, 0) })
			},
		})

		this.sameTypeCluster = L.markerClusterGroup({
			iconCreateFunction: function (cluster) {
				return new L.DivIcon({ html: "", iconSize: new L.Point(0, 0) })
			},
		})

		this.order2Cluster = L.markerClusterGroup({
			iconCreateFunction: function (cluster) {
				return new L.DivIcon({ html: "", iconSize: new L.Point(0, 0) })
			},
		})
		
		this.markersLayers = []

		this.heightCirclesLayers = []

		this.sameTypeLayers = []

		this.order2Layer = L.layerGroup()

		this.heights = []

		this.markVGS = []

		for(let i = 0; i<VG_ORDERS.length; ++i){
			this.markersLayers[i] = L.layerGroup()
		}

		for(let i = 0; i<VG_ORDERS.length; ++i){
			this.heightCirclesLayers[i] = L.layerGroup()
		}

		for(let i = 0; i<VG_ORDERS.length; ++i){
			this.heightCirclesLayers[i] = L.layerGroup()
		}

		for(let i = 0; i<VG_ORDERS.length; ++i){
			this.sameTypeLayers[i] = L.layerGroup()
		}	

		this.populate(icons, this.vgs);

		this.addClickHandler(e =>
			L.popup()
			.setLatLng(e.latlng)
			.setContent("You clicked the map at " + e.latlng.toString())
		);

		this.lmap.on('click', () => {
			this.heightsCluster.remove()
		})

		this.lmap.on('click', () => {
			this.sameTypeCluster.remove()
		})

		this.lmap.on('click', () => {
			this.order2Cluster.remove()
		})

		this.size = this.vgs.length	
		document.getElementById("visible_caches").textContent = this.size
		this.updateHeights(1,1)

		for(let i = 0; i<this.markersLayers.length; i++){
			let doc  = "visible_order" + (i+1)
			document.getElementById(doc).textContent = (this.markersLayers[i].getLayers().length);
		}

	}

	makeMapLayer(name, spec) {
		let urlTemplate = MAP_URL;
		let attr = MAP_ATTRIBUTION;
		let errorTileUrl = MAP_ERROR;
		let layer =
			L.tileLayer(urlTemplate, {
					minZoom: 6,
					maxZoom: 19,
					errorTileUrl: errorTileUrl,
					id: spec,
					tileSize: 512,
					zoomOffset: -1,
					attribution: attr
			});
		return layer;
	}

	addBaseLayers(specs) {
		let baseMaps = [];
		for(let i in specs)
			baseMaps[capitalize(specs[i])] =
				this.makeMapLayer(specs[i], "mapbox/" + specs[i]);
		baseMaps[capitalize(specs[0])].addTo(this.lmap);
		L.control.scale({maxWidth: 150, metric: true, imperial: false})
									.setPosition("topleft").addTo(this.lmap);
		L.control.layers(baseMaps, {}).setPosition("topleft").addTo(this.lmap);
		return baseMaps;
	}

	loadIcons(dir) {
		let icons = [];
		let iconOptions = {
			iconUrl: "??",
			shadowUrl: "??",
			iconSize: [16, 16],
			shadowSize: [16, 16],
			iconAnchor: [8, 8],
			shadowAnchor: [8, 8],
			popupAnchor: [0, -6] // offset the determines where the popup should open
		};
		for(let i = 0 ; i < VG_ORDERS.length ; i++) {
			iconOptions.iconUrl = dir + VG_ORDERS[i] + ".png";
		    icons[VG_ORDERS[i]] = L.icon(iconOptions);
		}
		return icons;
	}

	loadRGN(filename) {
		let xmlDoc = loadXMLDoc(filename);
		let xs = getAllValuesByTagName(xmlDoc, "vg"); 
		let vgs = [];
		if(xs.length == 0)
			alert("Empty file");
		else {

			for(let i = 0 ; i < xs.length ; i++){
				let order =  getFirstValueByTagName(xs[i], "order");
				switch(order){
				case "1":
					vgs[i] = new VG1(xs[i]);
				break;
				case "2":
					vgs[i] = new VG2(xs[i]);
				break;
				case "3":
					vgs[i] = new VG3(xs[i]);
				break;
				case "4":
					vgs[i] = new VG4(xs[i]);
				break;
				}	
			}
		}
		return vgs;
	}

	populate(icons, vgs)  {
		for(let i = 0 ; i < vgs.length ; i++)
			this.addMarker(icons, vgs[i]);
	}

	addMarker(icons, vg) {
		let marker = L.marker([vg.latitude, vg.longitude], {icon: icons['order'+vg.order]});
		let popup = 
			"I'm the marker of VG <b>" + vg.name + "</b>" 
			+ "<hr/>" + "<b>Latitude:</b> " + vg.latitude 
			+ "<br />" + "<b>Longitude:</b> " + vg.longitude
			+ "<br />" + "<b>Altitude:</b> " + vg.altitude
			+ "<hr/>" + "<b>Tipo:</b> " + vg.type
			+ "<hr/>" + "<b>Ordem:</b> " + vg.order
			+ "<hr/>" + `<input type ='button' value='Visualizar'
			 onClick='window.open("http://maps.google.com/maps?q=&layer=c&cbll=`+vg.latitude + "," + vg.longitude+`")'>`
			+ "<hr/>" + "<input type ='button' value='Mesmo tipo' onClick='addSameType(\"" + vg.type + "\")'>"
	
		
		marker.bindPopup(popup += vg.getPopup(this.vgs, marker)).bindTooltip(vg.name)

		this.addVariables(marker, vg, parseInt(vg.order))
	}


	addVariables(marker, vg, order){
		this.markersLayers[order-1].addLayer(marker);
		this.markVGS.push([marker,vg]);
		
		if(this.heights[order-1] == null){
			this.heights[order-1] = [vg, vg, 1];
		} else {
			 if(vg.altitude != "ND"){
				if(parseFloat(vg.altitude) > parseFloat(this.heights[order-1][0].altitude) ){
					this.heights[order-1][0] = vg;
				} 
				else if(parseFloat(vg.altitude) < parseFloat(this.heights[order-1][1].altitude)){
					this.heights[order-1][1] = vg;
				}
			}
		}
	}

	addToSize(number, order){
		this.size += number;
		document.getElementById("visible_caches").textContent = this.size;

		let doc  = "visible_order" + order 
		document.getElementById(doc).textContent = number;
	
	}

	removeFromSize(number, order){
		this.size -= number;

		document.getElementById("visible_caches").textContent = this.size;

		let doc = "visible_order" + order 
		document.getElementById(doc).textContent = 0;

	}

	updateHeights(order,addRemove){

		if(addRemove == 0){
			this.heights[(order-1)][2] = 0
		}else{
			this.heights[(order-1)][2] = 1
		}
			
		let alto = null;
		let baixo = null;

		for(let i = 0 ; i < this.heights.length; i++){

			if(this.heights[i][2] == 1){

				if(alto == null){
					alto = this.heights[i][0]
					baixo = this.heights[i][1]

				}else{
					if(parseFloat(alto.altitude) < parseFloat(this.heights[i][0].altitude) )
						alto = this.heights[i][0];
					
					if(parseFloat(baixo.altitude) > parseFloat(this.heights[i][1].altitude))
						baixo = this.heights[i][1];

				}
			}
		}		
				

		if(alto == null){
			document.getElementById("mais_alto").textContent = " nenhum VG no mapa"
			document.getElementById("mais_baixo").textContent = " nenhum VG no mapa"
		}else{
			document.getElementById("mais_alto").textContent = alto.name + " - " + alto.altitude
			document.getElementById("mais_baixo").textContent = baixo.name + " - " + baixo.altitude
		}

	}	


	addClickHandler(handler) {
		let m = this.lmap;
		function handler2(e) {
			return handler(e).openOn(m);
		}
		return this.lmap.on('click', handler2);
	}

	addCircle(pos, radius, popup) {
		let circle =
			L.circle(pos,
				radius,
				{color: 'red', fillColor: 'pink', fillOpacity: 0.4}
			);
		circle.addTo(this.lmap);
		if( popup != "" )
			circle.bindPopup(popup);
		return circle;
	}


	addLayerChecked(order){
		let group = this.markersLayers[order-1]

		this.markerCluster.addLayer(group).addTo(this.lmap)	
		this.heightsCluster.addLayer(this.heightCirclesLayers[order-1])
		this.sameTypeCluster.addLayer(this.sameTypeLayers[order-1])
		if(order === '2')
			this.order2Cluster.addLayer(this.order2Layer)

		this.updateHeights(order,1);
		this.addToSize(group.getLayers().length, order);
	}

	removeLayerChecked(order){
		let group = this.markersLayers[order-1]

		group.remove()	
		this.markerCluster.removeLayer(group)
		this.heightsCluster.removeLayer(this.heightCirclesLayers[order-1])
		this.sameTypeCluster.removeLayer(this.sameTypeLayers[order-1])
		if(order === '2')
			this.order2Cluster.removeLayer(this.order2Layer)

		this.updateHeights(order,0);
		this.removeFromSize(group.getLayers().length, order)
	}

	checkRestrictions(){
		let badVgs = [];
		let restrict;
		
		for(let i = 0; i < this.vgs.length; ++i){
			let j;
			restrict = false;
			for(j = 0 ; j < this.vgs.length; ++j){
				if(this.vgs[i].order === this.vgs[j].order){
					restrict = restrict || this.vgs[i].restrictions(this.vgs[j])	
				}
			}

			if(!restrict){
				badVgs.push(this.vgs[i])
			}
		}

		return badVgs;
	}

	addMarkersCluster(){
		for(let i = 0; i < this.markersLayers.length; ++i)
			//adding to Cluster
			this.markerCluster.addLayer(this.markersLayers[i])
		

		this.markerCluster.addTo(this.lmap)
	}

	circlesForEachVG(){

		for(let i = 0; i < this.vgs.length; ++i){
			let circle = 
				L.circle([parseFloat(this.vgs[i].latitude), parseFloat(this.vgs[i].longitude)],
					this.vgs[i].altitude === 'ND' ? 
					0 : 
					parseFloat(this.vgs[i].altitude) * parseFloat(3),
					this.vgs[i].altitude === 'ND' ? 
					{color: 'none', fillColor: 'blue', fillOpacity: 0} : 
					{color: 'blue', fillColor: 'blue', fillOpacity: 0.4}
				);
			//adding to layer group
			this.heightCirclesLayers[this.vgs[i].order-1].addLayer(circle);			
		}

		for(let i = 0; i <this.heightCirclesLayers.length; ++i)
			this.heightsCluster.addLayer(this.heightCirclesLayers[i])

	}

	addCirclesCluster(){
		this.heightsCluster.addTo(this.lmap)
	}

	addSameType(type){
		
		//resetar
		for(let i = 0; i < this.sameTypeLayers.length; ++i){
			this.sameTypeLayers[i] = L.layerGroup()
		}
		this.sameTypeCluster.clearLayers();

		//criar círculos 
		for(let i = 0; i < this.vgs.length; ++i){
			if(this.markerCluster.hasLayer(this.vgs[i].marker)){
				let circle = 
					L.circle(
						[parseFloat(this.vgs[i].latitude), parseFloat(this.vgs[i].longitude)],
						parseFloat(500),
						this.vgs[i].type === type ?
						{color: 'red', fillColor: 'red', fillOpacity: 0.4}:
						{color: 'none', fillColor: 'purple', fillOpacity: 0}
					)
				this.sameTypeLayers[this.vgs[i].order - 1].addLayer(circle)
			}	
		}
		
		//adicionar ao cluster
		for(let i = 0; i < this.sameTypeLayers.length; ++i)
			this.sameTypeCluster.addLayers(this.sameTypeLayers[i]).addTo(this.lmap)
	}

	circlesVg2(lat,long,order){
		
		//resetar
		this.order2Layer = L.layerGroup()
		this.order2Cluster.clearLayers()

		//círculos
		for(let i = 0; i < this.vgs.length; ++i){
			if(this.markerCluster.hasLayer(this.vgs[i].marker)){
				let circle = 
					L.circle(
						[parseFloat(this.vgs[i].latitude), parseFloat(this.vgs[i].longitude)],
						parseFloat(500),
						(this.vgs[i].order === order && haversine(lat, long, this.vgs[i].latitude, this.vgs[i].longitude) <= 30) ?
						{color: 'red', fillColor: 'red', fillOpacity: 0.4}:
						{color: 'none', fillColor: 'purple', fillOpacity: 0}
					)
				this.order2Layer.addLayer(circle)	
			}
		}

		//adicionar
		this.order2Cluster.addLayers(this.order2Layer).addTo(this.lmap)
	
	}
}


/* FUNCTIONS for HTML */

function onLoad()
{
	map = new Map(MAP_CENTRE, 12);
	map.addCircle(MAP_CENTRE, 100, "FCT/UNL");
	map.addMarkersCluster();
	map.circlesForEachVG();
}



function checkboxUpdate(box){
	if(box.checked)
		map.addLayerChecked(box.id[5])
	else 
		map.removeLayerChecked(box.id[5])
}


function checkRestrictions(){
	let vgs = map.checkRestrictions()
	let string ='Estes são os pontos geodésicos que são inválidos:\n\n'

	for(let i = 0; i <vgs.length; i++)
		string += "\t\t\t• " + vgs[i].name + " ------> Ordem " + vgs[i].order + "\n"  
	

	alert(string)
}

function addCirclesCluster(){
	map.addCirclesCluster()
}

function addSameType(type){
	map.addSameType(type)
}

function makeCircles(lat,long,order){
	map.circlesVg2(lat,long,order)

}
